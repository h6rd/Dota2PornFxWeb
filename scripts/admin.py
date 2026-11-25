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
CONSTS_REL = "assets/data/constants.json"
TAG_KEY_RE = re.compile(r"^[A-Za-z0-9_-]{1,40}$")
IMG_TYPES = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
}
APP = None


# helpers


_TR = dict(
    zip(
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
        ["a","b","v","g","d","e","e","zh","z","i","y","k","l","m","n","o","p","r","s","t","u","f","h","ts","ch","sh","sch","","y","","e","yu","ya"],
    )
)


def translit(s):
    out = []
    for ch in str(s):
        t = _TR.get(ch.lower())
        out.append(ch if t is None else (t.capitalize() if ch.isupper() else t))
    return "".join(out)


def slug(s, fallback="mod"):
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", translit(str(s).strip())).strip("-._")
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
        self.consts_path = self.root / CONSTS_REL
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
        # uploads (and extracted bundle files) older than 3 days are not needed any more
        try:
            cutoff = time.time() - 3 * 86400
            for d in (self.work / "uploads").iterdir():
                if d.is_dir() and d.stat().st_mtime < cutoff:
                    shutil.rmtree(d, ignore_errors=True)
        except OSError:
            pass

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

    # constants.json (authors, tag names)
    def load_consts(self):
        try:
            text = self.consts_path.read_text(encoding="utf-8")
            return json.loads(text), text
        except Exception:  # noqa: BLE001
            return None, ""

    @staticmethod
    def dump_consts(data):
        return json.dumps(data, indent=2, ensure_ascii=False) + "\n"

    def save_consts(self, data):
        with self.lock:
            if self.consts_path.exists():
                ts = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
                shutil.copy2(self.consts_path, self.work / "backups" / f"consts-{ts}.json")
                old = sorted((self.work / "backups").glob("consts-*.json"))
                for p in old[:-30]:
                    p.unlink(missing_ok=True)
            tmp = self.consts_path.with_name("constants.json.tmp")
            with open(tmp, "w", encoding="utf-8", newline="") as f:
                f.write(self.dump_consts(data))
            os.replace(tmp, self.consts_path)

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


def category_used_files(content):
    """lower-case names of every zip already referenced inside a category"""
    return {
        v.lower()
        for _g, lst in category_lists(content)
        for m in lst
        if isinstance(m, dict)
        for _t, v in file_refs(m)
    }


def check_file_name(cat, fname, zp, used, index):
    """-> True when the identical file is already in the releases repo (reuse), raises when the name is taken"""
    if fname.lower() in used:
        raise ValueError(
            f"file name is already taken: {fname} (change the 'file name' field)"
        )
    entry_m = index.get(f"{cat}/{fname}".lower())
    if entry_m:
        # in the manifest but not in mods.json = leftover of an interrupted run; identical content is reused
        if entry_m.get("sha256") and entry_m["sha256"] == sha256_file(zp):
            return True
        raise ValueError(
            f"file name is already taken: {fname} (change the 'file name' field)"
        )
    return False


def place_previews(job, cat, plan):
    """place all previews; a broken image must fail BEFORE anything is uploaded. Returns the placed names."""
    placed = []
    try:
        for x in plan:
            x["previewName"] = (
                place_preview(x["preview"], cat, x["stem"]) if x.get("preview") else None
            )
            if x["previewName"]:
                placed.append(x["previewName"])
                job.log(f"preview: assets/previews/{cat}/{x['previewName']}")
    except Exception:
        for nm in placed:
            delete_preview(cat, nm)
        raise
    return placed


def upload_plan(job, cat, plan):
    todo = [(x["file"], x["zip"]) for x in plan if not x["reuse"]]
    for x in plan:
        if x["reuse"]:
            job.log(
                f"{x['file']}: already in the releases repo with identical content, not uploaded again"
            )
    if todo:
        job.log(f"Uploading {len(todo)} file(s) to the releases repo...")
        stage_and_upload(job, cat, todo, update=False)


def insert_entry(data, cat, p, entry):
    """append entry to the category (plain list or the chosen/new group)"""
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
                grp = {"id": slug(gname, "group").lower(), "name": gname, "mods": []}
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


def build_plan(cat, used, index, base, zips, used_prev=None):
    """zips: [{uploadId, previewUploadId?, label?, color?}] -> (styled, plan). Raises on any name clash."""
    styled = len(zips) > 1 or bool(zips[0].get("label"))
    plan = []
    for i, z in enumerate(zips):
        suffix = (
            ("-" + slug(z.get("label") or str(i + 1), str(i + 1))) if styled else ""
        )
        fname = f"{base}{suffix}.zip"
        zp = APP.upload_path(z["uploadId"])
        if not zipfile.is_zipfile(zp):
            raise ValueError(f"not a valid zip: {zp.name}")
        reuse = check_file_name(cat, fname, zp, used, index)
        pv = APP.upload_path(z["previewUploadId"]) if z.get("previewUploadId") else None
        stem = f"{base}{suffix}"
        if pv and used_prev and stem.lower() in used_prev:
            raise ValueError(
                f"the preview name '{stem}' is already used by another mod (change the file name)"
            )
        plan.append(
            {
                "file": fname,
                "zip": zp,
                "preview": pv,
                "label": z.get("label") or f"Style {i + 1}",
                "color": z.get("color") or "#888888",
                "stem": stem,
                "reuse": reuse,
            }
        )
    if len({x["file"].lower() for x in plan}) != len(plan):
        raise ValueError("two styles produce the same file name")
    return styled, plan


def make_entry(name, styled, plan, tags, links):
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
    if tags:
        entry["tags"] = dict(tags)
    if links:
        entry["links"] = json.loads(json.dumps(links))
    entry["meta"] = {"date": now_ts(), "commit-sha": ""}
    return entry


def category_used_previews(content):
    return {
        Path(v).stem.lower()
        for _g, lst in category_lists(content)
        for m in lst
        if isinstance(m, dict)
        for _t, v in preview_refs(m)
        if isinstance(v, str)
    }


# authors / tags (picked from assets/data/constants.json)


def clean_authors(p):
    raw = list(p.get("authors") or [])
    if p.get("author"):  # legacy single string
        raw.append(p["author"])
    consts, _t = APP.load_consts()
    canon = {k.lower(): k for k in ((consts or {}).get("MOD_AUTHOR") or {})}
    out, seen = [], set()
    for a in raw:
        a = re.sub(r"\s+", " ", str(a)).strip()
        a = canon.get(a.lower(), a)
        if not a or a.lower() in seen:
            continue
        if len(a) > 80 or re.search(r"[\x00-\x1f]", a):
            raise ValueError(f"bad author name: {a[:30]}")
        seen.add(a.lower())
        out.append(a)
    return out


def clean_tags(raw):
    if not raw:
        return None
    if not isinstance(raw, dict):
        raise ValueError("tags must be an object")
    out = {}
    for k, v in raw.items():
        if not TAG_KEY_RE.match(str(k)):
            raise ValueError(f"bad tag name: {k}")
        if not isinstance(v, bool):
            raise ValueError(f"tag '{k}' must be true/false")
        out[str(k)] = v
    return out or None


def build_meta(p):
    authors = clean_authors(p)
    extra = p.get("links") or []
    if not isinstance(extra, list) or any(not isinstance(l, dict) for l in extra):
        raise ValueError("extra links must be a JSON list of objects")
    links = [{"type": "author", "url": a} for a in authors] + extra
    return authors, links, clean_tags(p.get("tags"))


def register_authors(names, urls):
    """add unknown authors to MOD_AUTHOR in constants.json -> (added, warning)"""
    names = [n for n in names if n]
    if not names:
        return [], None
    with APP.lock:
        consts, text = APP.load_consts()
        if consts is None:
            return [], "constants.json not found: new authors were not added to MOD_AUTHOR."
        known = {k.lower() for k in (consts.get("MOD_AUTHOR") or {})}
        new, seen = [], set()
        for n in names:
            if n.lower() not in known and n.lower() not in seen:
                seen.add(n.lower())
                new.append(n)
        if not new:
            return [], None
        if APP.dump_consts(consts) != text:
            return [], (
                "constants.json has custom formatting, so it was not rewritten. "
                "Add to MOD_AUTHOR by hand: " + ", ".join(new)
            )
        ma = consts.setdefault("MOD_AUTHOR", {})
        for n in new:
            ma[n] = str((urls or {}).get(n, "") or "").strip()
        APP.save_consts(consts)
        return new, None


def log_authors(job, authors, urls):
    added, warn = register_authors(authors, urls)
    if added:
        job.log("New author(s) added to MOD_AUTHOR in constants.json: " + ", ".join(added))
    if warn:
        job.log("WARNING: " + warn)


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
    authors, links, tags = build_meta(p)
    base = slug(p.get("fileBase") or name)
    styled, plan = build_plan(
        cat,
        category_used_files(content),
        APP.manifest_index(),
        base,
        zips,
        category_used_previews(content),
    )

    placed = place_previews(job, cat, plan)
    try:
        upload_plan(job, cat, plan)
    except Exception:
        for nm in placed:
            delete_preview(cat, nm)
        raise

    entry = make_entry(name, styled, plan, tags, links)
    with APP.lock:
        data, _ = APP.load()
        if name_taken(data, cat, name):
            raise ValueError("a mod with this name appeared in the meantime")
        insert_entry(data, cat, p, entry)
        if p.get("recent", True):
            touch_recent(data, cat, name)
        APP.save(data)
    log_authors(job, authors, p.get("newAuthors"))
    job.log("")
    job.log("Added to mods.json (locally). Press 'Publish' to commit and push.")


