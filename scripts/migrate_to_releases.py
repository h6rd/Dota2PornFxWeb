"""
First migration:
    python3 migrate_to_releases.py --manifest ../Dota2PornFx/manifest.json --dry-run
    python3 migrate_to_releases.py --manifest ../Dota2PornFx/manifest.json

Add / update mods (put them into a folder with the same layout <category>/<file>):
    python3 migrate_to_releases.py --source /tmp/new --manifest ../Dota2PornFx/manifest.json

Restore releases from a backup (same tags and URLs, taken from manifest.json):
    python3 migrate_to_releases.py --source /path/to/backup/assets/files --manifest ...

Restore, but refuse to upload files that differ from the manifest:
    --source /path/to/backup --restore

Remove a mod (for example, at the author's request):
    python3 migrate_to_releases.py --manifest ... --remove "heroes/Some Mod.zip"

Check that the releases match the manifest (changes nothing, no local files needed):
    python3 migrate_to_releases.py --manifest ... --check
"""
import argparse
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

GH_FILE_LIMIT = 2 * 1024 ** 3
GH_ASSETS_LIMIT = 1000

HOMOGLYPHS = {
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O",
    "Р": "P", "С": "C", "Т": "T", "Х": "X", "а": "a", "е": "e", "о": "o",
    "р": "p", "с": "c", "у": "y", "х": "x",
}

# Names

def safe_name(name: str) -> str:
    """Safe asset name. Already safe names (pak10_dir.vpk) are left unchanged."""
    stem, ext = os.path.splitext(name)

    def clean(s: str) -> str:
        s = "".join(HOMOGLYPHS.get(c, c) for c in s)
        s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
        s = re.sub(r"[^A-Za-z0-9._-]+", ".", s)
        s = re.sub(r"\.{2,}", ".", s)
        return s.strip(".-")

    stem, ext = clean(stem), clean(ext.lstrip("."))
    stem = (stem or "file")[:180]
    return f"{stem}.{ext}" if ext else stem


def slugify(cat: str) -> str:
    return re.sub(r"[^a-z0-9._-]+", "-", cat.lower()).strip("-.")


def part_no(tag: str, slug: str) -> int:
    if tag == slug:
        return 1
    try:
        return int(tag[len(slug) + 1:])
    except ValueError:
        return 1


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return str(n)


