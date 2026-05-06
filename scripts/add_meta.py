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

    files_to_check = []
    previews_to_check = []

    if "file" in mod:
        files_to_check.append(mod["file"])
    if "preview" in mod:
        previews_to_check.append(mod["preview"])

    if "styles" in mod and isinstance(mod["styles"], list):
        for style in mod["styles"]:
            if "file" in style:
                files_to_check.append(style["file"])
            if "preview" in style:
                previews_to_check.append(style["preview"])

    # 1. Git Metadata (get latest)
    latest_metadata = None
    for file_name in files_to_check:
        metadata = get_git_metadata(f"assets/files/{category}/{file_name}")
        if metadata:
            if latest_metadata is None or metadata["date"] > latest_metadata["date"]:
                latest_metadata = metadata

    if latest_metadata:
        mod_meta.update(latest_metadata)

    # 2. Image Availability Check
    image_missing = False
    if previews_to_check:
        for preview_name in previews_to_check:
            preview_path = f"assets/previews/{category}/{preview_name}".replace("\\", "/")
            if preview_path not in git_previews:
                image_missing = True
                break

    if image_missing:
        mod_meta["imageMissing"] = True
    elif "imageMissing" in mod_meta:
        del mod_meta["imageMissing"]

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
