import fnmatch
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from huggingface_hub import CommitOperationAdd, CommitOperationDelete, HfApi
from huggingface_hub.hf_api import RepoFile
from huggingface_hub.utils import EntryNotFoundError

try:
    import files_manifest
except ImportError:
    files_manifest = None

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

MODS_DIR = "assets/files"

DEFAULT_SYNC_DIRS = "assets/files,assets/data,assets/previews"
SYNC_DIRS = [
    d.strip().strip("/")
    for d in (os.environ.get("HF_SYNC_DIRS") or DEFAULT_SYNC_DIRS).split(",")
    if d.strip()
]
# MODS_STORAGE=git (default): everything, including assets/files, is synced from git (the old behaviour).
# MODS_STORAGE=releases: assets/files comes from the releases manifest, the rest from git.
STORAGE = (os.environ.get("MODS_STORAGE") or "git").strip().lower()
SYNC_MODS = STORAGE == "releases" and MODS_DIR in SYNC_DIRS
GIT_DIRS = [d for d in SYNC_DIRS if d != MODS_DIR] if STORAGE == "releases" else SYNC_DIRS

REPO_ID = os.environ.get("HF_REPO_ID", "").strip()
REPO_TYPE = (os.environ.get("HF_REPO_TYPE") or "dataset").strip()
TOKEN = os.environ.get("HF_TOKEN", "").strip()
FULL_SYNC = os.environ.get("FULL_SYNC", "false").lower() == "true"
BASE_SHA = os.environ.get("BASE_SHA", "").strip()

MAX_BATCH_FILES = 500
MAX_BATCH_BYTES = 2 * 1024**3

# Deleting files on HF is OFF by default: it is enabled ONLY by an explicit HF_PRUNE=true.
# (an empty variable, a typo or a missing variable all mean no deletions)
PRUNE = os.environ.get("HF_PRUNE", "").strip().lower() == "true"
KEEP_PATTERNS = [
    p.strip()
    for p in (os.environ.get("HF_KEEP") or "").replace("\n", ",").split(",")
    if p.strip()
]


def is_kept(path):
    return any(fnmatch.fnmatchcase(path, pat) for pat in KEEP_PATTERNS)


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, check=True).stdout


def in_git_scope(path):
    return any(path.startswith(d + "/") for d in GIT_DIRS)


def collect_full(head):
    if not GIT_DIRS:
        return []
    out = git("ls-tree", "-r", "-z", "--name-only", head, "--", *GIT_DIRS)
    return sorted(p for p in out.decode("utf-8").split("\0") if p)


def collect_diff(base, head):
    if not GIT_DIRS:
        return [], []
    out = git("diff", "--name-status", "--no-renames", "-z", base, head, "--", *GIT_DIRS)
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


# ---- mods from the releases manifest ----------------------------------------------------------------------

def lfs_sha256(item):
    lfs = getattr(item, "lfs", None)
    if not lfs:
        return None
    return getattr(lfs, "sha256", None) or (lfs.get("sha256") if hasattr(lfs, "get") else None)


def hf_remote_files(api, prefix):
    """-> {path: (size, lfs_sha256 or None)} for every file under prefix."""
    out = {}
    try:
        for item in api.list_repo_tree(repo_id=REPO_ID, repo_type=REPO_TYPE, path_in_repo=prefix, recursive=True):
            if isinstance(item, RepoFile):
                out[item.path] = (item.size, lfs_sha256(item))
    except EntryNotFoundError:
        pass
    return out


def same_on_hf(remote, entry):
    if not remote:
        return False
    size, sha = remote
    if sha and entry.get("sha256"):
        return sha.lower() == entry["sha256"].lower()
    return size == entry.get("size")


def download(url, dst, expected_sha):
    last = None
    for attempt in range(1, 4):
        try:
            h = hashlib.sha256()
            req = urllib.request.Request(url, headers={"User-Agent": "dota2pornfx-ci"})
            with urllib.request.urlopen(req, timeout=120) as r, open(dst, "wb") as f:
                for chunk in iter(lambda: r.read(1 << 20), b""):
                    f.write(chunk)
                    h.update(chunk)
            if expected_sha and h.hexdigest() != expected_sha.lower():
                raise RuntimeError(f"sha256 mismatch (got {h.hexdigest()[:12]}..., manifest {expected_sha[:12]}...)")
            return
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(5 * attempt)
    raise RuntimeError(f"cannot download {url}: {last}")