def job_bulk_add(job, p):
    """many mods at once: shared category/group/authors/tags; each item = one mod (1 zip, or several styles)"""
    data, _ = APP.load()
    cat = p["category"]
    content = (data.get("modsData") or {}).get(cat)
    if content is None:
        raise ValueError(f"category '{cat}' does not exist in mods.json")
    items = p.get("items") or []
    if not items:
        raise ValueError("add at least one mod")
    authors, links, tags = build_meta(p)

    index = APP.manifest_index()
    used = category_used_files(content)
    used_prev = category_used_previews(content)
    seen_names, plan, errors = set(), [], []
    for n, it in enumerate(items, 1):
        name = str(it.get("name") or "").strip()
        label = f"#{n} {name or '(no name)'}"
        try:
            if not name:
                raise ValueError("name is empty")
            if name.lower() in seen_names:
                raise ValueError("duplicate name in this batch")
            if name_taken(data, cat, name):
                raise ValueError("a mod with this name already exists in this category")
            zips = it.get("styles") or [
                {"uploadId": it["uploadId"], "previewUploadId": it.get("previewUploadId")}
            ]
            base = slug(it.get("fileBase") or name)
            styled, parts = build_plan(cat, used, index, base, zips, used_prev)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{label}: {e}")
            continue
        seen_names.add(name.lower())
        used |= {x["file"].lower() for x in parts}  # later items must not reuse these file names
        used_prev |= {x["stem"].lower() for x in parts if x["preview"]}
        plan.append({"name": name, "styled": styled, "parts": parts})
    if errors:
        raise ValueError("nothing was uploaded, fix these first:\n" + "\n".join(errors))

    flat = [x for it in plan for x in it["parts"]]
    job.log(
        f"Bulk add: {len(plan)} mod(s), {len(flat)} file(s) to {cat}"
        + (f", authors: {', '.join(authors)}" if authors else "")
    )
    placed = place_previews(job, cat, flat)
    try:
        upload_plan(job, cat, flat)
    except Exception:
        for nm in placed:
            delete_preview(cat, nm)
        raise

    with APP.lock:
        data, _ = APP.load()
        for it in plan:
            if name_taken(data, cat, it["name"]):
                raise ValueError(f"a mod named '{it['name']}' appeared in the meantime")
        for it in plan:
            insert_entry(
                data, cat, p, make_entry(it["name"], it["styled"], it["parts"], tags, links)
            )
            if p.get("recent", True):
                touch_recent(data, cat, it["name"])
        APP.save(data)
    log_authors(job, authors, p.get("newAuthors"))
    job.log("")
    job.log(
        f"Added {len(plan)} mod(s) to mods.json (locally). Press 'Publish' to commit and push."
    )


# bundle archives: ONE zip that contains the preview image(s) and the mod zip(s)

