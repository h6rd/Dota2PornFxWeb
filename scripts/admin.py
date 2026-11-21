import argparse
import json
import os
import re
import secrets
import shlex
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import uuid
import webbrowser
import zipfile
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
ADD_MOD = HERE / "add_mod.py"
MIGRATE = HERE / "migrate_to_releases.py"
VALIDATE = HERE / "validate_data.py"
MODS_REL = "assets/data/mods.json"
IMG_TYPES = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
}
APP = None


# helpers


def slug(s, fallback="mod"):
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", str(s).strip()).strip("-._")
    return s or fallback


def sha256_file(path):
    import hashlib

    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def now_ts():
    return int(time.time())


def category_lists(content):
    """-> [(group_or_None, list_of_mods)] for a category (plain list or {groups:[...]})"""
    if isinstance(content, list):
        return [(None, content)]
    if isinstance(content, dict) and isinstance(content.get("groups"), list):
        return [
            (g, g["mods"])
            for g in content["groups"]
            if isinstance(g, dict) and isinstance(g.get("mods"), list)
        ]
    return []


def find_mod(data, category, name):
    for g, lst in category_lists((data.get("modsData") or {}).get(category)):
        for i, m in enumerate(lst):
            if isinstance(m, dict) and m.get("name") == name:
                return g, lst, i
    return None


def name_taken(data, category, name):
    low = name.strip().lower()
    for _g, lst in category_lists((data.get("modsData") or {}).get(category)):
        for m in lst:
            if isinstance(m, dict) and str(m.get("name", "")).strip().lower() == low:
                return True
    return False


def file_refs(entry):
    """[(target, value)] for every zip reference of a mod entry"""
    out = []
    for k in ("file", "fileWin", "fileLinux"):
        if isinstance(entry.get(k), str) and entry[k]:
            out.append((k, entry[k]))
    for i, st in enumerate(entry.get("styles") or []):
        if isinstance(st, dict):
            for k in ("file", "fileWin", "fileLinux"):
                if isinstance(st.get(k), str) and st[k]:
                    out.append((f"styles.{i}.{k}", st[k]))
    return out


def preview_refs(entry):
    out = []
    if isinstance(entry.get("preview"), str) and entry["preview"]:
        out.append(("preview", entry["preview"]))
    for i, st in enumerate(entry.get("styles") or []):
        if (
            isinstance(st, dict)
            and isinstance(st.get("preview"), str)
            and st["preview"]
        ):
            out.append((f"styles.{i}.preview", st["preview"]))
    return out


def path_get(entry, target):
    cur = entry
    for part in target.split("."):
        cur = cur[int(part)] if isinstance(cur, list) else cur[part]
    return cur


def path_set(entry, target, value):
    parts = target.split(".")
    cur = entry
    for part in parts[:-1]:
        cur = cur[int(part)] if isinstance(cur, list) else cur[part]
    last = parts[-1]
    if isinstance(cur, list):
        cur[int(last)] = value
    else:
        cur[last] = value


def simple_name(value):
    return (
        isinstance(value, str)
        and value
        and "/" not in value
        and "\\" not in value
        and ".." not in value
        and not value.startswith(("http://", "https://"))
    )


def touch_recent(data, category, name):
    rec = data.get("recentlyAddedMods")
    if not isinstance(rec, list):
        rec = data["recentlyAddedMods"] = []
    rec[:] = [
        r
        for r in rec
        if not (
            isinstance(r, dict)
            and r.get("name") == name
            and r.get("category") == category
        )
    ]
    rec.insert(0, {"name": name, "category": category})


# app state
class Job:
    def __init__(self):
        self.id = uuid.uuid4().hex[:10]
        self.lines = []
        self.status = "running"
        self.error = None
        self.lock = threading.Lock()

    def log(self, line):
        with self.lock:
            self.lines.append(str(line))


class App:
    def __init__(self, a):
        self.root = Path.cwd()
        self.mods_path = self.root / MODS_REL
        self.previews = self.root / "assets" / "previews"
        self.releases = Path(a.releases_dir).resolve()
        self.repo = a.repo
        self.dry = a.dry_run
        self.token = secrets.token_urlsafe(24)
        self.work = Path(
            os.environ.get("D2PFX_ADMIN_HOME") or (Path.home() / ".d2pfx-admin")
        )
        (self.work / "uploads").mkdir(parents=True, exist_ok=True)
        (self.work / "backups").mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.jobs = {}
        self.trailing_nl = True
        self.state_path = self.work / "state.json"

    # -- mods.json
    def load(self):
        text = self.mods_path.read_text(encoding="utf-8")
        self.trailing_nl = text.endswith("\n")
        return json.loads(text), text

    def dump(self, data):
        return json.dumps(data, indent=2, ensure_ascii=False) + (
            "\n" if self.trailing_nl else ""
        )

    def save(self, data):
        with self.lock:
            if self.mods_path.exists():
                ts = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
                shutil.copy2(self.mods_path, self.work / "backups" / f"mods-{ts}.json")
                old = sorted((self.work / "backups").glob("mods-*.json"))
                for p in old[:-100]:
                    p.unlink(missing_ok=True)
            tmp = self.mods_path.with_name("mods.json.tmp")
            with open(tmp, "w", encoding="utf-8", newline="") as f:
                f.write(self.dump(data))
            os.replace(tmp, self.mods_path)

    def undo(self):
        with self.lock:
            backs = sorted((self.work / "backups").glob("mods-*.json"))
            if not backs:
                raise ValueError("nothing to undo")
            last = backs[-1]
            shutil.copy2(last, self.mods_path)
            last.unlink()
            return len(backs) - 1

    # pending release removals (executed on Publish, after the site stopped referencing the files)
    def get_state(self):
        try:
            return json.loads(self.state_path.read_text(encoding="utf-8"))
        except Exception:
            return {"pending_remove": []}

    def set_state(self, st):
        self.state_path.write_text(json.dumps(st, indent=2), encoding="utf-8")

    # manifest
    def manifest_index(self):
        """lower-case 'category/name' -> manifest entry"""
        p = self.releases / "manifest.json"
        if not p.exists():
            return {}
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return {}
        return {
            f"{f['category']}/{f['name']}".lower(): f for f in data.get("files", [])
        }

    def manifest_keys(self):
        return set(self.manifest_index())

    # uploads
    def upload_path(self, uid):
        d = self.work / "uploads" / re.sub(r"[^0-9a-f]", "", str(uid))
        files = list(d.iterdir()) if d.is_dir() else []
        if len(files) != 1:
            raise ValueError("uploaded file not found (upload it again)")
        return files[0]


