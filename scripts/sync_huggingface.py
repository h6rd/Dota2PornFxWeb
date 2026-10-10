import fnmatch
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from huggingface_hub import CommitOperationAdd, CommitOperationDelete, HfApi

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

DEFAULT_SYNC_DIRS = "assets/files,assets/data,assets/previews"
SYNC_DIRS = [
    d.strip().strip("/")
    for d in (os.environ.get("HF_SYNC_DIRS") or DEFAULT_SYNC_DIRS).split(",")
    if d.strip()
]

REPO_ID = os.environ.get("HF_REPO_ID", "").strip()
REPO_TYPE = (os.environ.get("HF_REPO_TYPE") or "dataset").strip()
TOKEN = os.environ.get("HF_TOKEN", "").strip()
FULL_SYNC = os.environ.get("FULL_SYNC", "false").lower() == "true"
BASE_SHA = os.environ.get("BASE_SHA", "").strip()

MAX_BATCH_FILES = 500
MAX_BATCH_BYTES = 2 * 1024**3

PRUNE = os.environ.get("HF_PRUNE", "true").strip().lower() != "false"
KEEP_PATTERNS = [
    p.strip()
    for p in (os.environ.get("HF_KEEP") or "").replace("\n", ",").split(",")
    if p.strip()
]


def is_kept(path):
    return any(fnmatch.fnmatchcase(path, pat) for pat in KEEP_PATTERNS)


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, check=True).stdout


def in_scope(path):
    return any(path.startswith(d + "/") for d in SYNC_DIRS)


def collect_full(head):
    out = git("ls-tree", "-r", "-z", "--name-only", head, "--", *SYNC_DIRS)
    return sorted(p for p in out.decode("utf-8").split("\0") if p)


def collect_diff(base, head):
    out = git("diff", "--name-status", "--no-renames", "-z", base, head, "--", *SYNC_DIRS)
    fields = out.decode("utf-8").split("\0")
    if fields and fields[-1] == "":
        fields.pop()

    added, deleted = set(), set()
    for i in range(0, len(fields), 2):
        status, path = fields[i], fields[i + 1]
        if status.startswith("D"):
            deleted.add(path)
        else:
            added.add(path)
    return sorted(added), sorted(deleted)


def commit_with_retry(api, operations, message):
    for attempt in range(1, 4):
        try:
            api.create_commit(
                repo_id=REPO_ID,
                repo_type=REPO_TYPE,
                operations=operations,
                commit_message=message,
            )
            return
        except Exception as exc:
            if attempt == 3:
                raise
            wait = 10 * attempt
            print(f"::warning::commit failed ({exc}); retry {attempt}/3 in {wait}s", file=sys.stderr)
            time.sleep(wait)


def upload_files(api, head, paths):
    if not paths:
        return

    tmp = Path(tempfile.mkdtemp(prefix="hf-sync-"))
    ops, batch_bytes, batch_no = [], 0, 0

    def flush():
        nonlocal ops, batch_bytes, batch_no
        if not ops:
            return
        batch_no += 1
        print(f"Committing batch {batch_no}: {len(ops)} file(s), {batch_bytes / 1024**2:.1f} MiB")
        commit_with_retry(api, ops, f"Sync from GitHub {head[:7]} (batch {batch_no})")
        ops, batch_bytes = [], 0
        for f in tmp.iterdir():
            f.unlink()

    try:
        for idx, path in enumerate(paths, 1):
            local = tmp / f"{idx}.bin"
            with local.open("wb") as fh:
                subprocess.run(["git", "cat-file", "blob", f"{head}:{path}"], stdout=fh, check=True)

            size = local.stat().st_size
            ops.append(CommitOperationAdd(path_in_repo=path, path_or_fileobj=str(local)))
            batch_bytes += size

            if len(ops) >= MAX_BATCH_FILES or batch_bytes >= MAX_BATCH_BYTES:
                flush()
        flush()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    if not REPO_ID or not TOKEN:
        print("::error::HF_REPO_ID and HF_TOKEN must be set", file=sys.stderr)
        sys.exit(1)

    head = git("rev-parse", "HEAD").decode().strip()
    api = HfApi(token=TOKEN)
    api.repo_info(repo_id=REPO_ID, repo_type=REPO_TYPE)

    remote = {p for p in api.list_repo_files(repo_id=REPO_ID, repo_type=REPO_TYPE) if in_scope(p)}

    if FULL_SYNC:
        print(f"FULL_SYNC=true: syncing every file at {head[:7]}")
        to_add = collect_full(head)
        if not to_add:
            print("::error::full sync found 0 files in git - refusing to continue (wrong checkout?)", file=sys.stderr)
            sys.exit(1)
        tree = set(to_add)
        to_delete = sorted(p for p in remote if p not in tree)
    else:
        base = BASE_SHA or "HEAD^"
        if subprocess.run(["git", "cat-file", "-e", f"{base}^{{commit}}"], capture_output=True).returncode != 0:
            print(f"::warning::base {base!r} not found, falling back to HEAD^", file=sys.stderr)
            base = "HEAD^"
        print(f"Incremental sync {base[:7]}..{head[:7]}")
        to_add, deleted = collect_diff(base, head)
        to_delete = [p for p in deleted if p in remote]

    if not PRUNE:
        to_delete = []
    kept = [p for p in to_delete if is_kept(p)]
    if kept:
        print(f"Keeping {len(kept)} protected file(s) on HF: {kept}")
    to_delete = [p for p in to_delete if not is_kept(p)]

    print(f"To upload: {len(to_add)}, to delete: {len(to_delete)}")

    if to_delete:
        commit_with_retry(
            api,
            [CommitOperationDelete(path_in_repo=p) for p in to_delete],
            f"Remove {len(to_delete)} file(s) deleted on GitHub ({head[:7]})",
        )

    upload_files(api, head, to_add)
    print("Hugging Face sync complete.")


if __name__ == "__main__":
    main()