JUNK_FILES = {"thumbs.db", "desktop.ini", ".ds_store"}
GENERIC_STEMS = {
    "mod", "mods", "file", "files", "archive", "data", "download", "new", "untitled",
    "pak", "pak01", "vpk", "copy", "main", "release",
}
PALETTE = ["#8b5cf6", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#a3a3a3"]
MAX_BUNDLE_IMAGE = 40 * 1024 * 1024


def _zname(zi):
    """member name; repairs names written in cp866 / utf-8 without the utf-8 flag (common for RU archivers)"""
    n = zi.filename
    if zi.flag_bits & 0x800 or n.isascii():
        return n
    try:
        raw = n.encode("cp437")
    except UnicodeEncodeError:
        return n
    for enc in ("utf-8", "cp866"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return n


def _norm(s):
    return re.sub(r"[^0-9a-zа-яё]+", "", s.lower())


def _pretty(stem):
    return re.sub(r"\s+", " ", re.sub(r"[_-]+", " ", stem)).strip()


def _natkey(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def _is_generic(stem):
    n = _norm(stem)
    return len(n) < 3 or n in GENERIC_STEMS


def _pick_image(imgs, stem, level):
    """level: strict = by name only; shared = by name, else the only image; any = also 'preview'-like name, else first"""
    if not imgs:
        return None
    ns = _norm(stem)
    for im in imgs:
        if _norm(Path(im["base"]).stem) == ns:
            return im
    cand = [im for im in imgs if len(ns) >= 3 and ns in _norm(Path(im["base"]).stem)]
    if len(cand) == 1:
        return cand[0]
    if level == "strict":
        return None
    if len(imgs) == 1:
        return imgs[0]
    if level == "shared":
        return None
    for im in imgs:
        if re.search(r"preview|cover|thumb|screen|main|image|превью|обложка", im["base"], re.I):
            return im
    return sorted(imgs, key=lambda i: _natkey(i["base"]))[0]


def _labels(stems):
    """style labels from zip names: 'Mod Red', 'Mod Blue' -> 'Red', 'Blue'"""
    if len(stems) < 2:
        return [""] * len(stems)
    pre = os.path.commonprefix([s.lower() for s in stems])
    cut = max([pre.rfind(c) for c in " _-."] + [-1]) + 1
    labels = [_pretty(s[cut:]) or _pretty(s) for s in stems]
    if len({x.lower() for x in labels}) != len(labels):
        labels = [_pretty(s) for s in stems]
    return [l or f"Style {i + 1}" for i, l in enumerate(labels)]


def inspect_bundle(uid, mode="auto"):
    """Look inside an uploaded archive. If it holds image(s) + nested mod zip(s), extract those into fresh
    uploads (so the normal add flow can use them by id) and return the detected mods.
    mode 'auto': root with several zips = several mods, a folder = one mod (several zips = styles)
    mode 'single': everything becomes ONE mod (several zips = styles)"""
    src = APP.upload_path(uid)
    if not zipfile.is_zipfile(src):
        return {"bundle": False, "reason": "not a zip archive"}
    arch_stem = Path(src.name).stem
    warnings = []
    with zipfile.ZipFile(src) as zf:
        ents = []
        for zi in zf.infolist():
            if zi.is_dir():
                continue
            parts = [x for x in _zname(zi).replace("\\", "/").split("/") if x]
            if not parts:
                continue
            base = parts[-1]
            if "__MACOSX" in parts or base.startswith(".") or base.lower() in JUNK_FILES:
                continue
            ext = Path(base).suffix.lower()
            kind = "zip" if ext == ".zip" else "img" if ext in IMG_TYPES else None
            if kind:
                ents.append({"zi": zi, "dir": tuple(parts[:-1]), "base": base, "kind": kind})
        zips = [e for e in ents if e["kind"] == "zip"]
        imgs = [e for e in ents if e["kind"] == "img"]
        if not zips:
            return {"bundle": False, "reason": "no mod .zip found inside this archive"}
        if not imgs:
            return {"bundle": False, "reason": "no preview image found inside this archive"}

        wrapper = tuple(os.path.commonprefix([e["dir"] for e in ents]))
        for e in ents:
            e["dir"] = e["dir"][len(wrapper):]
        root_name = wrapper[-1] if wrapper else arch_stem

        def mod_name(stem_or_dir, zip_stem=None):
            if zip_stem and not _is_generic(zip_stem):
                return _pretty(zip_stem)
            return _pretty(stem_or_dir)

        def zstem(e):
            return Path(e["base"]).stem

        def plan_auto():
            mods = []
            groups = {}
            for e in ents:
                groups.setdefault(e["dir"], {"zips": [], "imgs": []})[
                    "zips" if e["kind"] == "zip" else "imgs"
                ].append(e)
            for d, g in groups.items():
                gz = sorted(g["zips"], key=lambda e: _natkey(e["base"]))
                if not gz:
                    if g["imgs"]:
                        warnings.append(
                            f"images without a zip were ignored: {'/'.join(d) or '(root)'}"
                        )
                    continue
                if len(gz) == 1:
                    z = gz[0]
                    name = mod_name(d[-1] if d else root_name, zstem(z)) if not d else _pretty(d[-1])
                    mods.append(
                        {"name": name, "pairs": [(z, _pick_image(g["imgs"], zstem(z), "any"))]}
                    )
                elif not d:
                    left = list(g["imgs"])
                    for z in gz:
                        im = _pick_image(left, zstem(z), "strict")
                        if im:
                            left.remove(im)
                        else:
                            warnings.append(f"no preview matched by name for {z['base']}")
                        mods.append({"name": _pretty(zstem(z)), "pairs": [(z, im)]})
                else:
                    mods.append(
                        {
                            "name": _pretty(d[-1]),
                            "pairs": [(z, _pick_image(g["imgs"], zstem(z), "shared")) for z in gz],
                        }
                    )
            return mods

        def plan_single():
            gz = sorted(zips, key=lambda e: _natkey(e["base"]))
            if len(gz) == 1:
                z = gz[0]
                return [
                    {"name": mod_name(root_name, zstem(z)), "pairs": [(z, _pick_image(imgs, zstem(z), "any"))]}
                ]
            return [
                {
                    "name": _pretty(root_name),
                    "pairs": [(z, _pick_image(imgs, zstem(z), "shared")) for z in gz],
                }
            ]

        auto = plan_auto()
        chosen = plan_single() if mode == "single" else auto

        cache = {}

        def extract(e):
            key = e["zi"].filename
            if key in cache:
                return cache[key]
            if e["kind"] == "img" and e["zi"].file_size > MAX_BUNDLE_IMAGE:
                warnings.append(f"image too large, skipped: {e['base']}")
                cache[key] = (None, e["base"])
                return cache[key]
            d = uuid.uuid4().hex
            dd = APP.work / "uploads" / d
            dd.mkdir(parents=True)
            fname = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", e["base"])
            try:
                with zf.open(e["zi"]) as s, open(dd / fname, "wb") as t:
                    shutil.copyfileobj(s, t, 1 << 20)
            except RuntimeError as ex:  # encrypted member
                shutil.rmtree(dd, ignore_errors=True)
                raise ValueError(f"cannot read {e['base']} (password protected?): {ex}") from None
            cache[key] = (d, fname)
            return cache[key]

        out = []
        for m in chosen:
            stems = [zstem(z) for z, _im in m["pairs"]]
            labels = _labels(stems)
            styles = []
            for i, (z, im) in enumerate(m["pairs"]):
                zid, zname = extract(z)
                pid, pname = extract(im) if im else (None, None)
                styles.append(
                    {
                        "label": labels[i],
                        "color": PALETTE[i % len(PALETTE)],
                        "uploadId": zid,
                        "zipName": zname,
                        "previewUploadId": pid,
                        "previewName": pname if pid else None,
                    }
                )
            if len(styles) == 1:
                base = slug(stems[0]) if not _is_generic(stems[0]) else slug(m["name"])
            else:
                base = slug(m["name"])
            out.append(
                {"name": m["name"], "fileBase": base, "styled": len(styles) > 1, "styles": styles}
            )
    return {
        "bundle": True,
        "mods": out,
        "autoCount": len(auto),
        "warnings": warnings,
        "archive": src.name,
    }


def api_bundle_inspect(p):
    return inspect_bundle(p["uploadId"], p.get("mode") or "auto")


def api_set_meta(p):
    """replace the author links and the tags of one mod (picked values, no JSON editing)"""
    cat, name = p["category"], p["name"]
    authors = clean_authors(p)
    tags = clean_tags(p.get("tags"))
    with APP.lock:
        data, _ = APP.load()
        found = find_mod(data, cat, name)
        if not found:
            raise ValueError("mod not found")
        _g, lst, i = found
        entry = lst[i]
        old = entry.get("links") if isinstance(entry.get("links"), list) else []
        pos = next(
            (k for k, l in enumerate(old) if isinstance(l, dict) and l.get("type") == "author"),
            0,
        )
        others = [l for l in old if not (isinstance(l, dict) and l.get("type") == "author")]
        links = others[:pos] + [{"type": "author", "url": a} for a in authors] + others[pos:]

        def put(e, key, value):  # keep the usual order: ..., tags, links, meta
            if value in (None, [], {}):
                e.pop(key, None)
                return e
            if key in e:
                e[key] = value
                return e
            out = {}
            for k, v in e.items():
                if k == "meta" and key not in out:
                    out[key] = value
                out[k] = v
            out.setdefault(key, value)
            return out

        entry = put(entry, "tags", tags)
        entry = put(entry, "links", links)
        lst[i] = entry
        APP.save(data)
    added, warn = register_authors(authors, p.get("newAuthors"))
    return {"ok": True, "added": added, "warn": warn}


def job_add_styles(job, p):
    """add one or more styles to an existing mod (a single-file mod is converted to a styled one)"""
    cat, name = p["category"], p["name"]
    new = p.get("styles") or []
    if not new:
        raise ValueError("add at least one style")
    data, _ = APP.load()
    found = find_mod(data, cat, name)
    if not found:
        raise ValueError("mod not found")
    entry = found[1][found[2]]
    existing = [s for s in (entry.get("styles") or []) if isinstance(s, dict)]
    if not existing and not simple_name(entry.get("file")):
        raise ValueError(
            "this mod's main file is a URL or nested path; edit the JSON by hand to add styles"
        )
    content = data["modsData"][cat]
    used = category_used_files(content)
    index = APP.manifest_index()
    base = slug(p.get("fileBase") or name)
    plan, taken = [], set()
    for i, z in enumerate(new):
        label = str(z.get("label") or "").strip() or f"Style {len(existing) + i + (2 if not existing else 1)}"
        stem = f"{base}-{slug(label, str(len(existing) + i + 1))}"
        fname = f"{stem}.zip"
        if fname.lower() in taken:
            raise ValueError(f"two styles produce the same file name: {fname}")
        taken.add(fname.lower())
        zp = APP.upload_path(z["uploadId"])
        if not zipfile.is_zipfile(zp):
            raise ValueError(f"not a valid zip: {zp.name}")
        reuse = check_file_name(cat, fname, zp, used, index)
        pv = APP.upload_path(z["previewUploadId"]) if z.get("previewUploadId") else None
        plan.append(
            {
                "file": fname,
                "zip": zp,
                "preview": pv,
                "label": label,
                "color": z.get("color") or "#888888",
                "stem": stem,
                "reuse": reuse,
            }
        )
    placed = place_previews(job, cat, plan)
    try:
        upload_plan(job, cat, plan)
    except Exception:
        for nm in placed:
            delete_preview(cat, nm)
        raise

    with APP.lock:
        data, _ = APP.load()
        found = find_mod(data, cat, name)
        if not found:
            raise ValueError("mod disappeared in the meantime")
        entry = found[1][found[2]]
        if not isinstance(entry.get("styles"), list) or not entry["styles"]:
            # single-file mod -> styled: the current file/preview become style 1
            first = {
                "label": str(p.get("firstLabel") or "").strip() or "Style 1",
                "color": p.get("firstColor") or "#888888",
            }
            for k in ("preview", "file", "fileWin", "fileLinux"):
                if k in entry:
                    first[k] = entry.pop(k)
            entry["styles"] = [first]
            job.log(f"Converted '{name}' to a styled mod (existing file is now '{first['label']}').")
        for x in plan:
            st = {"label": x["label"], "color": x["color"]}
            if x["previewName"]:
                st["preview"] = x["previewName"]
            st["file"] = x["file"]
            entry["styles"].append(st)
        if p.get("markUpdated", True):
            meta = entry.get("meta") if isinstance(entry.get("meta"), dict) else {}
            meta["date"] = now_ts()
            meta["commit-sha"] = ""
            entry["meta"] = meta
            touch_recent(data, cat, name)
        APP.save(data)
    job.log("")
    job.log(f"Added {len(plan)} style(s). Press 'Publish' to commit and push.")


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
    observed = {}  # category -> {tag key: seen as false}
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
                for tk, tv in (m.get("tags") or {}).items() if isinstance(m.get("tags"), dict) else []:
                    o = observed.setdefault(cat, {})
                    o[tk] = o.get(tk, False) or tv is False
                refs = file_refs(m)
                mods.append(
                    {
                        "category": cat,
                        "group": g.get("name") if g else None,
                        "name": m.get("name"),
                        "file": refs[0][1] if refs else "",
                        "files": len(refs),
                        "styles": len(m.get("styles") or []),
                        "preview": next(
                            (
                                v
                                for _t, v in preview_refs(m)
                                if ".." not in v
                                and not v.startswith(("http://", "https://"))
                            ),
                            "",
                        ),
                        "date": (m.get("meta") or {}).get("date")
                        if isinstance(m.get("meta"), dict)
                        else None,
                    }
                )
    consts, _ct = APP.load_consts()
    consts = consts or {}
    authors = sorted(
        ({"name": k, "url": v} for k, v in (consts.get("MOD_AUTHOR") or {}).items()),
        key=lambda a: a["name"].lower(),
    )
    cfg = consts.get("TAG_CONFIGS") or {}
    tag_opts = {}
    for c in cats:
        cid = c["id"]
        cmap = (cfg.get(cid) or {}).get("map") or {}
        seen = observed.get(cid, {})
        opts = [{"key": k, "label": str(v), "off": bool(seen.get(k))} for k, v in cmap.items()]
        have = {o["key"] for o in opts}
        for k in sorted(seen):
            if k not in have:
                opts.append(
                    {"key": k, "label": k.replace("-", " ").title(), "off": bool(seen[k])}
                )
        tag_opts[cid] = opts
    _, branch, _ = git_out("rev-parse", "--abbrev-ref", "HEAD")
    _, status, _ = git_out(
        "status", "--porcelain=v1", "--", "assets/data", "assets/previews"
    )
    return {
        "categories": cats,
        "authors": authors,
        "tagOptions": tag_opts,
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
    "/api/mod/set-meta": api_set_meta,
    "/api/bundle/inspect": api_bundle_inspect,
    "/api/mod/replace-preview": api_replace_preview,
    "/api/mod/delete": api_delete,
    "/api/unqueue": api_unqueue,
    "/api/undo": api_undo,
}
JOB_ROUTES = {
    "/api/mod/add": job_add,
    "/api/mod/bulk-add": job_bulk_add,
    "/api/mod/add-styles": job_add_styles,
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
        if "Cache-Control" not in (extra or {}):
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
                return self._send(
                    200,
                    f.read_bytes(),
                    IMG_TYPES[f.suffix.lower()],
                    {"Cache-Control": "private, max-age=3600"},
                )
            except Exception:  # noqa: BLE001
                return self._send(404, {"error": "not found"})
        if u.path == "/upload-preview":
            try:
                f = APP.upload_path(q["id"][0])
                if f.suffix.lower() not in IMG_TYPES:
                    raise FileNotFoundError
                return self._send(
                    200, f.read_bytes(), IMG_TYPES[f.suffix.lower()],
                    {"Cache-Control": "private, max-age=3600"},
                )
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
<meta name="theme-color" content="#141218">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded&display=block">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@1..144,1..1000&display=swap">
<style>
/* tokens: same names and roles as the site (seed #7b00ff, tonal-spot) */
:root{color-scheme:dark;
--primary:#d3bbff;--on-primary:#3f008d;--primary-container:#5a00c6;--on-primary-container:#ebddff;
--secondary-container:#4b4358;--on-secondary-container:#e9ddf9;
--surface:#141218;--on-surface:#e6e0e9;--on-surface-variant:#cbc4d0;--outline:#948e9a;--outline-variant:#49454e;
--sc-low:#1d1b20;--sc:#211f24;--sc-high:#2b292f;--sc-highest:#36343a;
--error:#ffb4ab;--on-error:#690005;--ok:#7fdcb0;--warn:#f5b968;
--ease:cubic-bezier(.2,.8,.2,1)}
@media(prefers-color-scheme:light){:root{color-scheme:light;
--primary:#6c1fe0;--on-primary:#fff;--primary-container:#ebddff;--on-primary-container:#23005c;
--secondary-container:#e9ddf9;--on-secondary-container:#20182b;
--surface:#fef7ff;--on-surface:#1d1b20;--on-surface-variant:#4a454e;--outline:#7b757f;--outline-variant:#cbc4cf;
--sc-low:#f7f2fa;--sc:#f3edf7;--sc-high:#ece6f0;--sc-highest:#e6e0e9;
--error:#ba1a1a;--on-error:#fff;--ok:#0b6b49;--warn:#8a5100}}
*{box-sizing:border-box}
[hidden]{display:none!important}
html{scrollbar-color:var(--outline-variant) transparent}
body{margin:0;font:14px/1.5 "Google Sans Flex",Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--surface);color:var(--on-surface)}
body.noscroll{overflow:hidden}
.ms{font-family:"Material Symbols Rounded";font-weight:400;font-style:normal;font-size:20px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;direction:ltr;font-feature-settings:"liga";-webkit-font-feature-settings:"liga";user-select:none;flex:none}
:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
html:not(.icons) .ms,html:not(.icons) .media.nopv::before{display:none}

/* app bar */
header{position:sticky;top:0;z-index:10;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 20px;background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px)}
header h1{font-size:22px;font-weight:500;margin:0 10px 0 0;letter-spacing:-.01em}
.chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:99px;background:var(--sc-high);color:var(--on-surface-variant);font-size:12.5px;white-space:nowrap}
.chip .ms{font-size:16px}.chip.warn{color:var(--warn)}.chip.dry{background:var(--primary-container);color:var(--on-primary-container)}
.spacer{flex:1}

/* buttons */
button,.btn{font:inherit;font-weight:500;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 20px;border:0;border-radius:99px;background:transparent;color:var(--primary);cursor:pointer;transition:background .2s var(--ease),box-shadow .2s var(--ease)}
button:hover,.btn:hover{background:color-mix(in srgb,var(--primary) 10%,transparent)}
.tonal{background:var(--secondary-container);color:var(--on-secondary-container)}
.tonal:hover{background:color-mix(in srgb,var(--on-secondary-container) 10%,var(--secondary-container))}
.filled{background:var(--primary);color:var(--on-primary)}
.filled:hover{background:color-mix(in srgb,var(--on-primary) 10%,var(--primary));box-shadow:0 2px 8px rgba(0,0,0,.3)}
.outlined{box-shadow:inset 0 0 0 1px var(--outline)}
.danger{color:var(--error);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--error) 45%,transparent)}
.danger:hover{background:color-mix(in srgb,var(--error) 12%,transparent)}
.sm{height:34px;padding:0 14px;font-size:13px}
.icon-btn{width:40px;padding:0;color:var(--on-surface-variant)}
button:disabled{opacity:.4;cursor:default;pointer-events:none}

/* layout */
#shell{display:grid;grid-template-columns:1fr;gap:20px;padding:8px 20px 40px;max-width:1760px;margin:0 auto;align-items:start}
#shell.has-panel{grid-template-columns:minmax(0,1fr) minmax(400px,540px)}
.toolbar{position:sticky;top:var(--hh,64px);z-index:5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 0 14px;background:linear-gradient(var(--surface) 80%,transparent)}
.field{position:relative;display:flex;align-items:center;flex:1 1 260px;min-width:200px;height:48px;border-radius:99px;background:var(--sc-high);transition:box-shadow .2s}
.field:focus-within{box-shadow:inset 0 0 0 2px var(--primary)}
.field .ms{position:absolute;left:16px;color:var(--on-surface-variant);pointer-events:none}
.field input{width:100%;height:100%;padding:0 18px 0 46px;border:0;outline:0;background:none;color:inherit;font:inherit}
.field input::placeholder{color:var(--on-surface-variant)}
select{font:inherit;color:var(--on-surface);height:48px;padding:0 16px;border-radius:99px;border:0;background:var(--sc-high);max-width:220px;cursor:pointer}
.seg{display:flex;border-radius:99px;box-shadow:inset 0 0 0 1px var(--outline-variant);overflow:hidden}
.seg button{border-radius:0;height:46px;width:48px;padding:0;color:var(--on-surface-variant)}
.seg button[aria-pressed=true]{background:var(--secondary-container);color:var(--on-secondary-container)}
#count{color:var(--on-surface-variant);font-size:13px;padding:0 6px}

/* mod cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:10px}
.mcard{display:flex;flex-direction:column;border-radius:24px;background:var(--sc);overflow:hidden;cursor:pointer;content-visibility:auto;contain-intrinsic-size:auto 260px;transition:background .2s var(--ease),transform .2s var(--ease)}
.mcard:hover{background:color-mix(in srgb,var(--primary) 8%,var(--surface));transform:translateY(-2px)}
.mcard.sel{background:color-mix(in srgb,var(--primary-container) 45%,var(--surface));box-shadow:inset 0 0 0 2px var(--primary)}
.media{position:relative;aspect-ratio:16/10;background:var(--sc-high);overflow:hidden}
.media img{display:block;width:100%;height:100%;object-fit:cover}
.media.nopv::before{content:"image";font-family:"Material Symbols Rounded";font-size:40px;color:var(--outline);position:absolute;inset:0;display:grid;place-items:center;font-feature-settings:"liga"}
.badge{position:absolute;left:10px;bottom:10px;padding:2px 10px;border-radius:99px;background:rgba(20,18,24,.72);color:#fff;font-size:12px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mcard .body{padding:12px 16px 16px;min-width:0}
.mcard .t{font-size:16px;font-weight:500;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mcard .s{font-size:13px;color:var(--on-surface-variant);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rows .mcard{flex-direction:row;align-items:center;border-radius:20px;gap:6px;padding:6px}
.rows .media{width:136px;flex:none;border-radius:14px}
.rows .mcard .body{padding:4px 10px}
.rows .mcard:hover{transform:none}
.empty{grid-column:1/-1;text-align:center;color:var(--on-surface-variant);padding:64px 0}
.empty .ms{font-size:40px;display:block;margin:0 auto 8px}

/* side panel */
#panel{position:sticky;top:calc(var(--hh,64px) + 8px);max-height:calc(100vh - var(--hh,64px) - 24px);overflow:auto;border-radius:28px;background:var(--sc-low);padding:0 0 20px}
#panelBar{position:sticky;top:0;z-index:2;display:flex;justify-content:flex-end;align-items:flex-start;height:0;padding:0;pointer-events:none}
#panelBar button{pointer-events:auto;background:rgba(20,18,24,.6);color:#fff;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);margin:10px 10px 0 0}
.hero{aspect-ratio:16/9;background:var(--sc-high)}
.hero img{width:100%;height:100%;object-fit:cover;display:block}
.hero .ph{height:100%;display:grid;place-items:center;color:var(--outline)}.hero .ph .ms{font-size:44px}
.head{padding:16px 20px 4px}.head h2{margin:0 0 8px;font-size:24px;font-weight:500;line-height:1.25}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.sect{margin:14px 14px 0;padding:14px 16px 16px;border-radius:20px;background:var(--sc)}
.sect h3{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:15px;font-weight:500}
.sect h3 .ms{color:var(--primary);font-size:20px}
.ref{display:flex;gap:12px;align-items:center;padding:8px 0}
.ref+.ref{border-top:1px solid var(--outline-variant)}
.ref .grow{flex:1;min-width:0;word-break:break-all}
.ref .grow small{display:block;color:var(--on-surface-variant)}
.thumb{width:112px;height:64px;flex:none;object-fit:cover;border-radius:12px;background:var(--sc-high)}
div.thumb{display:grid;place-items:center;color:var(--outline)}
.muted{color:var(--on-surface-variant)}.ok{color:var(--ok)}.bad{color:var(--error)}
.loading{padding:48px;text-align:center;color:var(--on-surface-variant)}
.danger-zone{background:color-mix(in srgb,var(--error) 8%,var(--sc))}.danger-zone h3 .ms{color:var(--error)}

/* forms */
label{display:block;font-size:13px;color:var(--on-surface-variant);margin:12px 0 4px}
label.chk{display:flex;gap:10px;align-items:flex-start;color:var(--on-surface);margin:12px 0 4px;cursor:pointer}
input[type=checkbox]{accent-color:var(--primary);width:18px;height:18px;margin:1px 0 0;flex:none}
input[type=text]{font:inherit;width:100%;height:46px;padding:0 16px;border-radius:14px;border:0;background:var(--sc-high);color:inherit;outline:0}
textarea{font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;width:100%;min-height:240px;padding:12px 14px;border-radius:14px;border:0;background:var(--sc-high);color:inherit;outline:0;resize:vertical}
input[type=text]:focus,textarea:focus,select:focus{box-shadow:inset 0 0 0 2px var(--primary)}
input[type=color]{width:56px;height:46px;padding:4px;border:0;border-radius:14px;background:var(--sc-high);cursor:pointer}
input[type=file]{font:inherit;color:var(--on-surface-variant);max-width:100%}
input[type=file]::file-selector-button{font:inherit;font-weight:500;height:34px;padding:0 14px;margin-right:12px;border:0;border-radius:99px;background:var(--secondary-container);color:var(--on-secondary-container);cursor:pointer}
.row{display:flex;gap:8px;align-items:center}.row>*{flex:1}.row>.fit{flex:none}
.style-row{border-radius:16px;padding:4px 14px 14px;margin-top:10px;background:var(--sc-high)}
.style-row input[type=text],.style-row input[type=color]{background:var(--sc)}
.pvthumb{display:block;width:100%;max-width:260px;aspect-ratio:16/10;object-fit:cover;border-radius:14px;margin-top:8px}
.note{display:flex;gap:10px;background:var(--sc-high);padding:12px 14px;border-radius:14px;margin:12px 0;font-size:13px;color:var(--on-surface-variant)}
.note .ms{color:var(--primary)}
.addhead{padding:20px 20px 0}.addhead h2{margin:0;font-size:24px;font-weight:500}
#add .sect{margin-top:12px}

/* pickers, bundle rows */
.pick{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}
.pchip{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 12px;border-radius:8px;background:var(--sc-high);color:var(--on-surface-variant);font-size:13px;font-weight:500;box-shadow:inset 0 0 0 1px var(--outline-variant)}
button.pchip{cursor:pointer}
.pchip.on{background:var(--secondary-container);color:var(--on-secondary-container);box-shadow:none}
.pchip.new{box-shadow:inset 0 0 0 1px var(--warn)}
.pchip .ms{font-size:16px}
.pchip button{height:22px;width:22px;padding:0;margin:0 -6px 0 2px;border-radius:50%;font-size:16px;line-height:1;color:inherit}
details.adv{margin-top:10px}details.adv summary{cursor:pointer;color:var(--on-surface-variant)}
.bitem{display:flex;gap:12px;align-items:center}
.bthumb{width:72px;aspect-ratio:16/10;object-fit:cover;border-radius:10px;flex:none;background:var(--sc)}
.style-row small{display:block}
.style-row small.bad{display:inline}

/* log sheet, dialog, snackbar */
#log{position:fixed;left:0;right:0;bottom:0;max-height:45vh;background:var(--sc-highest);color:var(--on-surface);border-radius:28px 28px 0 0;display:none;z-index:30;box-shadow:0 -4px 24px rgba(0,0,0,.35)}
#log pre{margin:0;padding:4px 24px 20px;overflow:auto;max-height:calc(45vh - 56px);font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}
#log .bar{display:flex;justify-content:space-between;align-items:center;padding:10px 12px 6px 24px;font-weight:500}
dialog{border:0;border-radius:28px;background:var(--sc-high);color:var(--on-surface);max-width:560px;width:92%;padding:24px}
dialog::backdrop{background:rgba(0,0,0,.55)}
dialog h2{margin:0 0 12px;font-size:24px;font-weight:500}
dialog a{color:var(--primary)}
#snacks{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);display:grid;gap:8px;z-index:40;width:min(92vw,520px)}
.snack{background:var(--on-surface);color:var(--surface);padding:12px 18px;border-radius:14px;white-space:pre-line;box-shadow:0 4px 16px rgba(0,0,0,.35)}

@media(max-width:900px){
 header,.toolbar{position:static}
 #shell.has-panel{grid-template-columns:1fr}
 #panel{position:fixed;inset:0;max-height:none;border-radius:0;z-index:20}
 .grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
 .rows{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style></head><body>
<header>
  <h1>D2PFX admin</h1>
  <span class="chip" id="branch"></span><span class="chip dry" id="dry" hidden>DRY-RUN: GitHub is not touched</span>
  <span class="chip" id="changes"></span><span class="chip warn" id="pending" hidden></span>
  <span class="spacer"></span>
  <button class="tonal" id="bSync"><span class="ms">sync</span>Sync</button>
  <button class="tonal" id="bValidate"><span class="ms">task_alt</span>Validate</button>
  <button class="tonal" id="bUndo"><span class="ms">undo</span>Undo</button>
  <button class="filled" id="bPublish"><span class="ms">cloud_upload</span>Publish…</button>
</header>
<main id="shell">
  <section id="browse">
    <div class="toolbar">
      <label class="field" aria-label="Search mods"><span class="ms">search</span><input type="search" id="q" placeholder="Search mods…" autocomplete="off"></label>
      <select id="cat" aria-label="Category"></select>
      <div class="seg" role="group" aria-label="View">
        <button id="vGrid" aria-label="Grid view" aria-pressed="true"><span class="ms">grid_view</span></button>
        <button id="vRows" aria-label="List view" aria-pressed="false"><span class="ms">view_list</span></button>
      </div>
      <span id="count"></span>
      <span class="spacer"></span>
      <button class="tonal" id="tBulk"><span class="ms">library_add</span>Bulk upload</button>
      <button class="filled" id="tAdd"><span class="ms">add</span>Add mod</button>
    </div>
    <div id="list" class="grid"></div>
  </section>
  <aside id="panel" hidden>
    <div id="panelBar"><span></span><button class="icon-btn" id="pClose" aria-label="Close"><span class="ms">close</span></button></div>
    <div id="edit"></div>
    <div id="add" hidden></div>
    <div id="bulk" hidden></div>
  </aside>
</main>
<div id="log"><div class="bar"><span id="logTitle">Log</span><button class="icon-btn" onclick="hideLog()" aria-label="Close log"><span class="ms">close</span></button></div><pre id="logPre"></pre></div>
<datalist id="dlAuthors"></datalist>
<dialog id="dlg"></dialog>
<div id="snacks" role="status" aria-live="polite"></div>
<script>
const TOKEN="__TOKEN__";let S={mods:[],categories:[]},SEL=null,BUST=Date.now(),VIEW='grid';
try{VIEW=localStorage.getItem('d2pfx_admin_view')==='rows'?'rows':'grid'}catch(e){}
const $=s=>document.querySelector(s);
document.fonts.load('20px "Material Symbols Rounded"').then(f=>{if(f.length)document.documentElement.classList.add('icons')},()=>{});
{const h=document.querySelector('header'),set=()=>document.documentElement.style.setProperty('--hh',h.offsetHeight+'px');new ResizeObserver(set).observe(h);set()}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=n=>`<span class="ms">${n}</span>`;
const pv=(c,n)=>`/preview?cat=${encodeURIComponent(c)}&name=${encodeURIComponent(n)}&t=${TOKEN}&v=${BUST}`;
async function api(path,body){const o={headers:{'X-Admin-Token':TOKEN}};if(body!==undefined){o.method='POST';o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
 const r=await fetch(path,o);const j=await r.json().catch(()=>({error:'bad response'}));if(!r.ok)throw new Error(j.error||r.statusText);return j}
async function upload(file){const r=await fetch('/api/upload?name='+encodeURIComponent(file.name),{method:'POST',headers:{'X-Admin-Token':TOKEN},body:file});const j=await r.json();if(!r.ok)throw new Error(j.error);return j.id}
function toast(m,ms=5000){const t=document.createElement('div');t.className='snack';t.textContent=m;$('#snacks').appendChild(t);setTimeout(()=>t.remove(),ms)}
function hideLog(){$('#log').style.display='none'}
async function runJob(p,title){$('#log').style.display='block';$('#logTitle').textContent=title;const pre=$('#logPre');pre.textContent='';
 let id;try{id=(await p).job}catch(e){pre.textContent='ERROR: '+e.message;return false}
 let from=0;for(;;){const j=await api('/api/job?id='+id+'&from='+from);if(j.lines.length){pre.textContent+=j.lines.join('\n')+'\n';pre.scrollTop=pre.scrollHeight}from=j.next;
  if(j.status!=='running'){$('#logTitle').textContent=title+(j.status==='ok'?' — done':' — FAILED');BUST=Date.now();await refresh();return j.status==='ok'}await new Promise(r=>setTimeout(r,700))}}
async function refresh(){S=await api('/api/state');$('#dlAuthors').innerHTML=(S.authors||[]).map(a=>`<option value="${esc(a.name)}">`).join('');$('#branch').innerHTML=ic('call_split')+esc(S.branch);$('#dry').hidden=!S.dry;
 $('#changes').innerHTML=ic(S.changes.length?'edit_note':'check')+(S.changes.length?S.changes.length+' local change(s)':'no local changes');$('#changes').className='chip'+(S.changes.length?' warn':'');
 $('#pending').hidden=!S.pendingRemove.length;$('#pending').textContent=S.pendingRemove.length+' file(s) to remove from releases on Publish';
 $('#bUndo').disabled=!S.undo;const sel=$('#cat'),cur=sel.value;sel.innerHTML='<option value="">All categories</option>'+S.categories.map(c=>`<option>${esc(c.id)}</option>`).join('');sel.value=cur;renderList();
 if(!S.releasesOk)toast('Releases repo clone not found: uploads will fail. Use --releases-dir.')}

/* list with previews */
function markSel(){document.querySelectorAll('.mcard').forEach(e=>e.classList.toggle('sel',!!SEL&&e.dataset.c===SEL.c&&e.dataset.n===SEL.n))}
function renderList(){const q=$('#q').value.toLowerCase(),c=$('#cat').value;
 const items=S.mods.filter(m=>(!c||m.category===c)&&(!q||(m.name||'').toLowerCase().includes(q)||(m.file||'').toLowerCase().includes(q)));
 const L=$('#list');L.className=VIEW==='rows'?'rows':'grid';
 $('#count').textContent=items.length===S.mods.length?items.length+' mods':items.length+' of '+S.mods.length;
 L.innerHTML=items.map(m=>{const media=m.preview?`<img loading="lazy" decoding="async" alt="" src="${pv(m.category,m.preview)}" onerror="this.parentNode.classList.add('nopv');this.remove()">`:'';
  return `<article class="mcard" tabindex="0" role="button" aria-label="${esc(m.name)}" data-c="${esc(m.category)}" data-n="${esc(m.name)}"><div class="media${m.preview?'':' nopv'}">${media}${m.styles>1?`<span class="badge">${m.styles} styles</span>`:''}</div><div class="body"><div class="t" title="${esc(m.name)}">${esc(m.name)}</div><div class="s">${esc(m.category)}${m.group?' / '+esc(m.group):''}</div></div></article>`}).join('')
  ||`<div class="empty">${ic('search_off')}<div>Nothing found. Try another name or category.</div></div>`;
 L.querySelectorAll('.mcard').forEach(e=>{const go=()=>openMod(e.dataset.c,e.dataset.n);e.onclick=go;e.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();go()}}});markSel()}
function setView(v){VIEW=v;try{localStorage.setItem('d2pfx_admin_view',v)}catch(e){}$('#vGrid').setAttribute('aria-pressed',v==='grid');$('#vRows').setAttribute('aria-pressed',v==='rows');renderList()}
$('#vGrid').onclick=()=>setView('grid');$('#vRows').onclick=()=>setView('rows');setView(VIEW);
$('#q').oninput=renderList;$('#cat').onchange=renderList;

/* side panel */
function showPanel(t){$('#panel').hidden=false;$('#shell').classList.add('has-panel');$('#edit').hidden=t!=='edit';$('#add').hidden=t!=='add';$('#bulk').hidden=t!=='bulk';$('#panel').scrollTop=0;if(innerWidth<=900)document.body.classList.add('noscroll')}
function closePanel(){$('#panel').hidden=true;$('#shell').classList.remove('has-panel');document.body.classList.remove('noscroll');SEL=null;markSel()}
$('#pClose').onclick=closePanel;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#dlg').open&&!$('#panel').hidden)closePanel()});
$('#tAdd').onclick=()=>{SEL=null;markSel();renderAdd();showPanel('add')};
$('#tBulk').onclick=()=>{SEL=null;markSel();renderBulk();showPanel('bulk')};

async function openMod(c,n){SEL={c,n};markSel();showPanel('edit');const box=$('#edit');box.innerHTML='<div class="loading">Loading…</div>';
 let d;try{d=await api('/api/mod?category='+encodeURIComponent(c)+'&name='+encodeURIComponent(n))}catch(e){box.innerHTML='<p class="bad" style="padding:20px">'+esc(e.message)+'</p>';return}
 const hero=d.previews.find(f=>f.exists);const ns=(d.entry.styles||[]).length;
 const files=d.files.map(f=>`<div class="ref"><div class="grow"><b>${esc(f.target)}</b><small>${esc(f.value)} ${f.inManifest?'<span class="ok">· in releases</span>':'<span class="bad">· not in manifest</span>'}</small></div>${f.editable?`<label class="btn tonal sm" style="margin:0">${ic('upload_file')}Replace<input type="file" accept=".zip" data-t="${esc(f.target)}" class="rf" hidden></label>`:'<span class="muted">URL / nested path</span>'}</div>`).join('')||'<p class="muted">No files.</p>';
 const prevs=d.previews.map(f=>`<div class="ref">${f.exists?`<img class="thumb" loading="lazy" src="${pv(c,f.value)}" alt="">`:`<div class="thumb">${ic('hide_image')}</div>`}<div class="grow"><b>${esc(f.target)}</b><small>${esc(f.value)} ${f.exists?'':'<span class="bad">· file missing</span>'}</small></div><label class="btn tonal sm" style="margin:0">${ic('image')}Replace<input type="file" accept="image/*" data-t="${esc(f.target)}" class="rp" hidden></label></div>`).join('')||'<p class="muted">No previews.</p>';
 box.innerHTML=`<div class="hero">${hero?`<img src="${pv(c,hero.value)}" alt="">`:`<div class="ph">${ic('hide_image')}</div>`}</div>
 <div class="head"><h2>${esc(n)}</h2><div class="chips"><span class="chip">${esc(c)}</span>${d.group?`<span class="chip">${esc(d.group)}</span>`:''}${ns>1?`<span class="chip">${ns} styles</span>`:''}</div></div>
 <section class="sect"><h3>${ic('image')}Previews</h3>${prevs}</section>
 <section class="sect"><h3>${ic('folder_zip')}Files (zip)</h3>${files}<label class="chk"><input type="checkbox" id="mark" checked><span>After replacing a file, mark as updated (meta.date and “recently added”, so Discord says “Updated”)</span></label></section>
 <section class="sect"><h3>${ic('person')}Authors and tags</h3><label>Authors</label><div id="eAuth"></div><label>Tags</label><div id="eTags"></div>
  <div class="row" style="margin-top:10px"><button class="filled fit" id="eMetaSave">${ic('save')}Save authors and tags</button><span class="muted">Local only until you press Publish.</span></div></section>
 <section class="sect"><h3>${ic('palette')}Add styles</h3>
  ${ns?'':`<div class="note">${ic('info')}<span>This mod has a single file. Adding a style converts it to a styled mod: the current file becomes the first style.</span></div><label>Label for the existing file</label><div class="row"><input type="text" id="sFirst" placeholder="Style 1"><input type="color" id="sFirstCol" class="fit" value="#888888"></div>`}
  <div id="sRows"></div><button class="tonal sm" id="sMore" style="margin-top:10px">${ic('add')}Add style row</button>
  <label class="chk"><input type="checkbox" id="sMark" checked><span>Mark as updated (meta.date and “recently added”)</span></label>
  <button class="filled" id="sGo" style="margin-top:10px">${ic('upload')}Upload styles</button></section>
 <section class="sect"><h3>${ic('data_object')}Entry (JSON)</h3><textarea id="json" spellcheck="false">${esc(JSON.stringify(d.entry,null,2))}</textarea>
  <div class="row" style="margin-top:10px"><button class="filled fit" id="bSave">${ic('save')}Save JSON</button><span class="muted">Changes the local mods.json only. Publish to push.</span></div></section>
 <section class="sect danger-zone"><h3>${ic('delete')}Delete</h3><label class="chk"><input type="checkbox" id="rmf" checked><span>Also remove the zip file(s) from the releases repo (done on Publish, after the site stops using them)</span></label>
  <button class="danger" id="bDel" style="margin-top:10px">${ic('delete')}Delete this mod</button></section>`;
 document.querySelectorAll('.rf').forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;if(!confirm('Replace '+i.dataset.t+' with '+f.name+'?'))return;
  await runJob((async()=>{const id=await upload(f);return api('/api/mod/replace-file',{category:c,name:n,target:i.dataset.t,uploadId:id,markUpdated:$('#mark').checked})})(),'Replace file');openMod(c,n)});
 document.querySelectorAll('.rp').forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;try{const id=await upload(f);await api('/api/mod/replace-preview',{category:c,name:n,target:i.dataset.t,uploadId:id});BUST=Date.now();await refresh();openMod(c,n);toast('Preview replaced')}catch(e){toast(e.message)}});
 const EA=authorPicker($('#eAuth'),(d.entry.links||[]).filter(l=>l&&l.type==='author').map(l=>l.url)),ET=tagPicker($('#eTags'),c,d.entry.tags||{});
 $('#eMetaSave').onclick=async()=>{const au=EA.get();try{const r=await api('/api/mod/set-meta',{category:c,name:n,authors:au.authors,newAuthors:au.newAuthors,tags:ET.get()});await refresh();openMod(c,n);toast('Saved locally'+(r.added&&r.added.length?'\nAdded to constants.json: '+r.added.join(', '):'')+(r.warn?'\n'+r.warn:''))}catch(x){toast(x.message)}};
 const sRows=$('#sRows');styleRowEl(sRows);$('#sMore').onclick=()=>styleRowEl(sRows);
 $('#sGo').onclick=async()=>{const list=[];for(const r of sRows.children){const z=r.querySelector('.zip').files[0];if(!z)return toast('Choose a zip in every style row');list.push({z,p:r.querySelector('.pv').files[0],label:r.querySelector('.lab').value.trim(),color:r.querySelector('.col').value})}
  if(!list.length)return toast('Add at least one style row');
  const fl=$('#sFirst'),fc=$('#sFirstCol');$('#sGo').disabled=true;
  const ok=await runJob((async()=>{$('#logPre').textContent='Uploading files to the local server…';const styles=[];for(const x of list){const e={uploadId:await upload(x.z),label:x.label,color:x.color};if(x.p)e.previewUploadId=await upload(x.p);styles.push(e)}
   return api('/api/mod/add-styles',{category:c,name:n,styles,firstLabel:fl?fl.value.trim():'',firstColor:fc?fc.value:'',markUpdated:$('#sMark').checked})})(),'Add styles to "'+n+'"');
  $('#sGo').disabled=false;if(ok)openMod(c,n)};
 $('#bSave').onclick=async()=>{let e;try{e=JSON.parse($('#json').value)}catch(x){return toast('Invalid JSON: '+x.message)}try{await api('/api/mod/save',{category:c,name:n,entry:e});await refresh();SEL={c,n:e.name};markSel();openMod(c,e.name);toast('Saved locally')}catch(x){toast(x.message)}};
 $('#bDel').onclick=async()=>{if(!confirm('Delete "'+n+'" from mods.json?'))return;try{const r=await api('/api/mod/delete',{category:c,name:n,removeFiles:$('#rmf').checked});
  let m='Deleted locally.';if(r.queued.length)m+='\nQueued for removal from releases on Publish:\n'+r.queued.join('\n');if(r.packWarnings.length)m+='\n\nWARNING: still listed in packs:\n'+r.packWarnings.join('\n');alert(m);closePanel();await refresh()}catch(x){toast(x.message)}}}