def sha256(path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()



# Manifest (state)

def load_manifest(path: Path):
    """-> {(category, name): item}. A missing file means an empty state."""
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {(f["category"], f["name"]): f for f in data.get("files", [])}


def write_manifest(items: dict, repo: str, path: Path):
    files = []
    for (cat, name), it in sorted(items.items(), key=lambda kv: (kv[0][0].lower(), kv[0][1].lower())):
        item = {k: v for k, v in it.items() if v is not None}
        item["url"] = f"https://github.com/{repo}/releases/download/{it['tag']}/{it['asset']}"
        files.append(item)
    per_tag = Counter(f["tag"] for f in files)
    tag_cat = {f["tag"]: f["category"] for f in files}
    data = {
        "repo": repo,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "releases": [{"tag": t, "category": tag_cat[t], "count": n}
                     for t, n in sorted(per_tag.items())],
        "files": files,
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nManifest: {path} ({len(files)} files, {len(per_tag)} releases)")



# Building the plan

class Plan:
    def __init__(self):
        self.releases = []          # dict: tag, title, category, files
        self.warnings = []
        self.errors = []


def scan_category(cat: Path, src: Path, plan: Plan):
    entries = []
    for root, dirs, files in os.walk(cat):
        dirs[:] = sorted(d for d in dirs if not d.startswith("."))
        rootp = Path(root)
        visible = [f for f in files if not f.startswith(".")]
        if root != str(cat) and not visible and not dirs:
            plan.warnings.append(f"empty folder skipped: {rootp.relative_to(src).as_posix()}")
        for f in sorted(files):
            full = rootp / f
            rel = full.relative_to(cat)
            shown = f"{cat.name}/{rel.as_posix()}"
            if f.startswith("."):
                plan.warnings.append(f"hidden file skipped: {shown}")
                continue
            if not full.is_file():
                plan.warnings.append(f"not a regular file, skipped: {shown}")
                continue
            size = full.stat().st_size
            if size == 0:
                plan.warnings.append(f"empty file (GitHub rejects 0-byte assets), skipped: {shown}")
                continue
            if size >= GH_FILE_LIMIT:
                plan.errors.append(f"file >= 2 GiB, GitHub will not accept it: {shown} ({human(size)})")
                continue
            if len(rel.parts) > 1:
                plan.warnings.append(f"nested file, path joined with '__': {shown}")
            entries.append({"category": cat.name, "name": rel.as_posix(), "path": full,
                            "size": size, "base": "__".join(rel.parts)})
    return entries


def collect(src: Path, only, max_per_release: int, existing: dict) -> Plan:
    plan = Plan()
    if not src.is_dir():
        plan.errors.append(f"Folder {src} not found")
        return plan

    for stray in sorted(p for p in src.iterdir() if p.is_file()):
        plan.warnings.append(f"file outside a category, skipped: {stray.name}")

    tag_owner = {it["tag"]: it["category"] for it in existing.values()}
    cats = sorted((p for p in src.iterdir() if p.is_dir() and not p.name.startswith(".")),
                  key=lambda p: p.name.lower())
    by_tag = defaultdict(list)
    tag_title = {}

    for cat in cats:
        if only and cat.name not in only:
            continue
        entries = scan_category(cat, src, plan)
        if not entries:
            plan.warnings.append(f"category has no files, skipped: {cat.name}")
            continue

        slug = slugify(cat.name)
        prev = {k[1]: v for k, v in existing.items() if k[0] == cat.name}
        used = {v["asset"].lower() for v in prev.values()}
        counts = Counter(v["tag"] for v in prev.values())
        entries.sort(key=lambda e: e["base"].lower())

        new = []
        for e in entries:
            p = prev.get(e["name"])
            if p:                                   # already in the manifest: name and tag are fixed
                e.update(asset=p["asset"], tag=p["tag"], prev_sha=p.get("sha256"),
                         status="changed" if p["size"] != e["size"] else "same", renamed=False)
            else:
                name = safe_name(e["base"])
                stem, ext = os.path.splitext(name)
                n = 2
                while name.lower() in used:
                    name = f"{stem}-{n}{ext}"
                    n += 1
                if n > 2:
                    plan.warnings.append(f"name collision in {cat.name}: '{e['name']}' -> '{name}'")
                used.add(name.lower())
                e.update(asset=name, status="new", renamed=name != e["name"])
                new.append(e)

        # tags for new files
        if new and not counts:                      # first migration: equal-sized parts
            parts = max(1, math.ceil(len(new) / max_per_release))
            chunk = math.ceil(len(new) / parts)
            for i, e in enumerate(new):
                k = i // chunk
                e["tag"] = slug if parts == 1 else f"{slug}-{k + 1}"
        elif new:                                   # adding later: first release with free room
            tags = sorted(counts, key=lambda t: part_no(t, slug))
            for e in new:
                for t in tags:
                    if counts[t] < max_per_release:
                        break
                else:
                    t = f"{slug}-{max(part_no(x, slug) for x in tags) + 1}"
                    tags.append(t)
                    counts[t] = 0
                counts[t] += 1
                e["tag"] = t

        cat_tags = {e["tag"] for e in entries} | set(counts)
        for e in entries:
            owner = tag_owner.setdefault(e["tag"], cat.name)
            if owner != cat.name:
                plan.errors.append(f"tag '{e['tag']}' is already used by category '{owner}', but '{cat.name}' needs it")
            by_tag[e["tag"]].append(e)
            tag_title[e["tag"]] = (cat.name, cat_tags == {slug}, part_no(e["tag"], slug))

    for tag in sorted(by_tag):
        cat_name, single, no = tag_title[tag]
        plan.releases.append({"tag": tag, "category": cat_name,
                              "title": cat_name if single else f"{cat_name} (part {no})",
                              "files": by_tag[tag]})
    return plan


def print_plan(plan: Plan, repo: str, report: Path):
    allf = [e for r in plan.releases for e in r["files"]]
    c = Counter(e["status"] for e in allf)
    renamed = [e for e in allf if e["renamed"]]

    print(f"\nTarget repository: {repo}")
    print(f"{'tag':<22}{'new':>8}{'changed':>10}{'same':>10}{'size':>12}")
    print("-" * 62)
    for r in plan.releases:
        cc = Counter(e["status"] for e in r["files"])
        print(f"{r['tag']:<22}{cc['new']:>8}{cc['changed']:>10}{cc['same']:>10}"
              f"{human(sum(e['size'] for e in r['files'])):>12}")
    print("-" * 62)
    print(f"{'TOTAL':<22}{c['new']:>8}{c['changed']:>10}{c['same']:>10}"
          f"{human(sum(e['size'] for e in allf)):>12}")
    print(f"Releases in the plan: {len(plan.releases)}; new files with a changed name: {len(renamed)}")

    report.write_text("tag\toriginal\tasset\n" +
                      "".join(f"{e['tag']}\t{e['name']}\t{e['asset']}\n" for e in renamed),
                      encoding="utf-8")
    print(f"Rename report: {report}")
    for e in renamed[:5]:
        print(f"  {e['category']}/{e['name']}  ->  {e['asset']}")
    if plan.warnings:
        print(f"\nWarnings ({len(plan.warnings)}):")
        for w in plan.warnings:
            print(f"  ! {w}")
    if plan.errors:
        print(f"\nERRORS ({len(plan.errors)}):")
        for er in plan.errors:
            print(f"  X {er}")



# gh

def gh(*args, check=True, retries=1):
    last = None
    for attempt in range(retries):
        last = subprocess.run(["gh", *args], text=True, capture_output=True)
        if last.returncode == 0:
            return last
        if attempt < retries - 1:
            time.sleep(2 ** attempt * 2)
    if check:
        msg = (last.stderr or last.stdout or "").strip()
        raise RuntimeError(f"gh {' '.join(args[:3])}... failed: {msg}")
    return last


def preflight(repo: str):
    """Check that gh works and can reach the repository.

    `gh auth status` is deliberately NOT used: without flags it exits non-zero when ANY saved
    account or host has a problem, and it makes network calls that fail during GitHub incidents.
    A real API call to the target repository checks authentication, access and connectivity
    at once, is retried on transient errors and shows gh's actual error message.
    """
    if shutil.which("gh") is None:
        sys.exit("GitHub CLI (gh) not found: https://cli.github.com/")

    r = gh("api", f"repos/{repo}", check=False, retries=3)
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "").strip()
        low = err.lower()
        if "gh auth login" in low or "http 401" in low or "bad credentials" in low:
            sys.exit(f"gh is not authenticated or the token is invalid - run `gh auth login`.\n{err}")
        if "http 404" in low:
            sys.exit(f"Repository {repo} not found, or the token has no access to it. "
                     f"Create it first / check the token's repository access.\n{err}")
        sys.exit(f"Could not reach GitHub for {repo} (network problem or a GitHub incident?). "
                 f"Try again in a few minutes.\n{err}")

    r = gh("api", f"repos/{repo}/commits?per_page=1", check=False, retries=3)
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "").strip()
        if "409" in err or "empty" in err.lower():
            sys.exit(f"{repo} has no commits - create a README first, "
                     f"otherwise a release has nothing to attach its tag to.")
        sys.exit(f"Could not read commits of {repo}:\n{err}")


