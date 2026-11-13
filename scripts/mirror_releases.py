import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

FILES_PREFIX = "assets/files"
HASHES = Path("assets/data/mod-hashes.json")
MIGRATE = Path(__file__).with_name("migrate_to_releases.py")


def env_int(name, default):
    try:
        return int(os.environ.get(name) or default)
    except ValueError:
        return default


def load_manifest(path: Path):
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {f"{f['category']}/{f['name']}": f for f in data.get("files", [])}


def blob_size(path):
    r = subprocess.run(["git", "cat-file", "-s", f"HEAD:{FILES_PREFIX}/{path}"],
                       capture_output=True, text=True)
    return int(r.stdout.strip()) if r.returncode == 0 else None


def summary(lines):
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with open(target, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--releases-dir", required=True, help="clone of the releases repository (contains manifest.json)")
    ap.add_argument("--repo", default=os.environ.get("RELEASES_REPO") or "h6rd/Dota2PornFx")
    ap.add_argument("--max-files", type=int, default=env_int("RELEASES_MAX_FILES", 300),
                    help="stop if more new/changed files than this at once")
    ap.add_argument("--max-bytes", type=int, default=env_int("RELEASES_MAX_MB", 4096) * 1024 ** 2)
    ap.add_argument("--max-delete", type=int, default=env_int("RELEASES_MAX_DELETE", 25),
                    help="stop if more removals than this at once (protects against broken hashes)")
    ap.add_argument("--max-per-release", type=int, default=env_int("RELEASES_MAX_PER_RELEASE", 500))
    ap.add_argument("--prune", action="store_true",
                    default=os.environ.get("RELEASES_PRUNE", "").strip().lower() == "true",
                    help="remove from releases what is no longer in git (OFF by default; or RELEASES_PRUNE=true)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    manifest_path = Path(a.releases_dir) / "manifest.json"
    if not HASHES.exists():
        sys.exit(f"::error::{HASHES} not found - run this from the root of the website repository")
    hashes = {k: v for k, v in json.loads(HASHES.read_text(encoding="utf-8")).items()
              if not os.path.basename(k).startswith(".")}
    if not hashes:
        sys.exit("::error::mod-hashes.json is empty - mirroring cancelled (nothing was touched)")

    manifest = load_manifest(manifest_path)
    to_add = sorted(k for k, sha in hashes.items() if manifest.get(k, {}).get("sha256") != sha)
    extra = sorted(k for k in manifest if k not in hashes)
    to_remove = extra if a.prune else []

    print(f"In git: {len(hashes)} files, in the releases manifest: {len(manifest)}")
    print(f"To upload (new/changed): {len(to_add)}, to remove: {len(to_remove)}")
    if extra and not a.prune:
        print(f"Removal is off: {len(extra)} file(s) are in releases but not in git - keeping them")
    for k in to_add[:10]:
        print(f"  + {k}")
    for k in to_remove[:10]:
        print(f"  - {k}")

    if not to_add and not to_remove:
        print("Releases already match git, nothing to do.")
        summary(["### Mirror to releases", "Already in sync."])
        return

    if len(to_add) > a.max_files:
        sys.exit(f"::error::{len(to_add)} files to upload (limit {a.max_files}). This looks like the first "
                 f"migration: run it locally with migrate_to_releases.py and commit manifest.json, "
                 f"or raise RELEASES_MAX_FILES.")
    if len(to_remove) > a.max_delete:
        sys.exit(f"::error::{len(to_remove)} files to remove from releases (limit {a.max_delete}). "
                 f"This looks like a mistake (empty/incomplete mod-hashes.json). Check it and raise "
                 f"RELEASES_MAX_DELETE if this is intentional.")

    sizes = {k: blob_size(k) for k in to_add}
    missing = [k for k, s in sizes.items() if s is None]
    if missing:
        sys.exit(f"::error::mod-hashes.json lists files that are not in git (stale hashes?): {missing[:5]}")
    total = sum(sizes.values())
    print(f"Total size to upload: {total / 1024 ** 2:.1f} MiB")
    if total > a.max_bytes:
        sys.exit(f"::error::{total / 1024 ** 3:.1f} GiB to upload (limit {a.max_bytes / 1024 ** 3:.1f} GiB). "
                 f"Do the migration locally or raise RELEASES_MAX_MB.")

    summary(["### Mirror to releases", f"Upload: **{len(to_add)}**, remove: **{len(to_remove)}**, "
             f"{total / 1024 ** 2:.1f} MiB"])
    if a.dry_run:
        print("\nDRY-RUN: nothing was changed.")
        return

    base_cmd = [sys.executable, str(MIGRATE), "--manifest", str(manifest_path), "--repo", a.repo,
                "--sleep", "0.5", "--max-per-release", str(a.max_per_release)]
    rc = 0

    if to_add:
        stage = Path(tempfile.mkdtemp(prefix="mirror-"))
        try:
            for key in to_add:
                dst = stage / key
                dst.parent.mkdir(parents=True, exist_ok=True)
                with dst.open("wb") as fh:
                    subprocess.run(["git", "cat-file", "blob", f"HEAD:{FILES_PREFIX}/{key}"],
                                   stdout=fh, check=True)
            rc = subprocess.run(base_cmd + ["--source", str(stage), "--rehash", "--dates-from-git"]).returncode
        finally:
            shutil.rmtree(stage, ignore_errors=True)
        if rc != 0:
            print("::error::upload to releases failed, removals skipped")
            sys.exit(rc)

    if to_remove:
        cmd = base_cmd[:]
        for k in to_remove:
            cmd += ["--remove", k]
        rc = subprocess.run(cmd).returncode
        if rc != 0:
            sys.exit(rc)

    print("Mirroring finished. Commit manifest.json to the releases repository.")


if __name__ == "__main__":
    main()