function styleRowEl(rows){const d=document.createElement('div');d.className='style-row';
 d.innerHTML=`<div class="row" style="margin-top:12px"><input type="text" class="lab" placeholder="Style label (e.g. Red)"><input type="color" class="col fit" value="#8b5cf6"><button type="button" class="icon-btn fit rm" aria-label="Remove style">${ic('close')}</button></div>
  <label>Zip file</label><input type="file" accept=".zip" class="zip"><label>Preview image (optional)</label><input type="file" accept="image/*" class="pv"><img class="pvthumb" alt="" hidden>`;
 const pi=d.querySelector('.pv'),th=d.querySelector('.pvthumb');
 pi.onchange=()=>{const f=pi.files[0];if(th.src&&th.src.startsWith('blob:'))URL.revokeObjectURL(th.src);if(f){th.src=URL.createObjectURL(f);th.hidden=false}else{th.hidden=true}};
 d.querySelector('.rm').onclick=()=>d.remove();rows.appendChild(d);return d}

/* pickers: authors and tags come from constants.json (no JSON editing) */
const knownAuthors=()=>new Map((S.authors||[]).map(a=>[a.name.toLowerCase(),a.name]));
function authorPicker(box,init){
 const st={list:[],urls:{}},K=knownAuthors();
 box.innerHTML=`<div class="pick" data-r="chips"></div><div class="row"><input type="text" list="dlAuthors" data-r="inp" autocomplete="off" placeholder="Pick or type an author, press Enter"><button type="button" class="tonal sm fit" data-r="add">${ic('add')}Add</button></div><div data-r="new"></div>`;
 const q=r=>box.querySelector('[data-r='+r+']'),isNew=n=>!K.has(n.toLowerCase());
 const draw=()=>{q('chips').innerHTML=st.list.map((n,i)=>`<span class="pchip on${isNew(n)?' new':''}">${esc(n)}${isNew(n)?' (new)':''}<button type="button" data-i="${i}" aria-label="Remove ${esc(n)}">×</button></span>`).join('')||'<span class="muted">No authors selected</span>';
  q('chips').querySelectorAll('button').forEach(b=>b.onclick=()=>{st.list.splice(+b.dataset.i,1);draw()});
  q('new').innerHTML=st.list.filter(isNew).map(n=>`<label>Link for the new author “${esc(n)}” (optional, saved to constants.json)</label><input type="text" data-n="${esc(n)}" value="${esc(st.urls[n]||'')}" placeholder="https://t.me/...">`).join('');
  q('new').querySelectorAll('input').forEach(i=>i.oninput=()=>{st.urls[i.dataset.n]=i.value.trim()})};
 const add=()=>{const v=q('inp').value.trim();if(!v)return;const n=K.get(v.toLowerCase())||v;if(!st.list.some(x=>x.toLowerCase()===n.toLowerCase()))st.list.push(n);q('inp').value='';draw()};
 q('add').onclick=add;q('inp').onchange=add;q('inp').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}};
 (init||[]).forEach(n=>{if(typeof n==='string'&&n&&!st.list.some(x=>x.toLowerCase()===n.toLowerCase()))st.list.push(K.get(n.toLowerCase())||n)});draw();
 return{get:()=>{add();const nu={};st.list.forEach(n=>{if(isNew(n))nu[n]=st.urls[n]||''});return{authors:[...st.list],newAuthors:nu}}}}