def start_job(fn, *args):
    job = Job()
    APP.jobs[job.id] = job

    def run():
        try:
            fn(job, *args)
            job.status = "ok"
        except Exception as e:
            job.error = str(e)
            job.log("ERROR: " + str(e))
            if os.environ.get("D2PFX_ADMIN_DEBUG"):
                job.log(traceback.format_exc())
            job.status = "error"

    threading.Thread(target=run, daemon=True).start()
    return job.id


def run_cmd(job, cmd, cwd=None, check=True, env_extra=None):
    job.log("$ " + " ".join(shlex.quote(str(c)) for c in cmd))
    env = {
        **os.environ,
        "PYTHONIOENCODING": "utf-8",
        "PYTHONUNBUFFERED": "1",
        **(env_extra or {}),
    }
    p = subprocess.Popen(
        [str(c) for c in cmd],
        cwd=str(cwd or APP.root),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    for line in p.stdout:
        job.log(line.rstrip())
    rc = p.wait()
    if check and rc != 0:
        raise RuntimeError(f"command failed with exit code {rc}")
    return rc


def git_out(*args, cwd=None):
    r = subprocess.run(
        ["git", *args],
        cwd=str(cwd or APP.root),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return r.returncode, r.stdout.strip(), r.stderr.strip()


# previews


def place_preview(src, category, stem):
    """copy/convert an uploaded image into assets/previews/<category>/, return the file name"""
    ext = src.suffix.lower()
    if ext not in IMG_TYPES:
        raise ValueError(f"unsupported image type: {src.name}")
    convert = False
    if ext != ".webp":
        try:
            import PIL  # noqa: F401

            convert = True
        except ImportError:
            convert = False
    final_ext = ".webp" if convert else ext
    name = f"{stem}{final_ext}"
    dest_dir = APP.previews / category
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / name
    if convert:
        from PIL import Image

        try:
            with Image.open(src) as im:
                im.save(dest, "WEBP", quality=88)
        except Exception as e:  # noqa: BLE001
            dest.unlink(missing_ok=True)
            raise ValueError(f"cannot read the image {src.name}: {e}") from None
    else:
        shutil.copy2(src, dest)
    return name


def delete_preview(category, name):
    if simple_name(name):
        (APP.previews / category / name).unlink(missing_ok=True)


# jobs


def stage_and_upload(job, category, items, update):
    """items: [(final_file_name, source_path)] -> add_mod.py (uploads to releases, updates manifest)"""
    stage = Path(tempfile.mkdtemp(prefix="admin-stage-", dir=APP.work))
    try:
        cmd = [
            sys.executable,
            ADD_MOD,
            "--category",
            category,
            "--releases-dir",
            APP.releases,
            "--repo",
            APP.repo,
        ]
        for fname, src in items:
            dst = stage / fname
            shutil.copy2(src, dst)
            cmd += ["--zip", dst]
        if update:
            cmd.append("--update")
        if APP.dry:
            cmd.append("--dry-run")
        run_cmd(job, cmd)
    finally:
        shutil.rmtree(stage, ignore_errors=True)


def job_add(job, p):
    data, _ = APP.load()
    cat = p["category"]
    name = str(p["name"]).strip()
    if not name:
        raise ValueError("name is empty")
    content = (data.get("modsData") or {}).get(cat)
    if content is None:
        raise ValueError(
            f"category '{cat}' does not exist in mods.json (add it to constants.json / mods.json first)"
        )
    if name_taken(data, cat, name):
        raise ValueError("a mod with this name already exists in this category")
    zips = p.get("zips") or []
    if not zips:
        raise ValueError("add at least one zip")
    styled = len(zips) > 1 or bool(zips[0].get("label"))
    base = slug(p.get("fileBase") or name)
    index = APP.manifest_index()
    used = {
        m.get("file", "").lower()
        for _g, lst in category_lists(content)
        for m in lst
        if isinstance(m, dict)
    }
    plan = []
    for i, z in enumerate(zips):
        suffix = (
            ("-" + slug(z.get("label") or str(i + 1), str(i + 1))) if styled else ""
        )
        fname = f"{base}{suffix}.zip"
        zp = APP.upload_path(z["uploadId"])
        if not zipfile.is_zipfile(zp):
            raise ValueError(f"not a valid zip: {zp.name}")
        reuse = False
        entry_m = index.get(f"{cat}/{fname}".lower())
        if fname.lower() in used:
            raise ValueError(
                f"file name is already taken: {fname} (change the 'file name' field)"
            )
        if entry_m:
            # in the manifest but not in mods.json = leftover of an interrupted run; identical content is reused
            if entry_m.get("sha256") and entry_m["sha256"] == sha256_file(zp):
                reuse = True
            else:
                raise ValueError(
                    f"file name is already taken: {fname} (change the 'file name' field)"
                )
        pv = APP.upload_path(z["previewUploadId"]) if z.get("previewUploadId") else None
        plan.append(
            {
                "file": fname,
                "zip": zp,
                "preview": pv,
                "label": z.get("label") or f"Style {i + 1}",
                "color": z.get("color") or "#888888",
                "stem": f"{base}{suffix}",
                "reuse": reuse,
            }
        )
    if len({x["file"].lower() for x in plan}) != len(plan):
        raise ValueError("two styles produce the same file name")

    # previews first: a broken image must fail BEFORE anything is uploaded to the releases repo
    placed = []
    try:
        for x in plan:
            x["previewName"] = (
                place_preview(x["preview"], cat, x["stem"]) if x["preview"] else None
            )
            if x["previewName"]:
                placed.append(x["previewName"])
                job.log(f"preview: assets/previews/{cat}/{x['previewName']}")
        todo = [(x["file"], x["zip"]) for x in plan if not x["reuse"]]
        for x in plan:
            if x["reuse"]:
                job.log(
                    f"{x['file']}: already in the releases repo with identical content, not uploaded again"
                )
        if todo:
            job.log(f"Uploading {len(todo)} file(s) to the releases repo...")
            stage_and_upload(job, cat, todo, update=False)
    except Exception:
        for nm in placed:
            delete_preview(cat, nm)
        raise

    entry = {"name": name}
    if styled:
        entry["styles"] = []
        for x in plan:
            st = {"label": x["label"], "color": x["color"]}
            if x["previewName"]:
                st["preview"] = x["previewName"]
            st["file"] = x["file"]
            entry["styles"].append(st)
    else:
        if plan[0]["previewName"]:
            entry["preview"] = plan[0]["previewName"]
        entry["file"] = plan[0]["file"]
    if p.get("tags"):
        entry["tags"] = p["tags"]
    if p.get("links"):
        entry["links"] = p["links"]
    entry["meta"] = {"date": now_ts(), "commit-sha": ""}

    with APP.lock:
        data, _ = APP.load()
        if name_taken(data, cat, name):
            raise ValueError("a mod with this name appeared in the meantime")
        content = data["modsData"][cat]
        if isinstance(content, dict) and isinstance(content.get("groups"), list):
            gid = str(p.get("groupId") or "").strip()
            gname = str(p.get("groupName") or "").strip()
            grp = next(
                (
                    g
                    for g in content["groups"]
                    if isinstance(g, dict) and gid and g.get("id") == gid
                ),
                None,
            )
            if not grp and gname:
                grp = next(
                    (
                        g
                        for g in content["groups"]
                        if isinstance(g, dict)
                        and str(g.get("name", "")).strip().lower() == gname.lower()
                    ),
                    None,
                )
                if not grp:
                    grp = {
                        "id": slug(gname, "group").lower(),
                        "name": gname,
                        "mods": [],
                    }
                    content["groups"].append(grp)
            if not grp:
                raise ValueError(
                    "this category has groups: choose one or type a new group name"
                )
            grp["mods"].append(entry)
        elif isinstance(content, list):
            content.append(entry)
        else:
            raise ValueError(f"unsupported structure of category '{cat}'")
        if p.get("recent", True):
            touch_recent(data, cat, name)
        APP.save(data)
    job.log("")
    job.log("Added to mods.json (locally). Press 'Publish' to commit and push.")


def job_replace_file(job, p):
    cat, name, target = p["category"], p["name"], p["target"]
    data, _ = APP.load()
    found = find_mod(data, cat, name)
    if not found:
        raise ValueError("mod not found")
    entry = found[1][found[2]]
    existing = path_get(entry, target)
    if not simple_name(existing):
        raise ValueError(
            "this reference is a URL or a nested path; replace such files with add_mod.py / migrate_to_releases.py"
        )
    zp = APP.upload_path(p["uploadId"])
    if not zipfile.is_zipfile(zp):
        raise ValueError("the uploaded file is not a valid zip")
    exists = f"{cat}/{existing}".lower() in APP.manifest_keys()
    job.log(
        ("Replacing" if exists else "Uploading (not in the manifest yet)")
        + f": {cat}/{existing}"
    )
    stage_and_upload(job, cat, [(existing, zp)], update=exists)
    if p.get("markUpdated", True):
        with APP.lock:
            data, _ = APP.load()
            found = find_mod(data, cat, name)
            entry = found[1][found[2]]
            meta = entry.get("meta") if isinstance(entry.get("meta"), dict) else {}
            meta["date"] = now_ts()
            meta["commit-sha"] = ""
            entry["meta"] = meta
            touch_recent(data, cat, name)
            APP.save(data)
        job.log(
            "meta.date updated, mod moved to 'recently added' (this makes the Discord notification say 'Updated')."
        )
    job.log("")
    job.log("Done. Press 'Publish' to push mods.json (that starts the Pipeline).")


def job_validate(job, _p):
    run_cmd(
        job,
        [sys.executable, VALIDATE],
        env_extra={"MODS_STORAGE": "releases"},
        check=False,
    )


def job_sync(job, _p):
    run_cmd(job, ["git", "pull", "--ff-only"])
    if (APP.releases / ".git").exists():
        run_cmd(job, ["git", "-C", APP.releases, "pull", "--ff-only"])


def job_pipeline(job, _p):
    if APP.dry:
        job.log("[dry-run] would run: gh workflow run pipeline.yml")
        return
    run_cmd(job, ["gh", "workflow", "run", "pipeline.yml"])
    job.log("Pipeline started. Check the Actions tab of the website repo.")


def job_publish(job, p):
    msg = (p.get("message") or "chore: update mods via admin").strip()
    st = APP.get_state()
    pending = list(st.get("pending_remove") or [])
    run_pipeline = bool(p.get("runPipeline"))

    for path in ("assets/data", "assets/previews"):
        if (APP.root / path).exists():
            run_cmd(
                job, ["git", "add", "-A", "--", path], check=False
            )  # a folder without files is not an error
    rc, _, _ = git_out("diff", "--cached", "--quiet")
    changed = rc != 0
    if changed:
        if APP.dry:
            job.log("[dry-run] would commit and push: " + msg)
            run_cmd(job, ["git", "diff", "--cached", "--stat"], check=False)
            run_cmd(job, ["git", "reset", "-q"], check=False)
        else:
            run_cmd(job, ["git", "commit", "-m", msg])
            rc = run_cmd(job, ["git", "pull", "--rebase"], check=False)
            if rc != 0:
                run_cmd(job, ["git", "rebase", "--abort"], check=False)
                raise RuntimeError(
                    "git pull --rebase failed (conflict?). Nothing was pushed; resolve it manually "
                    "or press 'Sync' after undoing local changes."
                )
            run_cmd(job, ["git", "push"])
            job.log("Website repo pushed.")
    else:
        job.log("No local changes to commit in the website repo.")

    if pending:
        job.log("")
        job.log(f"Removing {len(pending)} file(s) from the releases repo...")
        if APP.dry:
            for k in pending:
                job.log(f"[dry-run] would remove {k}")
        else:
            rel = APP.releases
            run_cmd(job, ["git", "-C", rel, "pull", "--ff-only"])
            cmd = [
                sys.executable,
                MIGRATE,
                "--manifest",
                rel / "manifest.json",
                "--repo",
                APP.repo,
                "--sleep",
                "0.5",
            ]
            for k in pending:
                cmd += ["--remove", k]
            run_cmd(job, cmd)
            run_cmd(job, ["git", "-C", rel, "add", "manifest.json"])
            rc, _, _ = git_out("diff", "--cached", "--quiet", cwd=rel)
            if rc != 0:
                run_cmd(
                    job,
                    [
                        "git",
                        "-C",
                        rel,
                        "commit",
                        "-m",
                        f"chore: remove {len(pending)} mod file(s) via admin",
                    ],
                )
                run_cmd(job, ["git", "-C", rel, "push"])
            APP.set_state({**st, "pending_remove": []})
            run_pipeline = True  # hashes / Hugging Face must see the new manifest
        job.log("Releases repo updated.")

    if run_pipeline:
        job.log("")
        job_pipeline(job, {})
    job.log("")
    job.log("Finished.")


# API


def api_state(_q):
    data, text = APP.load()
    cats, mods = [], []
    for cat, content in (data.get("modsData") or {}).items():
        grouped = isinstance(content, dict) and isinstance(content.get("groups"), list)
        groups = (
            [
                {"id": g.get("id"), "name": g.get("name")}
                for g in content["groups"]
                if isinstance(g, dict)
            ]
            if grouped
            else []
        )
        cats.append({"id": cat, "grouped": grouped, "groups": groups})
        for g, lst in category_lists(content):
            for m in lst:
                if not isinstance(m, dict):
                    continue
                refs = file_refs(m)
                mods.append(
                    {
                        "category": cat,
                        "group": g.get("name") if g else None,
                        "name": m.get("name"),
                        "file": refs[0][1] if refs else "",
                        "files": len(refs),
                        "styles": len(m.get("styles") or []),
                        "date": (m.get("meta") or {}).get("date")
                        if isinstance(m.get("meta"), dict)
                        else None,
                    }
                )
    _, branch, _ = git_out("rev-parse", "--abbrev-ref", "HEAD")
    _, status, _ = git_out(
        "status", "--porcelain=v1", "--", "assets/data", "assets/previews"
    )
    return {
        "categories": cats,
        "mods": mods,
        "branch": branch,
        "changes": [l for l in status.splitlines() if l.strip()],
        "pendingRemove": APP.get_state().get("pending_remove") or [],
        "dry": APP.dry,
        "roundtrip": APP.dump(json.loads(text)) == text,
        "releasesOk": (APP.releases / "manifest.json").exists(),
        "undo": len(list((APP.work / "backups").glob("mods-*.json"))),
        "pillow": _has_pillow(),
    }


def _has_pillow():
    try:
        import PIL

        return True
    except ImportError:
        return False


def api_mod(q):
    cat, name = q["category"][0], q["name"][0]
    data, _ = APP.load()
    found = find_mod(data, cat, name)
    if not found:
        raise ValueError("mod not found")
    g, lst, i = found
    entry = lst[i]
    keys = APP.manifest_keys()
    files = [
        {
            "target": t,
            "value": v,
            "editable": simple_name(v),
            "inManifest": f"{cat}/{v}".lower() in keys,
        }
        for t, v in file_refs(entry)
    ]
    previews = [
        {
            "target": t,
            "value": v,
            "exists": simple_name(v) and (APP.previews / cat / v).exists(),
        }
        for t, v in preview_refs(entry)
    ]
    return {
        "category": cat,
        "group": g.get("name") if g else None,
        "entry": entry,
        "files": files,
        "previews": previews,
    }


def api_save_json(p):
    cat, name, entry = p["category"], p["name"], p["entry"]
    if not isinstance(entry, dict) or not str(entry.get("name", "")).strip():
        raise ValueError("entry must be an object with a 'name'")
    with APP.lock:
        data, _ = APP.load()
        found = find_mod(data, cat, name)
        if not found:
            raise ValueError("mod not found")
        g, lst, i = found
        new_name = entry["name"]
        if new_name != name and name_taken(data, cat, new_name):
            raise ValueError("another mod already has this name")
        lst[i] = entry
        if new_name != name:
            for r in data.get("recentlyAddedMods") or []:
                if (
                    isinstance(r, dict)
                    and r.get("name") == name
                    and r.get("category") == cat
                ):
                    r["name"] = new_name
        APP.save(data)
    return {"ok": True}


def api_replace_preview(p):
    cat, name, target = p["category"], p["name"], p["target"]
    with APP.lock:
        data, _ = APP.load()
        found = find_mod(data, cat, name)
        if not found:
            raise ValueError("mod not found")
        entry = found[1][found[2]]
        try:
            old = path_get(entry, target)
        except (KeyError, IndexError, ValueError):
            old = None
        src = APP.upload_path(p["uploadId"])
        stem = Path(old).stem if simple_name(old) else slug(name)
        new = place_preview(src, cat, stem)
        if simple_name(old) and old != new:
            delete_preview(cat, old)
        path_set(entry, target, new)
        APP.save(data)
    return {"ok": True, "preview": new}


def api_delete(p):
    cat, name = p["category"], p["name"]
    with APP.lock:
        data, _ = APP.load()
        found = find_mod(data, cat, name)
        if not found:
            raise ValueError("mod not found")
        g, lst, i = found
        entry = lst[i]
        files = [v for _t, v in file_refs(entry)]
        previews = [v for _t, v in preview_refs(entry)]
        packs = []
        for c2, content in (data.get("modsData") or {}).items():
            for _g2, l2 in category_lists(content):
                for m in l2:
                    if isinstance(m, dict) and m.get("type") == "pack":
                        for mem in m.get("mods") or []:
                            mname = (
                                mem if isinstance(mem, str) else (mem or {}).get("name")
                            )
                            if mname == name:
                                packs.append(f"{c2} / {m.get('name')}")
        del lst[i]
        data["recentlyAddedMods"] = [
            r
            for r in (data.get("recentlyAddedMods") or [])
            if not (
                isinstance(r, dict)
                and r.get("name") == name
                and r.get("category") == cat
            )
        ]
        APP.save(data)
    for pv in previews:
        delete_preview(cat, pv)
    queued = []
    if p.get("removeFiles"):
        st = APP.get_state()
        pend = st.get("pending_remove") or []
        for f in files:
            if simple_name(f):
                key = f"{cat}/{f}"
                if key not in pend:
                    pend.append(key)
                    queued.append(key)
        APP.set_state({**st, "pending_remove": pend})
    return {"ok": True, "queued": queued, "packWarnings": packs}


def api_unqueue(p):
    st = APP.get_state()
    st["pending_remove"] = [
        k for k in (st.get("pending_remove") or []) if k != p["key"]
    ]
    APP.set_state(st)
    return {"ok": True}


def api_undo(_p):
    return {"ok": True, "left": APP.undo()}


def api_job(q):
    job = APP.jobs.get(q["id"][0])
    if not job:
        raise ValueError("unknown job")
    start = int(q.get("from", ["0"])[0])
    with job.lock:
        lines = job.lines[start:]
        nxt = len(job.lines)
    return {"lines": lines, "next": nxt, "status": job.status, "error": job.error}


GET_ROUTES = {"/api/state": api_state, "/api/mod": api_mod, "/api/job": api_job}
POST_ROUTES = {
    "/api/mod/save": api_save_json,
    "/api/mod/replace-preview": api_replace_preview,
    "/api/mod/delete": api_delete,
    "/api/unqueue": api_unqueue,
    "/api/undo": api_undo,
}
JOB_ROUTES = {
    "/api/mod/add": job_add,
    "/api/mod/replace-file": job_replace_file,
    "/api/validate": job_validate,
    "/api/sync": job_sync,
    "/api/pipeline": job_pipeline,
    "/api/publish": job_publish,
}


class Handler(BaseHTTPRequestHandler):
    server_version = "d2pfx-admin"

    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json; charset=utf-8", extra=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False)
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _host_ok(self):
        return self.headers.get("Host", "").rsplit(":", 1)[0] in (
            "127.0.0.1",
            "localhost",
        )

    def _authed(self, q=None):
        tok = self.headers.get("X-Admin-Token") or ((q or {}).get("t") or [""])[0]
        return secrets.compare_digest(tok, APP.token)

    def do_GET(self):
        if not self._host_ok():
            return self._send(403, {"error": "forbidden"})
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == "/":
            return self._send(
                200, PAGE.replace("__TOKEN__", APP.token), "text/html; charset=utf-8"
            )
        if not self._authed(q):
            return self._send(403, {"error": "forbidden"})
        if u.path == "/preview":
            try:
                cat, name = q["cat"][0], q["name"][0]
                f = (APP.previews / cat / name).resolve()
                if (
                    APP.previews.resolve() not in f.parents
                    or f.suffix.lower() not in IMG_TYPES
                    or not f.is_file()
                ):
                    raise FileNotFoundError
                return self._send(200, f.read_bytes(), IMG_TYPES[f.suffix.lower()])
            except Exception:  # noqa: BLE001
                return self._send(404, {"error": "not found"})
        fn = GET_ROUTES.get(u.path)
        if not fn:
            return self._send(404, {"error": "not found"})
        try:
            self._send(200, fn(q))
        except Exception as e:  # noqa: BLE001
            self._send(400, {"error": str(e)})

    def do_POST(self):
        if not self._host_ok() or not self._authed(parse_qs(urlparse(self.path).query)):
            return self._send(403, {"error": "forbidden"})
        u = urlparse(self.path)
        q = parse_qs(u.query)
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if u.path == "/api/upload":
                name = Path(q.get("name", ["file"])[0]).name or "file"
                uid = uuid.uuid4().hex
                d = APP.work / "uploads" / uid
                d.mkdir(parents=True)
                size = 0
                with open(d / name, "wb") as f:
                    while size < length:
                        chunk = self.rfile.read(min(1 << 20, length - size))
                        if not chunk:
                            break
                        f.write(chunk)
                        size += len(chunk)
                return self._send(200, {"id": uid, "name": name, "size": size})
            if length > 5_000_000:
                return self._send(413, {"error": "too large"})
            body = json.loads(self.rfile.read(length) or b"{}")
            if u.path in JOB_ROUTES:
                return self._send(200, {"job": start_job(JOB_ROUTES[u.path], body)})
            fn = POST_ROUTES.get(u.path)
            if not fn:
                return self._send(404, {"error": "not found"})
            self._send(200, fn(body))
        except Exception as e:  # noqa: BLE001
            self._send(400, {"error": str(e) or e.__class__.__name__})


# page

PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>D2PFX admin</title>
<style>
:root{--bg:#f6f7f9;--panel:#fff;--text:#1b1f24;--muted:#6b7280;--line:#e2e5ea;--accent:#6d4aff;--accent-t:#fff;--danger:#d92d20;--ok:#12805c;--warn:#b54708;--code:#f0f2f5}
@media (prefers-color-scheme:dark){:root{--bg:#12141a;--panel:#1a1d25;--text:#e8eaf0;--muted:#9aa3b2;--line:#2b303c;--accent:#8b72ff;--accent-t:#0f1017;--danger:#ff6b61;--ok:#4fd1a1;--warn:#f5a54a;--code:#222632}}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;background:var(--bg);color:var(--text)}
header{position:sticky;top:0;z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;background:var(--panel);border-bottom:1px solid var(--line)}
header h1{font-size:16px;margin:0 8px 0 0}
button,.btn{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--text);cursor:pointer}
button:hover{border-color:var(--accent)}button.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-t)}
button.danger{color:var(--danger)}button:disabled{opacity:.5;cursor:default}
.chip{padding:2px 8px;border-radius:99px;background:var(--code);color:var(--muted);font-size:12px}.chip.warn{color:var(--warn)}.chip.dry{color:var(--accent)}
main{display:grid;grid-template-columns:minmax(300px,420px) 1fr;gap:16px;padding:16px;max-width:1500px;margin:0 auto}
@media(max-width:900px){main{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}
input[type=text],input[type=search],select,textarea{font:inherit;width:100%;padding:7px 9px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--text)}
textarea{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;min-height:220px}
label{display:block;font-size:12px;color:var(--muted);margin:10px 0 3px}
.row{display:flex;gap:8px;align-items:center}.row>*{flex:1}.row>.fit{flex:none}
#list{max-height:calc(100vh - 230px);overflow:auto;margin-top:8px}
.item{padding:8px 10px;border-radius:8px;cursor:pointer;border:1px solid transparent}.item:hover{background:var(--code)}.item.sel{border-color:var(--accent);background:var(--code)}
.item small{color:var(--muted)}.tabs{display:flex;gap:6px;margin-bottom:12px}.tabs button.on{background:var(--accent);color:var(--accent-t);border-color:var(--accent)}
.thumb{width:120px;height:68px;object-fit:cover;border-radius:6px;background:var(--code);border:1px solid var(--line)}
.ref{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}.ref:last-child{border:0}.ref .grow{flex:1;min-width:0;word-break:break-all}
.muted{color:var(--muted)}.ok{color:var(--ok)}.bad{color:var(--danger)}h3{margin:16px 0 6px;font-size:14px}h2{margin:0 0 6px;font-size:17px}
#log{position:fixed;left:0;right:0;bottom:0;max-height:45vh;background:#0e1016;color:#d7dae2;border-top:2px solid var(--accent);display:none;z-index:9}
#log pre{margin:0;padding:10px 16px;overflow:auto;max-height:calc(45vh - 40px);font:12.5px/1.4 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}
#log .bar{display:flex;justify-content:space-between;padding:6px 16px;background:#161922;font-size:12px}
.style-row{border:1px dashed var(--line);border-radius:8px;padding:8px 10px;margin-top:8px}
dialog{border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);max-width:560px;width:92%}
dialog::backdrop{background:rgba(0,0,0,.5)}.note{background:var(--code);padding:8px 10px;border-radius:8px;margin:8px 0;font-size:13px}
</style></head><body>
<header>
  <h1>D2PFX admin</h1><span class="chip" id="branch"></span><span class="chip dry" id="dry" hidden>DRY-RUN: GitHub is not touched</span>
  <span class="chip" id="changes"></span><span class="chip warn" id="pending" hidden></span>
  <span style="flex:1"></span>
  <button id="bSync">Sync</button><button id="bValidate">Validate</button><button id="bUndo">Undo</button>
  <button class="primary" id="bPublish">Publish…</button>
</header>
<main>
  <section class="card">
    <div class="row"><input type="search" id="q" placeholder="Search mods…"><select id="cat" class="fit" style="width:auto"></select></div>
    <div id="list"></div>
  </section>
  <section class="card">
    <div class="tabs"><button id="tEdit" class="on">Edit</button><button id="tAdd">Add new mod</button></div>
    <div id="edit"><p class="muted">Select a mod on the left.</p></div>
    <div id="add" hidden></div>
  </section>
</main>
<div id="log"><div class="bar"><span id="logTitle">Log</span><button onclick="hideLog()">Close</button></div><pre id="logPre"></pre></div>
<dialog id="dlg"></dialog>
<script>
const TOKEN="__TOKEN__";let S={mods:[],categories:[]},SEL=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,body){const o={headers:{'X-Admin-Token':TOKEN}};if(body!==undefined){o.method='POST';o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
 const r=await fetch(path,o);const j=await r.json().catch(()=>({error:'bad response'}));if(!r.ok)throw new Error(j.error||r.statusText);return j}
async function upload(file){const r=await fetch('/api/upload?name='+encodeURIComponent(file.name),{method:'POST',headers:{'X-Admin-Token':TOKEN},body:file});const j=await r.json();if(!r.ok)throw new Error(j.error);return j.id}
function hideLog(){$('#log').style.display='none'}
async function runJob(p,title){$('#log').style.display='block';$('#logTitle').textContent=title;const pre=$('#logPre');pre.textContent='';
 let id;try{id=(await p).job}catch(e){pre.textContent='ERROR: '+e.message;return false}
 let from=0;for(;;){const j=await api('/api/job?id='+id+'&from='+from);if(j.lines.length){pre.textContent+=j.lines.join('\n')+'\n';pre.scrollTop=pre.scrollHeight}from=j.next;
  if(j.status!=='running'){$('#logTitle').textContent=title+(j.status==='ok'?' — done':' — FAILED');await refresh();return j.status==='ok'}await new Promise(r=>setTimeout(r,700))}}
async function refresh(){S=await api('/api/state');$('#branch').textContent='branch: '+S.branch;$('#dry').hidden=!S.dry;
 $('#changes').textContent=S.changes.length?S.changes.length+' local change(s)':'no local changes';$('#changes').className='chip'+(S.changes.length?' warn':'');
 $('#pending').hidden=!S.pendingRemove.length;$('#pending').textContent=S.pendingRemove.length+' file(s) to remove from releases on Publish';
 $('#bUndo').disabled=!S.undo;const sel=$('#cat'),cur=sel.value;sel.innerHTML='<option value="">All categories</option>'+S.categories.map(c=>`<option>${esc(c.id)}</option>`).join('');sel.value=cur;renderList();
 if(!S.releasesOk)toast('Releases repo clone not found: uploads will fail. Use --releases-dir.')}
function toast(m){console.warn(m)}
function renderList(){const q=$('#q').value.toLowerCase(),c=$('#cat').value;const items=S.mods.filter(m=>(!c||m.category===c)&&(!q||(m.name||'').toLowerCase().includes(q)||(m.file||'').toLowerCase().includes(q)));
 $('#list').innerHTML=items.map(m=>`<div class="item${SEL&&SEL.c===m.category&&SEL.n===m.name?' sel':''}" data-c="${esc(m.category)}" data-n="${esc(m.name)}"><b>${esc(m.name)}</b> <small>${esc(m.category)}${m.group?' / '+esc(m.group):''}${m.styles>1?' · '+m.styles+' styles':''}</small></div>`).join('')||'<p class="muted">Nothing found.</p>';
 document.querySelectorAll('.item').forEach(e=>e.onclick=()=>openMod(e.dataset.c,e.dataset.n))}
$('#q').oninput=renderList;$('#cat').onchange=renderList;
function tab(t){$('#edit').hidden=t!=='edit';$('#add').hidden=t!=='add';$('#tEdit').className=t==='edit'?'on':'';$('#tAdd').className=t==='add'?'on':''}
$('#tEdit').onclick=()=>tab('edit');$('#tAdd').onclick=()=>{renderAdd();tab('add')};
async function openMod(c,n){SEL={c,n};renderList();tab('edit');const box=$('#edit');box.innerHTML='<p class="muted">Loading…</p>';
 let d;try{d=await api('/api/mod?category='+encodeURIComponent(c)+'&name='+encodeURIComponent(n))}catch(e){box.innerHTML='<p class="bad">'+esc(e.message)+'</p>';return}
 const files=d.files.map(f=>`<div class="ref"><div class="grow"><b>${esc(f.target)}</b><br>${esc(f.value)} ${f.inManifest?'<span class="ok">· in releases</span>':'<span class="bad">· not in manifest</span>'}</div>${f.editable?`<input type="file" accept=".zip" data-t="${esc(f.target)}" class="rf">`:'<span class="muted">URL / nested path</span>'}</div>`).join('')||'<p class="muted">No files.</p>';
 const prevs=d.previews.map(f=>`<div class="ref">${f.exists?`<img class="thumb" src="/preview?cat=${encodeURIComponent(c)}&name=${encodeURIComponent(f.value)}&t=${TOKEN}">`:'<div class="thumb"></div>'}<div class="grow"><b>${esc(f.target)}</b><br>${esc(f.value)} ${f.exists?'':'<span class="bad">· file missing</span>'}</div><input type="file" accept="image/*" data-t="${esc(f.target)}" class="rp"></div>`).join('')||'<p class="muted">No previews.</p>';
 box.innerHTML=`<h2>${esc(n)}</h2><div class="muted">${esc(c)}${d.group?' / '+esc(d.group):''}</div>
 <h3>Files (zip)</h3>${files}<label><input type="checkbox" id="mark" checked> after replacing a file: mark as updated (meta.date + “recently added”, makes Discord say “Updated”)</label>
 <h3>Previews</h3>${prevs}
 <h3>Entry (JSON)</h3><textarea id="json" spellcheck="false">${esc(JSON.stringify(d.entry,null,2))}</textarea>
 <div class="row" style="margin-top:8px"><button class="primary fit" id="bSave">Save JSON</button><span class="muted">Changes the local mods.json only. Publish to push.</span></div>
 <h3>Delete</h3><label><input type="checkbox" id="rmf" checked> also remove the zip file(s) from the releases repo (done on Publish, after the site stops using them)</label>
 <button class="danger" id="bDel">Delete this mod</button>`;
 document.querySelectorAll('.rf').forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;if(!confirm('Replace '+i.dataset.t+' with '+f.name+'?'))return;
  await runJob((async()=>{const id=await upload(f);return api('/api/mod/replace-file',{category:c,name:n,target:i.dataset.t,uploadId:id,markUpdated:$('#mark').checked})})(),'Replace file');openMod(c,n)});
 document.querySelectorAll('.rp').forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;try{const id=await upload(f);await api('/api/mod/replace-preview',{category:c,name:n,target:i.dataset.t,uploadId:id});await refresh();openMod(c,n)}catch(e){alert(e.message)}});
 $('#bSave').onclick=async()=>{let e;try{e=JSON.parse($('#json').value)}catch(x){return alert('Invalid JSON: '+x.message)}try{await api('/api/mod/save',{category:c,name:n,entry:e});await refresh();SEL={c,n:e.name};openMod(c,e.name)}catch(x){alert(x.message)}};
 $('#bDel').onclick=async()=>{if(!confirm('Delete "'+n+'" from mods.json?'))return;try{const r=await api('/api/mod/delete',{category:c,name:n,removeFiles:$('#rmf').checked});
  let m='Deleted locally.';if(r.queued.length)m+='\nQueued for removal from releases on Publish:\n'+r.queued.join('\n');if(r.packWarnings.length)m+='\n\nWARNING: still listed in packs:\n'+r.packWarnings.join('\n');alert(m);SEL=null;$('#edit').innerHTML='<p class="muted">Select a mod on the left.</p>';await refresh()}catch(x){alert(x.message)}}}
