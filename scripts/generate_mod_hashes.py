import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

try:
    import files_manifest
except ImportError:
    files_manifest = None

# MODS_STORAGE=git (default): hashes are computed from assets/files in git (the old behaviour).
# MODS_STORAGE=releases: hashes are taken from the sha256 values of the releases manifest.
MODS_STORAGE = (os.environ.get("MODS_STORAGE") or "git").strip().lower()

FILES_DIR = Path("assets/files")
OUTPUT_FILE = Path("assets/data/mod-hashes.json")


def load_existing_hashes():
    if not OUTPUT_FILE.exists():
        return {}
    try:
        with OUTPUT_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_hashes(hashes):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(hashes, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def hash_batch(head_sha, rel_paths, chunk_size=1024 * 1024):
    """Hash a list of paths at head_sha via a single `git cat-file --batch`
    process, streaming one object at a time instead of buffering the whole
    batch (which can be several GB once assets/files grows large enough).
    """
    hashes = {}
    failed = []

    if not rel_paths:
        return hashes

    proc = subprocess.Popen(
        ["git", "cat-file", "--batch"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        for idx, rel_path in enumerate(rel_paths):
            request = f"{head_sha}:{FILES_DIR.as_posix()}/{rel_path}\n"
            proc.stdin.write(request.encode())
            proc.stdin.flush()

            header_line = proc.stdout.readline()
            if not header_line:
                failed = rel_paths[idx:]
                print(
                    f"::error::git cat-file --batch produced no output for "
                    f"{rel_path!r} (process exited early)",
                    file=sys.stderr,
                )
                break

            header = header_line.decode("utf-8", errors="replace").rstrip("\n")

            if header.endswith(" missing"):
                failed = rel_paths[idx:]
                print(
                    f"::error::git cat-file --batch parsing failed at "
                    f"{rel_path!r}: blob missing ({header!r})",
                    file=sys.stderr,
                )
                break

            try:
                oid, obj_type, size_str = header.split()
                size = int(size_str)
            except ValueError as exc:
                failed = rel_paths[idx:]
                print(
                    f"::error::git cat-file --batch parsing failed at "
                    f"{rel_path!r}: bad header {header!r}: {exc}",
                    file=sys.stderr,
                )
                break

            hasher = hashlib.sha256()
            remaining = size
            read_ok = True
            while remaining > 0:
                chunk = proc.stdout.read(min(chunk_size, remaining))
                if not chunk:
                    read_ok = False
                    break
                hasher.update(chunk)
                remaining -= len(chunk)

            # consume the single trailing newline after the object content
            proc.stdout.read(1)

            if not read_ok:
                failed = rel_paths[idx:]
                print(
                    f"::error::git cat-file --batch: unexpected EOF while "
                    f"reading {rel_path!r} ({remaining} bytes short)",
                    file=sys.stderr,
                )
                break

            hashes[rel_path] = hasher.hexdigest()
    finally:
        try:
            proc.stdin.close()
        except Exception:
            pass
        stderr_output = b""
        try:
            stderr_output = proc.stderr.read()
        except Exception:
            pass
        proc.stdout.close()
        proc.stderr.close()
        proc.wait()

    if failed:
        print(f"::error::Failed to hash {len(failed)} file(s): {failed}")
        sys.exit(1)

    if proc.returncode != 0:
        print(
            f"::warning::git cat-file --batch exited {proc.returncode}: "
            f"{stderr_output.decode(errors='replace').strip()}",
            file=sys.stderr,
        )

    return hashes


def full_rehash(head_sha):
    res = subprocess.run(
        ["git", "ls-tree", "-r", "-z", "--name-only", head_sha, "--", FILES_DIR.as_posix()],
        capture_output=True,
        check=True,
    )
    rel_paths = sorted(
        Path(p).relative_to(FILES_DIR).as_posix()
        for p in res.stdout.decode().split("\0")
        if p
    )

    return hash_batch(head_sha, rel_paths)


def diff_rehash(base_sha, head_sha):
    hashes = load_existing_hashes()

    cmd = ["git", "diff", "--name-status", "-M", "-z", base_sha, head_sha, "--", "assets/files/"]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)

    fields = res.stdout.split("\0")
    if fields and fields[-1] == "":
        fields.pop()

    changed_files = set()
    deleted_files = set()

    i = 0
    while i < len(fields):
        status = fields[i]
        if status.startswith("R") or status.startswith("C"):
            old_path, new_path = fields[i + 1], fields[i + 2]
            i += 3
            deleted_files.add(Path(old_path).relative_to(FILES_DIR).as_posix())
            changed_files.add(Path(new_path).relative_to(FILES_DIR).as_posix())
        else:
            path_str = fields[i + 1]
            i += 2
            rel_path = Path(path_str).relative_to(FILES_DIR).as_posix()
            if status.startswith("D"):
                deleted_files.add(rel_path)
            else:
                changed_files.add(rel_path)

    for rel_path in deleted_files:
        hashes.pop(rel_path, None)

    changed_list = sorted(changed_files)
    hashes.update(hash_batch(head_sha, changed_list))

    return hashes


def main_releases():
    if files_manifest is None or not files_manifest.source():
        sys.exit("::error::FILES_MANIFEST is not set - in MODS_STORAGE=releases mode mod-hashes.json is built from the releases manifest")

    data = files_manifest.load()

    hashes, missing = {}, []
    for f in data["files"]:
        key = f"{f['category']}/{f['name']}"
        if os.path.basename(key).startswith("."):
            continue
        if not f.get("sha256"):
            missing.append(key)
            continue
        hashes[key] = f["sha256"]

    if missing:
        print(f"::error::{len(missing)} manifest entries have no sha256, e.g. {missing[:5]}", file=sys.stderr)
        sys.exit(1)

    existing = load_existing_hashes()
    if not hashes and existing:
        print(f"::error::manifest produced 0 hashes but {OUTPUT_FILE} has {len(existing)}. Refusing to overwrite.",
              file=sys.stderr)
        sys.exit(1)

    save_hashes(hashes)
    print(f"mod-hashes.json: {len(hashes)} entries from the releases manifest")


def main():
    if MODS_STORAGE == "releases":
        return main_releases()
    if MODS_STORAGE != "git":
        sys.exit(f'::error::MODS_STORAGE must be "git" or "releases", got "{MODS_STORAGE}"')

    probe = subprocess.run(
        ["git", "ls-tree", "--name-only", os.environ.get("HEAD_SHA") or "HEAD", "--", FILES_DIR.as_posix()],
        capture_output=True, text=True,
    )
    if probe.returncode == 0 and not probe.stdout.strip():
        sys.exit("::error::assets/files is not in git, but MODS_STORAGE is not 'releases'. "
                 "Set the MODS_STORAGE repository variable to 'releases'.")

    is_full_rehash = os.environ.get("FULL_REHASH", "false").lower() == "true"
    head_sha = os.environ.get("HEAD_SHA") or "HEAD"

    if is_full_rehash:
        print(f"FULL_REHASH=true: recomputing hashes for every file in assets/files/ at {head_sha}")
        hashes = full_rehash(head_sha)

        existing = load_existing_hashes()
        if not hashes and existing:
            print(
                f"::error::full_rehash produced 0 entries but {OUTPUT_FILE} currently has "
                f"{len(existing)}. Refusing to overwrite - checkout/ref is probably wrong.",
                file=sys.stderr,
            )
            sys.exit(1)
    else:
        base_sha = os.environ.get("BASE_SHA") or "HEAD^"
        print(f"Diffing {base_sha}..{head_sha} for changed files in assets/files/")
        hashes = diff_rehash(base_sha, head_sha)

    save_hashes(hashes)


if __name__ == "__main__":
    main()