def release_id(repo, tag):
    """Release id, or None if the release does not exist (404).
    Transient errors (timeouts, 5xx) are retried and then raised - they must not be mistaken
    for "the release does not exist", otherwise we would try to create an existing release."""
    err = ""
    for attempt in range(3):
        r = gh("api", f"repos/{repo}/releases/tags/{tag}", "--jq", ".id", check=False)
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()
        err = (r.stderr or r.stdout or "").strip()
        if "404" in err or "not found" in err.lower():
            return None
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"could not look up release {tag}: {err}")


def ensure_release(repo, rel, base_url, site_url):
    rid = release_id(repo, rel["tag"])
    if rid:
        return rid
    notes = (f"Category: **{rel['category']}** (`{rel['tag']}`)\n\n"
             f"The list of files with original names, sizes and sha256 is `manifest.json` "
             f"in the repository root.\n\n"
             f"Mods from [Dota2PornFx]({site_url}). "
             f"Terms: [LICENSE-CONTENT.md]({base_url}/blob/main/LICENSE-CONTENT.md). "
             f"Original mod authors are listed in the repository README.")
    gh("release", "create", rel["tag"], "-R", repo, "--title", rel["title"],
       "--notes", notes, "--latest=false", retries=3)
    rid = release_id(repo, rel["tag"])
    if not rid:
        raise RuntimeError(f"could not create release {rel['tag']}")
    return rid


def remote_assets(repo, rid):
    """-> {name: (size, sha256 or None)}"""
    r = gh("api", "--paginate", f"repos/{repo}/releases/{rid}/assets?per_page=100",
           "--jq", r'.[] | "\(.name)\t\(.size)\t\(.digest // "")"', retries=3)
    out = {}
    for line in r.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            digest = parts[2].split(":", 1)[1].lower() if len(parts) > 2 and parts[2].startswith("sha256:") else None
            out[parts[0]] = (int(parts[1]), digest)
    return out


