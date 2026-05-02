import json
import os
import subprocess

MODS_JSON_PATH = os.path.join("assets", "data", "mods.json")
FILES_DIR = os.path.join("assets", "files")


def get_git_metadata(file_path):
    try:
        # Get the last commit hash and unix timestamp for the file
        result = subprocess.run(
            ["git", "log", "-1", "--pretty=format:%H,%at", "--", file_path], capture_output=True, text=True, check=True
        )
        if result.stdout:
            sha, timestamp = result.stdout.split(",")
            return {"date": int(timestamp), "commit-sha": sha}
    except Exception as e:
        print(f"Error getting git metadata for {file_path}: {e}")
    return None


def get_all_git_files(path):
    try:
        result = subprocess.run(["git", "ls-files", path], capture_output=True, text=True, check=True)
        return set(result.stdout.splitlines())
    except Exception as e:
        print(f"Error listing git files: {e}")
        return set()


def main():
    if not os.path.exists(MODS_JSON_PATH):
        print(f"File not found: {MODS_JSON_PATH}")
        return

    with open(MODS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "modsData" not in data:
        print("modsData not found in JSON")
        return

    # Pre-fetch all preview files to speed up checks
    git_previews = get_all_git_files("assets/previews")

    mods_data = data["modsData"]
    total_updated = 0

    for category, mods in mods_data.items():
        print(f"Processing category: {category}")
        for mod in mods:
            mod_meta = {}

            # 1. Get Git Metadata for the main file
            if "file" in mod:
                file_name = mod["file"]
                file_path = f"assets/files/{category}/{file_name}"

                metadata = get_git_metadata(file_path)
                if metadata:
                    mod_meta.update(metadata)
                elif not file_name.startswith("http"):
                    print(f"Warning: No git metadata for: {file_path}")

            # 2. Check for Preview Image existence
            if "preview" in mod:
                preview_name = mod["preview"]
                preview_path = f"assets/previews/{category}/{preview_name}"

                if preview_path.replace("\\", "/") not in git_previews:
                    # Check if an MP4 version exists instead
                    base_name = preview_name.rsplit(".", 1)[0]
                    mp4_path = f"assets/previews/{category}/{base_name}.mp4"

                    if mp4_path.replace("\\", "/") in git_previews:
                        mod_meta["hasVideo"] = True
                        mod_meta["imageMissing"] = True
                    else:
                        mod_meta["imageMissing"] = True
                        # Point to favicon in the same data branch root
                        mod_meta["fallback"] = "favicon.ico"

            if mod_meta:
                mod["meta"] = mod_meta
                total_updated += 1

    # Save the updated JSON
    with open(MODS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Finished! Updated {total_updated} mods.")


if __name__ == "__main__":
    main()
