import argparse
import json
import os
import re
import subprocess
import sys
from urllib.parse import unquote

MODS_PATH = "assets/data/mods.json"
ANN_PATH = "assets/data/announcements.json"
FILES_PREFIX = "assets/files/"
SITE_URL = "https://h6rd.github.io/Dota2PornFxWeb/"
MAX_DESC = 3800

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


def git(*args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, encoding="utf-8", check=True
    ).stdout


def load_at(rev, path, default):
    try:
        return json.loads(git("show", f"{rev}:{path}"))
    except Exception:
        return default


def mod_name(mod):
    return str(mod.get("name") or mod.get("title") or mod.get("file") or "?")


def iter_mods(data):
    for cat, content in (data.get("modsData") or {}).items():
        if isinstance(content, dict) and "groups" in content:
            mods = [m for g in content["groups"] for m in g.get("mods", [])]
        elif isinstance(content, list):
            mods = content
        else:
            continue
        for m in mods:
            if isinstance(m, dict):
                yield cat, m


def strip_meta(mod):
    return {k: v for k, v in mod.items() if k != "meta"}


def rel_file(value):
    if not value or not isinstance(value, str):
        return None
    if value.startswith(("http://", "https://")):
        marker = "/assets/files/"
        if marker not in value:
            return None
        tail = unquote(value.split(marker, 1)[1].split("?", 1)[0])
        return tail.split("/", 1)[1] if "/" in tail else None
    return value


def flatten(data):
    mods, files = {}, {}
    for cat, m in iter_mods(data):
        key = (cat, mod_name(m))
        mods.setdefault(key, []).append(strip_meta(m))
        entries = [m] + [s for s in m.get("styles", []) if isinstance(s, dict)]
        for e in entries:
            rel = rel_file(e.get("file"))
            if rel:
                files[f"{cat}/{rel}"] = key
    for key in mods:
        mods[key].sort(key=lambda x: json.dumps(x, sort_keys=True, ensure_ascii=False))
    return mods, files


def changed_files(base, head):
    out = git("diff", "--name-status", "--no-renames", "-z", base, head, "--", FILES_PREFIX)
    fields = out.split("\0")
    if fields and fields[-1] == "":
        fields.pop()
    result = []
    for i in range(0, len(fields) - 1, 2):
        status, path = fields[i], fields[i + 1]
        if not status.startswith("D") and path.startswith(FILES_PREFIX):
            result.append(path[len(FILES_PREFIX):])
    return result


def ann_text(a):
    text = a.get("text", "") if isinstance(a, dict) else a
    if isinstance(text, dict):
        text = next(iter(text.values()), "")
    return str(text).strip()


def clean_html(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text)).strip()


def fmt(key):
    cat, name = key
    return f"• **{name}** — {cat}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="discord_payload.json")
    args = ap.parse_args()

    base = os.environ.get("BASE_SHA", "").strip()
    head = os.environ.get("HEAD_SHA", "").strip() or "HEAD"
    gif = os.environ.get("GIF_URL", "")

    def finish(has):
        out = os.environ.get("GITHUB_OUTPUT")
        if out:
            with open(out, "a", encoding="utf-8") as f:
                f.write(f"has_changes={'true' if has else 'false'}\n")

    if not base:
        print("No BASE_SHA, nothing to compare.")
        return finish(False)

    old_mods, _ = flatten(load_at(base, MODS_PATH, {}))
    new_mods, new_files = flatten(load_at(head, MODS_PATH, {}))

    added = sorted(k for k in new_mods if k not in old_mods)
    removed = sorted(k for k in old_mods if k not in new_mods)
    updated = {k for k in new_mods if k in old_mods and new_mods[k] != old_mods[k]}

    # Mods whose files were replaced without touching mods.json
    for rel in changed_files(base, head):
        key = new_files.get(rel)
        if key and key not in added:
            updated.add(key)
    updated = sorted(updated)

    old_ann = {ann_text(a) for a in load_at(base, ANN_PATH, []) if isinstance(a, (dict, str))}
    new_ann = [
        ann_text(a)
        for a in load_at(head, ANN_PATH, [])
        if isinstance(a, (dict, str)) and ann_text(a) not in old_ann
    ]

    sections = []
    if added:
        sections.append(("**Added**", [fmt(k) for k in added]))
    if updated:
        sections.append(("**Updated**", [fmt(k) for k in updated]))
    if removed:
        sections.append(("**Removed**", [fmt(k) for k in removed]))
    if new_ann:
        sections.append(("**Announcements**", [f"• {clean_html(t)[:200]}" for t in new_ann if t]))

    if not sections:
        print("No mod or announcement changes, skipping notification.")
        return finish(False)

    # Build description, truncating if too long
    lines, total = [], sum(len(items) for _, items in sections)
    shown = 0
    for title, items in sections:
        block = [title]
        for item in items:
            if len("\n".join(lines + block + [item])) > MAX_DESC:
                lines += block
                lines.append(f"…and {total - shown} more")
                break
            block.append(item)
            shown += 1
        else:
            lines += block + [""]
            continue
        break
    description = "\n".join(lines).strip()
    description += f"\n\n[🌐 **Open Site**]({SITE_URL})"

    payload = {
        "content": None,
        "embeds": [
            {
                "title": "Changes",
                "description": description,
                "color": 8585067,
                "image": {"url": gif},
            },
            {
                "title": "Website Mirrors",
                "description": (
                    "If the main site is unavailable, you can use one of the mirrors below\n\n"
                    "[**Netlify**](https://d2pfx.netlify.app/) ✦ "
                    "[**Vercel**](https://d2pfx.vercel.app/) ✦ "
                    "[**Onrender**](https://d2pfx.onrender.com/)"
                ),
                "color": 10054655,
                "footer": {"text": "⚠️ Due to high load, some mirrors may be unavailable"},
            },
        ],
        "username": "Github",
        "avatar_url": "https://i.postimg.cc/zGJTFHyj/github.webp",
    }
    if not gif:
        del payload["embeds"][0]["image"]

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    print(description)
    finish(True)


if __name__ == "__main__":
    main()