def sync_manifest_files(api):
    """Stateless: compares sha256 from the manifest with the LFS sha256 on HF.
    -> (items to upload [(path, fetch)], paths on HF that are not in the manifest)."""
    if files_manifest is None or not files_manifest.source():
        print("::error::FILES_MANIFEST is not set - assets/files is synced from the releases manifest", file=sys.stderr)
        sys.exit(1)
    data = files_manifest.load()  # refuses an empty manifest
    want = {f"{MODS_DIR}/{f['category']}/{f['name']}": f for f in data["files"]}
    remote = hf_remote_files(api, MODS_DIR)

    todo = sorted(p for p, f in want.items() if not same_on_hf(remote.get(p), f))
    extra = sorted(p for p in remote if p not in want)
    print(f"Mods: {len(want)} in manifest, {len(remote)} on HF, to upload: {len(todo)}, not in manifest: {len(extra)}")

    items = []
    for p in todo:
        f = want[p]
        items.append((p, (lambda dst, f=f: download(f["url"], dst, f.get("sha256")))))
    return items, extra


# ---- upload ------------------------------------------------------------------------------------------------

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


def upload_items(api, head, items):
    """items: [(path_in_repo, fetch(dst_path))]"""
    if not items:
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
        for idx, (path, fetch) in enumerate(items, 1):
            local = tmp / f"{idx}.bin"
            fetch(local)
            ops.append(CommitOperationAdd(path_in_repo=path, path_or_fileobj=str(local)))
            batch_bytes += local.stat().st_size

            if len(ops) >= MAX_BATCH_FILES or batch_bytes >= MAX_BATCH_BYTES:
                flush()
        flush()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def git_fetch(head, path):
    def fetch(dst):
        with open(dst, "wb") as fh:
            subprocess.run(["git", "cat-file", "blob", f"{head}:{path}"], stdout=fh, check=True)
    return fetch


def main():
    if not REPO_ID or not TOKEN:
        print("::error::HF_REPO_ID and HF_TOKEN must be set", file=sys.stderr)
        sys.exit(1)

    if STORAGE not in ("git", "releases"):
        print(f'::error::MODS_STORAGE must be "git" or "releases", got "{STORAGE}"', file=sys.stderr)
        sys.exit(1)

    head = git("rev-parse", "HEAD").decode().strip()

    # Safety net: with assets/files removed from git and MODS_STORAGE=git, an incremental diff would see every mod as
    # deleted (and HF_PRUNE=true would then wipe them on HF).
    if STORAGE == "git" and MODS_DIR in SYNC_DIRS and not git("ls-tree", "--name-only", head, "--", MODS_DIR).strip():
        print("::error::assets/files is not in git, but MODS_STORAGE is not 'releases'. "
              "Set the MODS_STORAGE repository variable to 'releases'.", file=sys.stderr)
        sys.exit(1)

    api = HfApi(token=TOKEN)
    api.repo_info(repo_id=REPO_ID, repo_type=REPO_TYPE)

    # ---- part 1: assets/data, assets/previews, ... from git
    git_add, git_delete = [], []
    if GIT_DIRS:
        remote = {p for p in api.list_repo_files(repo_id=REPO_ID, repo_type=REPO_TYPE) if in_git_scope(p)}
        if FULL_SYNC:
            print(f"FULL_SYNC=true: syncing every git file at {head[:7]}")
            git_add = collect_full(head)
            if not git_add:
                print("::error::full sync found 0 files in git - refusing to continue (wrong checkout?)", file=sys.stderr)
                sys.exit(1)
            tree = set(git_add)
            git_delete = sorted(p for p in remote if p not in tree)
        else:
            base = BASE_SHA or "HEAD^"
            if subprocess.run(["git", "cat-file", "-e", f"{base}^{{commit}}"], capture_output=True).returncode != 0:
                print(f"::warning::base {base!r} not found, falling back to HEAD^", file=sys.stderr)
                base = "HEAD^"
            print(f"Incremental sync {base[:7]}..{head[:7]}")
            git_add, deleted = collect_diff(base, head)
            git_delete = [p for p in deleted if p in remote]

    # ---- part 2: mods from the releases manifest (always a full comparison, it is cheap)
    mod_items, mod_extra = ([], [])
    if SYNC_MODS:
        mod_items, mod_extra = sync_manifest_files(api)

    to_delete = git_delete + mod_extra
    if not PRUNE:
        if to_delete:
            print(f"Prune is OFF (HF_PRUNE!=true): keeping {len(to_delete)} file(s) on HF that are not in git/manifest")
        to_delete = []
    kept = [p for p in to_delete if is_kept(p)]
    if kept:
        print(f"Keeping {len(kept)} protected file(s) on HF: {kept}")
    to_delete = [p for p in to_delete if not is_kept(p)]

    items = [(p, git_fetch(head, p)) for p in git_add] + mod_items
    print(f"To upload: {len(items)} (git: {len(git_add)}, mods: {len(mod_items)}), to delete: {len(to_delete)}")

    if to_delete:
        commit_with_retry(
            api,
            [CommitOperationDelete(path_in_repo=p) for p in to_delete],
            f"Remove {len(to_delete)} file(s) deleted on GitHub ({head[:7]})",
        )

    upload_items(api, head, items)
    print("Hugging Face sync complete.")


if __name__ == "__main__":
    main()