function renderAdd(){const cats=S.categories;$('#add').innerHTML=`<h2>Add new mod</h2>
 <label>Category</label><select id="aCat">${cats.map(c=>`<option>${esc(c.id)}</option>`).join('')}</select>
 <div id="aGroupBox"></div>
 <label>Mod name</label><input type="text" id="aName">
 <label>File name base (optional, letters/digits/-_. only; default is made from the name)</label><input type="text" id="aBase" placeholder="my-mod">
 <label><input type="checkbox" id="aStyled"> this mod has several styles / variants</label>
 <div id="aRows"></div><button id="aMore" hidden>+ add style</button>
 <label>Tags (JSON object, optional)</label><textarea id="aTags" style="min-height:60px" placeholder='{"hero":"Axe"}'></textarea>
 <label>Links (JSON list, optional)</label><textarea id="aLinks" style="min-height:60px" placeholder='[{"type":"author","url":"Name"}]'></textarea>
 <label><input type="checkbox" id="aRecent" checked> add to “recently added”</label>
 <div class="note">The zip is uploaded to the releases repo immediately. mods.json and the preview change locally until you press Publish.${S.pillow?'':' Install pillow (pip install pillow) to convert png/jpg previews to webp.'}</div>
 <button class="primary" id="aGo">Add mod</button>`;
 const rows=$('#aRows');let n=0;
 const addRow=()=>{const i=n++;const d=document.createElement('div');d.className='style-row';d.innerHTML=`<div class="srow-meta" ${$('#aStyled').checked?'':'hidden'}><div class="row"><input type="text" class="lab" placeholder="Style label (e.g. Style 1)"><input type="color" class="col fit" value="#8b5cf6"></div></div>
  <label>Zip file</label><input type="file" accept=".zip" class="zip"><label>Preview image</label><input type="file" accept="image/*" class="pv">`;rows.appendChild(d)};
 addRow();
 const syncStyled=()=>{const on=$('#aStyled').checked;document.querySelectorAll('.srow-meta').forEach(e=>e.hidden=!on);$('#aMore').hidden=!on;if(!on)while(rows.children.length>1)rows.lastChild.remove()};
 $('#aStyled').onchange=syncStyled;$('#aMore').onclick=()=>{addRow();syncStyled()};
 const grp=()=>{const c=cats.find(x=>x.id===$('#aCat').value);$('#aGroupBox').innerHTML=c&&c.grouped?`<label>Group</label><select id="aGroup">${c.groups.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}<option value="">(new group…)</option></select><input type="text" id="aGroupNew" placeholder="New group name" hidden style="margin-top:6px">`:'';
  const sel=$('#aGroup');if(sel)sel.onchange=()=>{$('#aGroupNew').hidden=sel.value!==''}};
 $('#aCat').onchange=grp;grp();
 $('#aGo').onclick=async()=>{const name=$('#aName').value.trim();if(!name)return alert('Enter the mod name');
  const styled=$('#aStyled').checked;const rowsEl=[...rows.children];const zips=[];
  for(const r of rowsEl){const z=r.querySelector('.zip').files[0];if(!z)return alert('Choose a zip in every row');zips.push({z,p:r.querySelector('.pv').files[0],label:styled?r.querySelector('.lab').value.trim():'',color:r.querySelector('.col').value})}
  let tags=null,links=null;try{if($('#aTags').value.trim())tags=JSON.parse($('#aTags').value);if($('#aLinks').value.trim())links=JSON.parse($('#aLinks').value)}catch(x){return alert('Tags/Links: invalid JSON')}
  const gs=$('#aGroup');const body={category:$('#aCat').value,name,fileBase:$('#aBase').value.trim(),tags,links,recent:$('#aRecent').checked,groupId:gs?gs.value:'',groupName:gs&&gs.value===''?$('#aGroupNew').value:''};
  $('#aGo').disabled=true;await runJob((async()=>{$('#logPre').textContent='Uploading files to the local server…';body.zips=[];for(const x of zips){const e={uploadId:await upload(x.z),label:x.label,color:x.color};if(x.p)e.previewUploadId=await upload(x.p);body.zips.push(e)}return api('/api/mod/add',body)})(),'Add mod "'+name+'"');
  $('#aGo').disabled=false;}}