function tagPicker(box,cat,init){
 const on=new Set(Object.entries(init||{}).filter(([k,v])=>v===true).map(([k])=>k)),custom=new Set(Object.keys(init||{}));let C=cat;
 box.innerHTML=`<div class="pick" data-r="tags"></div><div class="row"><input type="text" data-r="ci" autocomplete="off" placeholder="Other tag (a-z, 0-9, -), Enter to add"><button type="button" class="tonal sm fit" data-r="ca">${ic('add')}Add</button></div>`;
 const q=r=>box.querySelector('[data-r='+r+']');
 const opts=()=>{const base=((S.tagOptions||{})[C])||[],keys=new Set(base.map(o=>o.key));return base.concat([...custom].filter(k=>!keys.has(k)).map(k=>({key:k,label:k,off:false})))};
 const draw=()=>{const o=opts();q('tags').innerHTML=o.map(x=>`<button type="button" class="pchip${on.has(x.key)?' on':''}" data-k="${esc(x.key)}" aria-pressed="${on.has(x.key)}">${on.has(x.key)?ic('check'):''}${esc(x.label)}</button>`).join('')||'<span class="muted">No tags for this category yet. Add one below if needed.</span>';
  q('tags').querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;on.has(k)?on.delete(k):on.add(k);draw()})};
 const add=()=>{const v=q('ci').value.trim().toLowerCase();if(!v)return;if(!/^[a-z0-9_-]{1,40}$/.test(v))return toast('Tag: only a-z, 0-9, - and _');custom.add(v);on.add(v);q('ci').value='';draw()};
 q('ca').onclick=add;q('ci').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}};draw();
 return{setCategory:c=>{C=c;const base=new Set((((S.tagOptions||{})[C])||[]).map(o=>o.key));[...on].forEach(k=>{if(!base.has(k))on.delete(k)});custom.clear();draw()},
  get:()=>{if(!on.size)return{};const t={};opts().forEach(x=>{if(on.has(x.key))t[x.key]=true;else if(x.off)t[x.key]=false});return t}}}

