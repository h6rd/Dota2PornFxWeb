"""Add or update mods by hand after the move to GitHub releases.

python3 scripts/add_mod.py --category heroes --zip "Mod.zip" --preview "Mod.webp"

What it does:
  1. uploads every --zip to the releases repo (as a release asset) and updates its manifest.json,
     then commits and pushes manifest.json there;
  2. copies every --preview into assets/previews/<category>/ of this repo;
  3. prints the "file" / "preview" values for your mods.json entry.

To replace the file of an existing mod, run it again with the SAME zip file name and --update.
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
MIGRATE = HERE / "migrate_to_releases.py"


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def manifest_keys(path: Path):
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return {f"{f['category']}/{f['name']}".lower() for f in data.get("files", [])}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--category", required=True, help="category folder name, e.g. heroes")
    ap.add_argument("--zip", action="append", required=True, metavar="FILE", help="mod zip (repeat for several)")
    ap.add_argument("--preview", action="append", default=[], metavar="FILE", help="preview image (repeat for several)")
    ap.add_argument("--releases-dir", default="../Dota2PornFx", help="local clone of the releases repo")
    ap.add_argument("--repo", default="h6rd/Dota2PornFx", help="releases repo owner/name")
    ap.add_argument("--update", action="store_true", help="allow replacing files that already exist in the manifest")
    ap.add_argument("--no-pull", action="store_true", help="do not git pull the releases repo first")
    ap.add_argument("--no-push", action="store_true", help="commit manifest.json but do not push")
    ap.add_argument("--dry-run", action="store_true", help="show the plan, change nothing")
    a = ap.parse_args()

    site = Path.cwd()
    if not (site / "assets" / "data" / "mods.json").exists():
        sys.exit("Run this from the root of the website repo (assets/data/mods.json not found here).")
    rel = Path(a.releases_dir).resolve()
    manifest = rel / "manifest.json"
    if not (rel / ".git").exists() or not manifest.exists():
        sys.exit(f"{rel} is not a clone of the releases repo with manifest.json (--releases-dir).")
    if not MIGRATE.exists():
        sys.exit(f"{MIGRATE} not found.")

    zips = [Path(z) for z in a.zip]
    previews = [Path(p) for p in a.preview]
    for p in zips + previews:
        if not p.is_file():
            sys.exit(f"File not found: {p}")
    for z in zips:
        if z.suffix.lower() != ".zip":
            sys.exit(f"Not a .zip file: {z}")
    if len({z.name.lower() for z in zips}) != len(zips):
        sys.exit("Two zips with the same file name.")

    if not a.no_pull and not a.dry_run:
        run(["git", "-C", str(rel), "pull", "--ff-only"])

    existing = manifest_keys(manifest)
    clashes = [z.name for z in zips if f"{a.category}/{z.name}".lower() in existing]
    if clashes and not a.update:
        sys.exit("Already in the manifest (use --update to REPLACE the file): " + ", ".join(clashes))
    for z in zips:
        kind = "UPDATE (replaces)" if z.name in clashes else "NEW"
        print(f"{kind}: {a.category}/{z.name}")

    with tempfile.TemporaryDirectory(prefix="add-mod-") as tmp:
        tmp = Path(tmp)
        stage = tmp / "stage" / a.category
        stage.mkdir(parents=True)
        for z in zips:
            shutil.copy2(z, stage / z.name)

        cmd = [
            sys.executable, str(MIGRATE),
            "--source", str(tmp / "stage"),
            "--manifest", str(manifest),
            "--repo", a.repo,
            "--rehash",
            "--sleep", "0.5",
            "--staging", str(tmp / "staging"),
            "--rename-report", str(tmp / "rename-report.tsv"),
        ]
        if a.dry_run:
            cmd.append("--dry-run")
        run(cmd, cwd=str(tmp))  # the migrate script drops helper files into its cwd - keep them out of the repo

    if a.dry_run:
        print("\nDRY-RUN: nothing was uploaded, copied or committed.")
    else:
        run(["git", "-C", str(rel), "add", "manifest.json"])
        staged = subprocess.run(["git", "-C", str(rel), "diff", "--cached", "--quiet"]).returncode != 0
        if staged:
            names = ", ".join(f"{a.category}/{z.name}" for z in zips)
            run(["git", "-C", str(rel), "commit", "-m", f"chore: add mods by hand ({names})"])
            if a.no_push:
                print("manifest.json committed in the releases repo but NOT pushed (--no-push).")
            else:
                run(["git", "-C", str(rel), "push"])
        else:
            print("manifest.json did not change.")

        for p in previews:
            dst = site / "assets" / "previews" / a.category / p.name
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)
            print(f"preview copied: {dst.relative_to(site).as_posix()}")

    print("\nNow edit assets/data/mods.json by hand. Values for the entry:")
    for z in zips:
        print(f'  "file": "{z.name}"')
    for p in previews:
        print(f'  "preview": "{p.name}"')
    print("Then commit and push this repo (mods.json + previews). The pipeline fills in meta (date) by itself.")


if __name__ == "__main__":
    main()