$('#bSync').onclick=()=>runJob(api('/api/sync',{}),'Sync (git pull)');
$('#bValidate').onclick=()=>runJob(api('/api/validate',{}),'Validate');
$('#bUndo').onclick=async()=>{if(!confirm('Restore the previous version of mods.json? (previews and release files are not reverted)'))return;try{await api('/api/undo',{});await refresh();SEL&&openMod(SEL.c,SEL.n)}catch(e){alert(e.message)}};
$('#bPublish').onclick=()=>{const d=$('#dlg');d.innerHTML=`<h2>Publish</h2><div class="note"><b>Local changes</b><br>${S.changes.map(esc).join('<br>')||'none'}</div>
 ${S.pendingRemove.length?`<div class="note"><b>Will be removed from releases after the push</b><br>${S.pendingRemove.map(k=>esc(k)+' <a href="#" data-k="'+esc(k)+'" class="uq">cancel</a>').join('<br>')}</div>`:''}
 <label>Commit message</label><input type="text" id="pMsg" value="chore: update mods via admin">
 <label><input type="checkbox" id="pPipe"> also run the Pipeline manually (not needed when mods.json changed, the push starts it)</label>
 <div class="row" style="margin-top:14px"><button class="fit" onclick="dlg.close()">Cancel</button><span></span><button class="primary fit" id="pGo">Publish</button></div>`;d.showModal();
 d.querySelectorAll('.uq').forEach(a=>a.onclick=async e=>{e.preventDefault();await api('/api/unqueue',{key:a.dataset.k});d.close();await refresh()});
 $('#pGo').onclick=()=>{const m=$('#pMsg').value,rp=$('#pPipe').checked;d.close();runJob(api('/api/publish',{message:m,runPipeline:rp}),'Publish')}};
const dlg=$('#dlg');refresh().then(()=>{if(!S.mods.length)renderAdd()});
</script></body></html>"""


# main
def main():
    global APP
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--releases-dir", default="../Dota2PornFx")
    ap.add_argument("--repo", default="h6rd/Dota2PornFx")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if not (Path.cwd() / MODS_REL).exists():
        sys.exit(
            "Run this from the root of the website repo (assets/data/mods.json not found here)."
        )
    for p in (ADD_MOD, MIGRATE):
        if not p.exists():
            sys.exit(f"{p.name} not found next to admin.py")
    APP = App(a)
    if not (APP.releases / "manifest.json").exists():
        print(
            f"WARNING: {APP.releases} is not a clone of the releases repo (manifest.json missing); "
            f"uploads will fail. Use --releases-dir."
        )
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), Handler)
    url = f"http://127.0.0.1:{a.port}/"
    print(f"Admin panel: {url}   (Ctrl+C to stop){'   [DRY-RUN]' if a.dry_run else ''}")
    if not a.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
