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
MINIFY_URL = "https://egezenn.github.io/dota2-minify/"
MOD_MANAGER_URL = "https://dota2modmanager.com/"
MAX_DESC = 3400
IS_COMPONENTS_V2 = 1 << 15

EMOJI = {
    "site":        {"name": "site",    "id": "1569706674296717322", "animated": True, "fallback": "🌐"},
    "added":       {"name": "added",   "id": "1569716374551396392", "animated": True, "fallback": "➕"},
    "updated":     {"name": "updated", "id": "1569716342418964593", "animated": True, "fallback": "🔄"},
    "removed":     {"name": "removed", "id": "1569716405807349883", "animated": True, "fallback": "🗑️"},
    "ann":         {"name": "ann",     "id": "1569716311397761164", "animated": True, "fallback": "📢"},
    "mirror":      {"name": "mirror", "id": "1569716522199285894", "animated": True, "fallback": "🔗"},
    "tools":       {"name": "tools",  "id": "1569716486610755728", "animated": True, "fallback": "📦"},
}


def emoji_text(key):
    e = EMOJI[key]
    if not e["id"]:
        return e["fallback"]
    return f"<{'a' if e['animated'] else ''}:{e['name']}:{e['id']}>"


def emoji_button(key):
    e = EMOJI[key]
    if not e["id"]:
        return {"name": e["fallback"]}
    return {"name": e["name"], "id": e["id"], "animated": e["animated"]}


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


def build_description(sections, limit):
    total = sum(len(items) for _, items in sections)
    lines, shown = [], 0
    for title, items in sections:
        block = [title]
        for item in items:
            if len("\n".join(lines + block + [item])) > limit:
                lines += block
                lines.append(f"…and {total - shown} more")
                return "\n".join(lines).strip()
            block.append(item)
            shown += 1
        lines += block + [""]
    return "\n".join(lines).strip()


def link_button(label, url, emoji=None):
    btn = {"type": 2, "style": 5, "label": label, "url": url}
    if emoji:
        btn["emoji"] = emoji
    return btn


def action_row(*buttons):
    return {"type": 1, "components": list(buttons)}


def build_payload(description, gif, avatar):
    changes_children = [
        {"type": 10, "content": f"## Changes\n{description}"},
    ]
    if gif:
        changes_children.append({"type": 12, "items": [{"media": {"url": gif}}]})
    changes_children.append(action_row(link_button("Open Site", SITE_URL, emoji_button("site"))))

    mirrors_children = [
        {
            "type": 10,
            "content": "### Mirrors\n"
            "If the main site is unavailable, you can use one of the mirrors below",
        },
        {"type": 10, "content": "-# Due to high load, some mirrors may be unavailable"},
        action_row(
            link_button("Netlify", "https://d2pfx.netlify.app/", emoji_button("mirror")),
            link_button("Vercel", "https://d2pfx.vercel.app/", emoji_button("mirror")),
            link_button("Onrender", "https://d2pfx.onrender.com/", emoji_button("mirror")),
        ),
        {"type": 14, "divider": True, "spacing": 1},
        {"type": 10, "content": "You can also download mods via:"},
        action_row(
            link_button("Mod Manager", MOD_MANAGER_URL, emoji_button("tools")),
            link_button("Minify", MINIFY_URL, emoji_button("tools")),
        ),
    ]

    payload = {
        "flags": IS_COMPONENTS_V2,
        "username": "Github",
        "avatar_url": avatar,
        "components": [
            {"type": 17, "accent_color": 8585067, "components": changes_children},
            {"type": 17, "accent_color": 10054655, "components": mirrors_children},
        ],
    }
    if not avatar:
        del payload["avatar_url"]
    return payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="discord_payload.json")
    args = ap.parse_args()

    base = os.environ.get("BASE_SHA", "").strip()
    head = os.environ.get("HEAD_SHA", "").strip() or "HEAD"
    gif = os.environ.get("GIF_URL", "")
    avatar = os.environ.get("AVATAR_URL", "")

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
        sections.append((f"### {emoji_text('added')} **Added**", [fmt(k) for k in added]))
    if updated:
        sections.append((f"### {emoji_text('updated')} **Updated**", [fmt(k) for k in updated]))
    if removed:
        sections.append((f"### {emoji_text('removed')} **Removed**", [fmt(k) for k in removed]))
    if new_ann:
        sections.append((f"### {emoji_text('ann')} **Announcements**", [f"• {clean_html(t)[:200]}" for t in new_ann if t]))

    if not sections:
        print("No mod or announcement changes, skipping notification.")
        return finish(False)

    description = build_description(sections, MAX_DESC)
    payload = build_payload(description, gif, avatar)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    print(description)
    finish(True)


if __name__ == "__main__":
    main()