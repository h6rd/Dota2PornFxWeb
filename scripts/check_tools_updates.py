import json
import os
import re
import sys
import urllib.request
import urllib.error

TOOLS = [
    {
        "owner": "Egezenn",
        "repo": "dota2-minify",
        "name": "Minify",
        "category": "tools",
        "exclude_pattern": None,
        "include_prerelease": True,
    },
    {
        "owner": "TheFleece",
        "repo": "dota2-mod-manager",
        "name": "Dota 2 Mod Manager",
        "category": "tools",
        "exclude_pattern": None,
    },
    {
        "owner": "h6rd",
        "repo": "VPKTool",
        "name": "VPKTool - Extract & Pack VPKs",
        "category": "tools",
        "exclude_pattern": None,
    },
    {
        "owner": "h6rd",
        "repo": "VPKMerge",
        "name": "VPKMerge - Combine VPKs",
        "category": "tools",
        "exclude_pattern": None,
    },
    {
        "owner": "h6rd",
        "repo": "Compiler",
        "name": "Compiler",
        "category": "tools",
        "exclude_pattern": None,
    },
    {
        "owner": "h6rd",
        "repo": "VPCF-Editor",
        "name": "VPCF Editor",
        "category": "tools",
        "exclude_pattern": r"rc\d*|beta|alpha",
    },
    {
        "owner": "h6rd",
        "repo": "Patcher",
        "name": "Patcher - Weather & More",
        "category": "tools",
        "exclude_pattern": None,
    }
]

REPO_ROOT = os.environ.get("GITHUB_WORKSPACE", os.getcwd())
MODS_JSON_PATH = os.path.join(REPO_ROOT, "assets", "data", "mods.json")
STATE_JSON_PATH = os.path.join(REPO_ROOT, "assets", "data", "tool-versions.json")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")


def api_get(url):
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if GITHUB_TOKEN:
        req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP error {e.code} fetching {url}: {e.read().decode('utf-8', 'ignore')}", file=sys.stderr)
        raise


def get_latest_stable_release(owner, repo, exclude_pattern, include_prerelease=False):
    url = f"https://api.github.com/repos/{owner}/{repo}/releases?per_page=30"
    releases = api_get(url)

    compiled = re.compile(exclude_pattern, re.IGNORECASE) if exclude_pattern else None

    for rel in releases:
        if rel.get("draft"):
            continue
        if rel.get("prerelease") and not include_prerelease:
            continue
        tag = rel.get("tag_name", "")
        if compiled and compiled.search(tag):
            continue
        return tag

    return None


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    state = load_json(STATE_JSON_PATH, {})
    mods_data = load_json(MODS_JSON_PATH, {"recentlyAddedMods": []})

    if "recentlyAddedMods" not in mods_data:
        mods_data["recentlyAddedMods"] = []

    updates_found = []

    for tool in TOOLS:
        key = f"{tool['owner']}/{tool['repo']}"
        try:
            latest_tag = get_latest_stable_release(
                tool["owner"],
                tool["repo"],
                tool["exclude_pattern"],
                tool.get("include_prerelease", False),
            )
        except Exception as exc:
            print(f"[WARN] Failed to fetch releases for {key}: {exc}", file=sys.stderr)
            continue

        if latest_tag is None:
            print(f"[WARN] No stable release found for {key}")
            continue

        previous_tag = state.get(key)

        if previous_tag is None:
            print(f"[INIT] {key}: storing initial version {latest_tag}")
            state[key] = latest_tag
            continue

        if previous_tag != latest_tag:
            print(f"[UPDATE] {key}: {previous_tag} -> {latest_tag}")
            state[key] = latest_tag
            updates_found.append(tool)
        else:
            print(f"[OK] {key}: no change ({latest_tag})")

    if updates_found:
        for tool in reversed(updates_found):
            entry = {"name": tool["name"], "category": tool["category"]}
            existing = mods_data["recentlyAddedMods"]
            existing = [e for e in existing if e.get("name") != tool["name"]]
            existing.insert(0, entry)
            mods_data["recentlyAddedMods"] = existing

        save_json(MODS_JSON_PATH, mods_data)

    save_json(STATE_JSON_PATH, state)

    if updates_found:
        names = ", ".join(t["name"] for t in updates_found)
        print(f"::notice::Updates found, added to Latest Updates: {names}")
    else:
        print("No version changes found.")


if __name__ == "__main__":
    main()