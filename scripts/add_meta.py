import json
import os
import subprocess

MODS_JSON_PATH = os.path.join("assets", "data", "mods.json")


def get_git_metadata(file_path):
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--pretty=format:%H,%at", "--", file_path], capture_output=True, text=True, check=True
        )
        if result.stdout:
            sha, timestamp = result.stdout.split(",")
            return {"date": int(timestamp), "commit-sha": sha}
    except Exception:
        pass
    return None


def get_all_git_files(path):
    try:
        result = subprocess.run(["git", "ls-files", path], capture_output=True, text=True, check=True)
        return set(result.stdout.replace("\\", "/").splitlines())
    except Exception:
        return set()


def process_mod_item(mod, category, git_previews):
    if not isinstance(mod, dict):
        return
    mod_meta = mod.get("meta", {})

    # 1. Git Metadata
    if "file" in mod:
        metadata = get_git_metadata(f"assets/files/{category}/{mod['file']}")
        if metadata:
            mod_meta.update(metadata)

    # 2. Image Availability Check
    preview_name = mod.get("preview", "")
    if preview_name:
        preview_path = f"assets/previews/{category}/{preview_name}".replace("\\", "/")
        if preview_path not in git_previews:
            mod_meta["imageMissing"] = True

    if mod_meta:
        mod["meta"] = mod_meta


def main():
    if not os.path.exists(MODS_JSON_PATH):
        return
    with open(MODS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    git_previews = get_all_git_files("assets/previews")
    mods_data = data.get("modsData", {})
    for cat, content in mods_data.items():
        if isinstance(content, dict) and "groups" in content:
            for g in content["groups"]:
                for m in g.get("mods", []):
                    process_mod_item(m, cat, git_previews)
        else:
            for m in content if isinstance(content, list) else []:
                process_mod_item(m, cat, git_previews)
    with open(MODS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