/* bundle archive = one zip with the preview image + the mod zip(s) inside */
const upv=id=>`/upload-preview?id=${encodeURIComponent(id)}&t=${TOKEN}`;
async function inspectBundle(file,mode){const id=await upload(file);return api('/api/bundle/inspect',{uploadId:id,mode})}
const stemOf=n=>n.replace(/\.[^.]+$/,'');
const nameFromFile=n=>stemOf(n).replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();

let BUNDLED=[],LOOSE=[],BULK_INGEST=null;
function renderBulk(){BUNDLED=[];LOOSE=[];const cats=S.categories;$('#bulk').innerHTML=`<div class="addhead"><h2>Bulk upload</h2></div>
 <section class="sect"><h3>${ic('category')}Shared by every mod</h3>
  <label>Category</label><select id="bCat" style="width:100%;max-width:none">${cats.map(c=>`<option>${esc(c.id)}</option>`).join('')}</select>
  <div id="bGroupBox"></div>
  <label>Authors</label><div id="bAuth"></div>
  <label>Tags</label><div id="bTagBox"></div>
  <details class="adv"><summary>Extra links (JSON, optional)</summary><textarea id="bLinks" style="min-height:64px" placeholder='[{"type":"source","url":"..."}]'></textarea></details>
  <label class="chk"><input type="checkbox" id="bRecent" checked><span>Add all to “recently added”</span></label></section>
 <section class="sect"><h3>${ic('folder_zip')}Files</h3>
  <label>Bundle archives: a zip with the preview image and the mod zip inside (picked automatically). One archive may hold one mod, or many: pairs matched by file name, or one folder per mod.</label>
  <input type="file" accept=".zip" multiple id="bBund"><div id="bStat" class="muted"></div>
  <label>Or plain mod zips (select many)</label><input type="file" accept=".zip" multiple id="bZips">
  <label>Preview images for plain zips (optional, matched by file name: cool-mod.zip ↔ cool-mod.png)</label><input type="file" accept="image/*" multiple id="bPvs">
  <div id="bList"></div></section>
 <div style="margin:12px 14px 0"><div class="note">${ic('info')}<span>Names come from the files; edit them below. Everything is checked first and nothing is uploaded if any mod has a problem. Zips go to the releases repo in one run; mods.json changes locally until you press Publish.</span></div>
 <button class="filled" id="bGo" disabled>${ic('library_add')}Add mods</button></div>`;
 const AP=authorPicker($('#bAuth'),[]),TP=tagPicker($('#bTagBox'),$('#bCat').value,{});
 const grp=()=>{const c=cats.find(x=>x.id===$('#bCat').value);$('#bGroupBox').innerHTML=c&&c.grouped?`<label>Group</label><select id="bGroup" style="width:100%;max-width:none">${c.groups.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}<option value="">(new group…)</option></select><input type="text" id="bGroupNew" placeholder="New group name" hidden style="margin-top:8px">`:'';
  const sel=$('#bGroup');if(sel)sel.onchange=()=>{$('#bGroupNew').hidden=sel.value!==''}};
 grp();
 const pvMap=()=>{const m={};for(const f of $('#bPvs').files)m[stemOf(f.name).toLowerCase()]=f;return m};
 const draw=()=>{const pm=pvMap();LOOSE.forEach(x=>{x.pv=pm[stemOf(x.z.name).toLowerCase()]||null;if(x.pvFor!==x.pv){x.pvFor=x.pv;x.url=x.pv?URL.createObjectURL(x.pv):null}});
  const all=[...BUNDLED,...LOOSE],cat=$('#bCat').value;
  const have=new Set(S.mods.filter(m=>m.category===cat).map(m=>(m.name||'').toLowerCase())),cnt={};all.forEach(x=>{const k=x.name.trim().toLowerCase();cnt[k]=(cnt[k]||0)+1});
  $('#bList').innerHTML=all.map((x,i)=>{const k=x.name.trim().toLowerCase();
   const th=x.styles?(x.styles.find(s=>s.previewUploadId)||{}).previewUploadId:null;
   const thumb=(x.styles?th:x.url)?`<img class="bthumb" alt="" src="${esc(x.styles?upv(th):x.url)}">`:`<div class="bthumb"></div>`;
   const info=x.styles?(x.styles.length>1?x.styles.length+' styles: '+x.styles.map(s=>s.label).join(', '):x.styles[0].zipName)+' · from '+x.origin:x.z.name+' · '+(x.pv?x.pv.name:'no preview');
   const warn=have.has(k)?'already exists in this category':cnt[k]>1?'duplicate name in this batch':'';
   return `<div class="style-row"><div class="bitem" style="margin-top:12px">${thumb}<div class="grow" style="flex:1;min-width:0"><input type="text" class="bn" data-i="${i}" value="${esc(x.name)}"><small class="muted">${esc(info)}</small>${warn?`<small class="bad"> · ${esc(warn)}</small>`:''}</div><button type="button" class="icon-btn fit brm" data-i="${i}" aria-label="Remove">${ic('close')}</button></div></div>`}).join('');
  $('#bList').querySelectorAll('.bn').forEach(i=>i.oninput=()=>{all[+i.dataset.i].name=i.value});
  $('#bList').querySelectorAll('.brm').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(i<BUNDLED.length)BUNDLED.splice(i,1);else LOOSE.splice(i-BUNDLED.length,1);draw()});
  $('#bGo').disabled=!all.length;$('#bGo').lastChild.textContent=all.length?'Add '+all.length+' mod'+(all.length>1?'s':''):'Add mods'};
 $('#bCat').onchange=()=>{grp();TP.setCategory($('#bCat').value);draw()};
 $('#bZips').onchange=()=>{const old=new Map(LOOSE.map(x=>[x.z.name,x.name]));LOOSE=[...$('#bZips').files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(z=>({z,name:old.get(z.name)||nameFromFile(z.name),fileBase:stemOf(z.name),pv:null}));draw()};
 $('#bPvs').onchange=draw;
 BULK_INGEST=async files=>{for(const f of files){$('#bStat').textContent='Reading '+f.name+'…';
   try{const r=await inspectBundle(f,'auto');if(!r.bundle){toast(f.name+': '+r.reason+'. Plain mod zips go into the field below.');continue}
    r.mods.forEach(m=>{m.origin=f.name;BUNDLED.push(m)});(r.warnings||[]).forEach(w=>toast(f.name+': '+w))}catch(e){toast(f.name+': '+e.message)}}
  $('#bStat').textContent='';draw()};
 $('#bBund').onchange=async()=>{const fs=[...$('#bBund').files];$('#bBund').value='';await BULK_INGEST(fs)};
 $('#bGo').onclick=async()=>{const all=[...BUNDLED,...LOOSE];if(!all.length)return;if(all.some(x=>!x.name.trim()))return toast('Every mod needs a name');
  let links=[];try{if($('#bLinks').value.trim())links=JSON.parse($('#bLinks').value)}catch(x){return toast('Extra links: invalid JSON')}
  const au=AP.get(),gs=$('#bGroup');const body={category:$('#bCat').value,authors:au.authors,newAuthors:au.newAuthors,tags:TP.get(),links,recent:$('#bRecent').checked,groupId:gs?gs.value:'',groupName:gs&&gs.value===''?$('#bGroupNew').value:'',items:[]};
  const total=all.length;$('#bGo').disabled=true;
  const ok=await runJob((async()=>{const pre=$('#logPre');for(let i=0;i<total;i++){const x=all[i];let styles;
    if(x.styles)styles=x.styles.map(s=>({uploadId:s.uploadId,previewUploadId:s.previewUploadId,label:x.styles.length>1?s.label:'',color:s.color}));
    else{pre.textContent='Uploading to the local server '+(i+1)+'/'+total+': '+x.z.name;const e={uploadId:await upload(x.z)};if(x.pv)e.previewUploadId=await upload(x.pv);styles=[e]}
    body.items.push({name:x.name.trim(),fileBase:x.fileBase,styles})}
   pre.textContent='';return api('/api/mod/bulk-add',body)})(),'Bulk add ('+total+' mods)');
  if(ok){renderBulk()}else{$('#bGo').disabled=false}}}

