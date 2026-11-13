import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path


def source():
    return (os.environ.get("FILES_MANIFEST") or "").strip()


def _fetch(url):
    headers = {"User-Agent": "dota2pornfx-ci"}
    token = os.environ.get("GITHUB_TOKEN")
    if "api.github.com" in url:
        headers["Accept"] = "application/vnd.github.raw+json"
    if token and ("api.github.com" in url or "raw.githubusercontent.com" in url):
        headers["Authorization"] = f"Bearer {token}"
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError) as exc:
            last = exc
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"cannot download manifest {url}: {last}")


def load(src=None):
    src = src or source()
    if not src:
        raise RuntimeError("FILES_MANIFEST is not set")
    raw = _fetch(src) if src.startswith(("http://", "https://")) else Path(src).read_bytes()
    data = json.loads(raw.decode("utf-8"))
    files = data.get("files") if isinstance(data, dict) else None
    if not isinstance(files, list) or not files:
        raise RuntimeError(f"manifest {src} has no 'files' - refusing to use it")
    for f in files:
        for k in ("category", "name", "asset", "tag", "url"):
            if not f.get(k):
                raise RuntimeError(f"manifest entry without '{k}': {f}")
    return data


def paths(data):
    return {f"{f['category']}/{f['name']}" for f in data["files"]}