def stage(files, stage_dir: Path):
    """Files under their safe names: hardlink -> symlink -> copy."""
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    stage_dir.mkdir(parents=True)
    staged = []
    for e in files:
        dst = stage_dir / e["asset"]
        try:
            os.link(e["path"], dst)
        except OSError:
            try:
                os.symlink(Path(e["path"]).resolve(), dst)
            except OSError:
                shutil.copy2(e["path"], dst)
        staged.append(dst)
    return staged



# Commands

def run_upload(plan: Plan, a):
    preflight(a.repo)
    base = f"https://github.com/{a.repo}"
    failed = []
    stage_root = Path(a.staging)

    for rel in plan.releases:
        tag = rel["tag"]
        print(f"\n== {tag}: {len(rel['files'])} files in the plan")
        try:
            # sha256: for unchanged files reuse the manifest value (--rehash recomputes everything)
            for e in rel["files"]:
                if a.no_sha256:
                    e["sha256"] = None
                elif e["status"] == "same" and e.get("prev_sha") and not a.rehash:
                    e["sha256"] = e["prev_sha"]
                else:
                    e["sha256"] = sha256(e["path"])
                    if e["status"] == "same" and e.get("prev_sha") and e["sha256"] != e["prev_sha"]:
                        e["status"] = "changed"
                if a.restore and e["status"] == "changed":
                    raise RuntimeError(f"--restore: file '{e['name']}' in the backup differs from the manifest "
                                       f"(size/sha256) - is the backup older? Nothing was uploaded to {tag}.")

            rid = ensure_release(a.repo, rel, base, a.site)
            have = remote_assets(a.repo, rid)

            def ok(e):
                h = have.get(e["asset"])
                if not h or h[0] != e["size"]:
                    return False
                return not (h[1] and e["sha256"] and h[1] != e["sha256"])

            todo = [e for e in rel["files"] if not ok(e)]
            print(f"   already in place: {len(rel['files']) - len(todo)}, to upload: {len(todo)}")

            staged = stage(todo, stage_root / tag)
            for i in range(0, len(staged), a.batch):
                batch = staged[i:i + a.batch]
                gh("release", "upload", tag, "--clobber", *map(str, batch), "-R", a.repo, retries=3)
                print(f"   uploaded {min(i + a.batch, len(staged))}/{len(staged)}")
                time.sleep(a.sleep)
            shutil.rmtree(stage_root / tag, ignore_errors=True)

            have = remote_assets(a.repo, rid)
            bad = [e["asset"] for e in rel["files"] if not ok(e)]
            if bad:
                raise RuntimeError(f"size/sha256 mismatch after upload for {len(bad)} files, "
                                   f"e.g.: {bad[:3]}")
            print("   OK")
        except Exception as ex:                             # noqa: BLE001
            print(f"   ERROR: {ex}")
            failed.append(tag)
    shutil.rmtree(stage_root, ignore_errors=True)
    return failed


def merge_manifest(existing: dict, plan: Plan, failed=()):
    items = dict(existing)
    for rel in plan.releases:
        if rel["tag"] in failed:
            continue
        for e in rel["files"]:
            items[(e["category"], e["name"])] = {
                "category": e["category"], "name": e["name"], "asset": e["asset"],
                "tag": e["tag"], "size": e["size"], "sha256": e.get("sha256") or
                (e.get("prev_sha") if e["status"] == "same" else None),
            }
    return items


def do_remove(a, existing: dict):
    targets = []
    for spec in a.remove:
        cat, _, name = spec.partition("/")
        if (cat, name) not in existing:
            sys.exit(f"'{spec}' is not in the manifest (format: category/original name)")
        targets.append((cat, name))
    for cat, name in targets:
        it = existing[(cat, name)]
        print(f"{'[dry-run] ' if a.dry_run else ''}remove {cat}/{name}  "
              f"(release {it['tag']}, asset {it['asset']})")
    if a.dry_run:
        print("\nDRY-RUN: nothing was removed.")
        return
    preflight(a.repo)
    for cat, name in targets:
        it = existing[(cat, name)]
        gh("release", "delete-asset", it["tag"], it["asset"], "-R", a.repo, "-y", retries=3)
        del existing[(cat, name)]
    write_manifest(existing, a.repo, Path(a.manifest))
    print("Removed. Commit manifest.json and remove the mod from the website's assets/data/mods.json.")