let ADDB=null;
function renderAdd(){ADDB=null;const cats=S.categories;$('#add').innerHTML=`<div class="addhead"><h2>Add new mod</h2></div>
 <section class="sect"><h3>${ic('category')}Where</h3>
  <label>Category</label><select id="aCat" style="width:100%;max-width:none">${cats.map(c=>`<option>${esc(c.id)}</option>`).join('')}</select>
  <div id="aGroupBox"></div>
  <label>Mod name</label><input type="text" id="aName">
  <label>File name base (optional, letters/digits/-_. only; default is made from the name)</label><input type="text" id="aBase" placeholder="my-mod"></section>
 <section class="sect"><h3>${ic('folder_zip')}Files and previews</h3>
  <label>Bundle archive (optional): one zip with the preview image and the mod zip inside, both are picked automatically</label>
  <input type="file" accept=".zip" id="aBundle"><div id="aBInfo"></div>
  <div id="aManual"><label class="chk"><input type="checkbox" id="aStyled"><span>This mod has several styles / variants</span></label>
  <div id="aRows"></div><button class="tonal sm" id="aMore" hidden style="margin-top:10px">${ic('add')}Add style</button></div></section>
 <section class="sect"><h3>${ic('person')}Authors</h3><div id="aAuth"></div></section>
 <section class="sect"><h3>${ic('sell')}Tags</h3><div id="aTagBox"></div>
  <details class="adv"><summary>Extra links (JSON, optional)</summary><textarea id="aLinks" style="min-height:64px" placeholder='[{"type":"source","url":"..."}]'></textarea></details>
  <label class="chk"><input type="checkbox" id="aRecent" checked><span>Add to “recently added”</span></label></section>
 <div style="margin:12px 14px 0"><div class="note">${ic('info')}<span>The zip is uploaded to the releases repo immediately. mods.json and the preview change locally until you press Publish.${S.pillow?'':' Install pillow (pip install pillow) to convert png/jpg previews to webp.'}</span></div>
 <button class="filled" id="aGo">${ic('add')}Add mod</button></div>`;
 const rows=$('#aRows');
 const addRow=()=>{const d=styleRowEl(rows);d.querySelector('.rm').hidden=true;if(!$('#aStyled').checked)d.querySelector('.lab').parentNode.hidden=true;return d};
 addRow();
 const syncStyled=()=>{const on=$('#aStyled').checked;rows.querySelectorAll('.lab').forEach(e=>e.parentNode.hidden=!on);$('#aMore').hidden=!on;if(!on)while(rows.children.length>1)rows.lastChild.remove()};
 $('#aStyled').onchange=syncStyled;$('#aMore').onclick=()=>{addRow();syncStyled()};
 const grp=()=>{const c=cats.find(x=>x.id===$('#aCat').value);$('#aGroupBox').innerHTML=c&&c.grouped?`<label>Group</label><select id="aGroup" style="width:100%;max-width:none">${c.groups.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}<option value="">(new group…)</option></select><input type="text" id="aGroupNew" placeholder="New group name" hidden style="margin-top:8px">`:'';
  const sel=$('#aGroup');if(sel)sel.onchange=()=>{$('#aGroupNew').hidden=sel.value!==''}};
 grp();const AP=authorPicker($('#aAuth'),[]),TP=tagPicker($('#aTagBox'),$('#aCat').value,{});
 $('#aCat').onchange=()=>{grp();TP.setCategory($('#aCat').value)};
 const showBundle=()=>{const b=ADDB,box=$('#aBInfo');
  box.innerHTML=b.styles.map((s,i)=>`<div class="style-row"><div class="bitem" style="margin-top:12px">${s.previewUploadId?`<img class="bthumb" alt="" src="${esc(upv(s.previewUploadId))}">`:`<div class="bthumb"></div>`}<div class="grow" style="flex:1;min-width:0"><b>${esc(s.zipName)}</b><small class="muted">${s.previewName?esc(s.previewName):'no preview image found'}</small>${b.styles.length>1?`<div class="row" style="margin-top:6px"><input type="text" class="bl" data-i="${i}" value="${esc(s.label)}" placeholder="Style label"><input type="color" class="bc fit" data-i="${i}" value="${esc(s.color)}"></div>`:''}</div></div></div>`).join('')+`<div style="margin-top:8px"><button type="button" class="tonal sm" id="aBClear">${ic('close')}Not a bundle, choose files manually</button></div>`;
  box.querySelectorAll('.bl').forEach(i=>i.oninput=()=>{b.styles[+i.dataset.i].label=i.value});box.querySelectorAll('.bc').forEach(i=>i.oninput=()=>{b.styles[+i.dataset.i].color=i.value});
  $('#aBClear').onclick=()=>{ADDB=null;box.innerHTML='';$('#aBundle').value='';$('#aManual').hidden=false}};
 $('#aBundle').onchange=async()=>{const f=$('#aBundle').files[0],box=$('#aBInfo');ADDB=null;box.innerHTML='';$('#aManual').hidden=false;if(!f)return;
  box.innerHTML=`<div class="note">${ic('hourglass_top')}<span>Reading the archive…</span></div>`;let r;
  try{r=await inspectBundle(f,'single')}catch(e){box.innerHTML='';return toast(e.message)}
  if(!r.bundle){box.innerHTML=`<div class="note">${ic('info')}<span>${esc(r.reason)}. Use the fields below for a normal mod zip.</span></div>`;return}
  ADDB=r.mods[0];$('#aManual').hidden=true;if(!$('#aName').value.trim())$('#aName').value=ADDB.name;$('#aBase').placeholder=ADDB.fileBase;showBundle();
  if(r.autoCount>1)box.insertAdjacentHTML('afterbegin',`<div class="note">${ic('library_add')}<span>This archive looks like ${r.autoCount} separate mods, but here it is added as ONE mod with ${ADDB.styles.length} styles. <a href="#" id="aToBulk">Open it in Bulk upload instead</a></span></div>`);
  const tb=$('#aToBulk');if(tb)tb.onclick=e=>{e.preventDefault();renderBulk();showPanel('bulk');BULK_INGEST([f])};
  (r.warnings||[]).forEach(w=>toast(w))};
 $('#aGo').onclick=async()=>{const name=$('#aName').value.trim();if(!name)return toast('Enter the mod name');
  let links=[];try{if($('#aLinks').value.trim())links=JSON.parse($('#aLinks').value)}catch(x){return toast('Extra links: invalid JSON')}
  const zips=[];if(!ADDB){const styled=$('#aStyled').checked;for(const r of rows.children){const z=r.querySelector('.zip').files[0];if(!z)return toast('Choose a zip in every row');zips.push({z,p:r.querySelector('.pv').files[0],label:styled?r.querySelector('.lab').value.trim():'',color:r.querySelector('.col').value})}}
  const au=AP.get(),gs=$('#aGroup');const body={category:$('#aCat').value,name,fileBase:$('#aBase').value.trim()||(ADDB?ADDB.fileBase:''),authors:au.authors,newAuthors:au.newAuthors,tags:TP.get(),links,recent:$('#aRecent').checked,groupId:gs?gs.value:'',groupName:gs&&gs.value===''?$('#aGroupNew').value:''};
  $('#aGo').disabled=true;
  const ok=await runJob((async()=>{body.zips=[];if(ADDB){ADDB.styles.forEach(s=>body.zips.push({uploadId:s.uploadId,previewUploadId:s.previewUploadId,label:ADDB.styles.length>1?s.label:'',color:s.color}))}
   else{$('#logPre').textContent='Uploading files to the local server…';for(const x of zips){const e={uploadId:await upload(x.z),label:x.label,color:x.color};if(x.p)e.previewUploadId=await upload(x.p);body.zips.push(e)}}
   return api('/api/mod/add',body)})(),'Add mod "'+name+'"');
  $('#aGo').disabled=false;if(ok)renderAdd()}}

