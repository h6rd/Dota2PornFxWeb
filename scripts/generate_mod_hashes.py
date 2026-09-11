import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

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


def full_rehash():
    hashes = {}
    if not FILES_DIR.exists():
        return hashes

    for path in sorted(FILES_DIR.rglob("*")):
        if path.is_file():
            rel_path = path.relative_to(FILES_DIR).as_posix()
            hashes[rel_path] = hashlib.sha256(path.read_bytes()).hexdigest()

    return hashes


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
    failed = []

    if changed_list:
        requests = [f"{head_sha}:{FILES_DIR.as_posix()}/{rel_path}\n" for rel_path in changed_list]

        proc = subprocess.run(
            ["git", "cat-file", "--batch"],
            input="".join(requests).encode(),
            capture_output=True,
            check=False,
        )

        data = proc.stdout
        pos = 0

        for idx, rel_path in enumerate(changed_list):
            try:
                nl = data.index(b"\n", pos)
                header = data[pos:nl].decode("utf-8", errors="replace")
                pos = nl + 1

                if header.endswith(" missing"):
                    raise ValueError(f"blob missing ({header!r})")

                oid, obj_type, size_str = header.split()
                size = int(size_str)
                content = data[pos:pos + size]
                pos += size + 1
            except (ValueError, IndexError) as exc:
                failed.extend(changed_list[idx:])
                print(
                    f"::error::git cat-file --batch parsing failed at "
                    f"{rel_path!r}: {exc}",
                    file=sys.stderr,
                )
                break

            hashes[rel_path] = hashlib.sha256(content).hexdigest()

        if proc.returncode != 0 and not failed:
            stderr_text = proc.stderr.decode(errors="replace").strip()
            print(
                f"::warning::git cat-file --batch exited {proc.returncode}: {stderr_text}",
                file=sys.stderr,
            )

    if failed:
        print(f"::error::Failed to hash {len(failed)} file(s): {failed}")
        sys.exit(1)

    return hashes


def main():
    is_full_rehash = os.environ.get("FULL_REHASH", "false").lower() == "true"

    if is_full_rehash:
        print("FULL_REHASH=true: recomputing hashes for every file in assets/files/")
        hashes = full_rehash()
    else:
        base_sha = os.environ.get("BASE_SHA") or "HEAD^"
        head_sha = os.environ.get("HEAD_SHA") or "HEAD"
        print(f"Diffing {base_sha}..{head_sha} for changed files in assets/files/")
        hashes = diff_rehash(base_sha, head_sha)

    save_hashes(hashes)


if __name__ == "__main__":
    main()