def do_check(a, existing: dict):
    preflight(a.repo)
    by_tag = defaultdict(list)
    for it in existing.values():
        by_tag[it["tag"]].append(it)
    problems = 0
    for tag, items in sorted(by_tag.items()):
        rid = release_id(a.repo, tag)
        have = remote_assets(a.repo, rid) if rid else {}
        miss = [i["asset"] for i in items if i["asset"] not in have]
        diff = [i["asset"] for i in items if i["asset"] in have and (
            have[i["asset"]][0] != i["size"] or
            (have[i["asset"]][1] and i.get("sha256") and have[i["asset"]][1] != i["sha256"]))]
        extra = sorted(set(have) - {i["asset"] for i in items})
        status = "OK" if not (miss or diff or extra or not rid) else "PROBLEMS"
        print(f"{tag:<22}{len(items):>6} files  {status}" + ("" if rid else "  (release is missing!)"))
        for label, lst in (("missing from release", miss), ("mismatch", diff), ("extra in release", extra)):
            if lst:
                problems += len(lst)
                print(f"    {label}: {len(lst)}, e.g. {lst[:3]}")
    print("\nEverything matches the manifest." if not problems else f"\nProblems found: {problems}. "
          f"To restore, run the script with --source <backup>.")
    sys.exit(1 if problems else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", default="assets/files", help="folder with category subfolders")
    ap.add_argument("--repo", default="h6rd/Dota2PornFx", help="target repository owner/name")
    ap.add_argument("--site", default="https://h6rd.github.io/Dota2PornFxWeb")
    ap.add_argument("--manifest", default="manifest.json", help="state file (read and written)")
    ap.add_argument("--dry-run", action="store_true", help="show the plan only, gh is not called")
    ap.add_argument("--only", help="comma-separated categories, e.g. heroes,music")
    ap.add_argument("--remove", action="append", metavar="CATEGORY/NAME",
                    help="remove a mod from its release and the manifest (can be repeated)")
    ap.add_argument("--check", action="store_true", help="compare releases with the manifest, change nothing")
    ap.add_argument("--max-per-release", type=int, default=500,
                    help="max files per release (GitHub limit is 1000); beyond that a new part is created")
    ap.add_argument("--rehash", action="store_true",
                    help="recompute sha256 even for files whose size is unchanged")
    ap.add_argument("--restore", action="store_true",
                    help="restore mode: verifies sha256 and refuses to upload files "
                         "that differ from the manifest")
    ap.add_argument("--no-sha256", action="store_true", help="do not compute sha256 (not recommended)")
    ap.add_argument("--batch", type=int, default=20, help="files per gh upload call")
    ap.add_argument("--sleep", type=float, default=1.0, help="pause between batches, seconds")
    ap.add_argument("--rename-report", default="rename-report.tsv")
    ap.add_argument("--staging", default=".migrate-staging")
    a = ap.parse_args()

    if not 1 <= a.max_per_release <= GH_ASSETS_LIMIT:
        sys.exit(f"--max-per-release must be between 1 and {GH_ASSETS_LIMIT}")

    if a.restore:
        a.rehash = True
    mpath = Path(a.manifest)
    existing = load_manifest(mpath)
    print(f"Manifest: {mpath} ({len(existing)} files in state)" if existing
          else f"Manifest {mpath} not found - starting from a clean state")

    if a.check:
        if not existing:
            sys.exit("The manifest is empty - nothing to check.")
        try:
            do_check(a, existing)
        except RuntimeError as ex:
            sys.exit(f"ERROR: {ex}")
    if a.remove:
        try:
            do_remove(a, existing)
        except RuntimeError as ex:
            sys.exit(f"ERROR: {ex}")
        return

    only = {c.strip() for c in a.only.split(",")} if a.only else None
    plan = collect(Path(a.source), only, a.max_per_release, existing)
    print_plan(plan, a.repo, Path(a.rename_report))

    if plan.errors:
        sys.exit("\nFix the errors above - nothing was uploaded.")
    if not plan.releases:
        sys.exit("Nothing to upload.")

    if a.dry_run:
        write_manifest(merge_manifest(existing, plan), a.repo, Path("manifest.dry-run.json"))
        print("\nDRY-RUN: nothing uploaded, gh was not called, your manifest.json is untouched.")
        return

    failed = run_upload(plan, a)
    write_manifest(merge_manifest(existing, plan, failed), a.repo, mpath)
    if failed:
        print(f"\nUnfinished releases: {', '.join(failed)}. Run the script again - "
              f"it will upload only what is missing.")
        sys.exit(1)
    print("\nDone. Commit manifest.json to the releases repository.")


if __name__ == "__main__":
    main()
