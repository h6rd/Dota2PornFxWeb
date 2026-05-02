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
    if "file" in mod:
        metadata = get_git_metadata(f"assets/files/{category}/{mod['file']}")
        if metadata:
            mod_meta.update(metadata)

    preview_name = mod.get("preview", "")
    preview_path = f"assets/previews/{category}/{preview_name}".replace("\\", "/")
    is_image_missing = preview_path not in git_previews

    video_url = None
    sources = []
    if mod.get("linkType") == "preview" and mod.get("linkUrl"):
        sources.append(mod["linkUrl"])
    if "links" in mod:
        for l in mod["links"]:
            if l.get("type") == "preview":
                sources.append(l.get("url", ""))

    for s in sources:
        if s.endswith(".mp4") and s.replace("\\", "/") in git_previews:
            video_url = s
            break

    if not video_url and preview_name:
        base = preview_name.rsplit(".", 1)[0]
        for var in [
            f"{base}.mp4",
            base.replace(" ", "_") + ".mp4",
            base.replace(" ", "-") + ".mp4",
            base.replace("-", "_") + ".mp4",
        ]:
            v_path = f"assets/previews/{category}/{var}".replace("\\", "/")
            if v_path in git_previews:
                video_url = v_path
                break

    if is_image_missing:
        mod_meta["imageMissing"] = True
        mod_meta["fallback"] = "assets/favicon.ico"
    if video_url:
        mod_meta["hasVideo"] = True
        mod_meta["videoUrl"] = video_url

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