$('#bSync').onclick=()=>runJob(api('/api/sync',{}),'Sync (git pull)');
$('#bValidate').onclick=()=>runJob(api('/api/validate',{}),'Validate');
$('#bUndo').onclick=async()=>{if(!confirm('Restore the previous version of mods.json? (previews and release files are not reverted)'))return;try{await api('/api/undo',{});await refresh();SEL&&openMod(SEL.c,SEL.n)}catch(e){toast(e.message)}};
$('#bPublish').onclick=()=>{const d=$('#dlg');d.innerHTML=`<h2>Publish</h2><div class="note"><span><b>Local changes</b><br>${S.changes.map(esc).join('<br>')||'none'}</span></div>
 ${S.pendingRemove.length?`<div class="note"><span><b>Will be removed from releases after the push</b><br>${S.pendingRemove.map(k=>esc(k)+' <a href="#" data-k="'+esc(k)+'" class="uq">cancel</a>').join('<br>')}</span></div>`:''}
 <label>Commit message</label><input type="text" id="pMsg" value="chore: update mods via admin">
 <label class="chk"><input type="checkbox" id="pPipe"><span>Also run the Pipeline manually (not needed when mods.json changed, the push starts it)</span></label>
 <div class="row" style="margin-top:20px;justify-content:flex-end"><button class="fit" onclick="dlg.close()">Cancel</button><button class="filled fit" id="pGo">${ic('cloud_upload')}Publish</button></div>`;d.showModal();
 d.querySelectorAll('.uq').forEach(a=>a.onclick=async e=>{e.preventDefault();await api('/api/unqueue',{key:a.dataset.k});d.close();await refresh()});
 $('#pGo').onclick=()=>{const m=$('#pMsg').value,rp=$('#pPipe').checked;d.close();runJob(api('/api/publish',{message:m,runPipeline:rp}),'Publish')}};
const dlg=$('#dlg');refresh().then(()=>{if(!S.mods.length){renderAdd();showPanel('add')}});
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