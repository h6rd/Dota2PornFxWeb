import json
import os
import subprocess
import sys
import unicodedata
from collections import Counter
from urllib.parse import unquote, urlparse

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = "assets/data"
FILES_PREFIX = "assets/files/"
PREVIEWS_PREFIX = "assets/previews/"
MODS_JSON = f"{DATA_DIR}/mods.json"
CONSTANTS_JSON = f"{DATA_DIR}/constants.json"
GUIDES_JSON = f"{DATA_DIR}/guides.json"
ANNOUNCEMENTS_JSON = f"{DATA_DIR}/announcements.json"

REPO_HOSTS = {"h6rd.github.io", "raw.githubusercontent.com"}

REF = os.environ.get("VALIDATE_REF", "").strip() or "HEAD"
STRICT_PREVIEWS = os.environ.get("STRICT_PREVIEWS", "false").strip().lower() == "true"
IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"
MAX_LISTED = 20
MAX_SUMMARY_ROWS = 100

issues = []


def err(file, msg):
    issues.append(("error", file, msg))


def warn(file, msg):
    issues.append(("warning", file, msg))


def fold(path):
    return unicodedata.normalize("NFC", path).casefold()


class PathIndex:
    def __init__(self, paths):
        self.exact = set(paths)
        self.folded = {}
        for p in paths:
            self.folded.setdefault(fold(p), []).append(p)

    def lookup(self, path):
        if path in self.exact:
            return "ok", path
        alt = self.folded.get(fold(path))
        if alt:
            return "case", alt[0]
        return "missing", None


def tree_paths(prefix):
    out = subprocess.run(
        ["git", "ls-tree", "-r", "-z", "--name-only", REF, "--", prefix],
        capture_output=True,
        check=True,
    ).stdout
    return {p for p in out.decode("utf-8").split("\0") if p}


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        err(path, f"invalid JSON: {e}")
        return None


def resolve_translations(constants):
    t = constants.get("translations") if isinstance(constants, dict) else None
    if isinstance(t, dict) and isinstance(t.get("en"), dict):
        return t["en"]
    return t if isinstance(t, dict) else None


def contains_id(node, wanted):
    if isinstance(node, dict):
        if wanted in node or node.get("id") == wanted:
            return True
        return any(contains_id(v, wanted) for v in node.values())
    if isinstance(node, list):
        return any(contains_id(v, wanted) for v in node)
    return False


class Validator:
    def __init__(self, files_index, previews_index, guides):
        self.files_index = files_index
        self.previews_index = previews_index
        self.guides = guides
        self.referenced_files = set()
        self.names = {}
        self.labels = {}
        self.packs = []
        self.mod_count = 0

    def check_ref(self, kind, category, value, where):
        is_file = kind != "preview"
        if not isinstance(value, str):
            err(MODS_JSON, f"{where}: '{kind}' must be a string")
            return
        if not value.strip():
            if is_file:
                err(MODS_JSON, f"{where}: '{kind}' is empty")
            return

        if value.startswith(("http://", "https://")):
            host = urlparse(value).netloc.lower()
            if is_file and host in REPO_HOSTS and "/assets/files/" in value:
                tail = unquote(value.split("/assets/files/", 1)[1].split("?", 1)[0])
                full = FILES_PREFIX + tail
            else:
                return
        elif not is_file and value.startswith(PREVIEWS_PREFIX):
            full = value
        else:
            if "\\" in value:
                err(MODS_JSON, f"{where}: {kind} '{value}' contains a backslash, use '/'")
                return
            if value.startswith("/") or ".." in value.split("/"):
                err(MODS_JSON, f"{where}: {kind} '{value}' must be a relative path inside the category folder")
                return
            base = FILES_PREFIX if is_file else PREVIEWS_PREFIX
            full = f"{base}{category}/{value}"

        index = self.files_index if is_file else self.previews_index
        status, actual = index.lookup(full)
        if is_file and actual:
            self.referenced_files.add(actual)

        if status == "ok":
            return
        if status == "case":
            err(
                MODS_JSON,
                f"{where}: {kind} '{value}' differs from the repository path '{actual}' "
                f"(case or Unicode form) - works on Windows/macOS but 404s on GitHub Pages",
            )
            return
        if is_file:
            err(MODS_JSON, f"{where}: {kind} not found in repository: {full}")
        elif STRICT_PREVIEWS:
            err(MODS_JSON, f"{where}: preview not found in repository: {full}")
        else:
            warn(MODS_JSON, f"{where}: preview not found in repository: {full}")

    def check_entry_refs(self, category, entry, where):
        for kind in ("file", "fileWin", "fileLinux", "preview"):
            if entry.get(kind) is not None:
                self.check_ref(kind, category, entry[kind], where)
        guide_id = entry.get("guideId")
        if guide_id and self.guides is not None and not contains_id(self.guides, guide_id):
            warn(MODS_JSON, f"{where}: guideId '{guide_id}' not found in guides.json")

    def check_mod(self, category, mod, group_label=""):
        if not isinstance(mod, dict):
            err(MODS_JSON, f"{category}{group_label}: mod entry is not an object")
            return
        self.mod_count += 1
        name = mod.get("name")
        if not isinstance(name, str) or not name.strip():
            err(MODS_JSON, f"{category}{group_label}: mod without a 'name': {json.dumps(mod, ensure_ascii=False)[:80]}")
            return
        self.names.setdefault(category, Counter())[name] += 1
        self.labels.setdefault(name, set()).update(
            st.get("label") for st in (mod.get("styles") or []) if isinstance(st, dict)
        )
        where = f"{category}{group_label} / {name!r}"
        if mod.get("type") == "pack":
            members = mod.get("mods")
            if isinstance(members, list):
                self.packs.append((category, name, members))
            else:
                err(MODS_JSON, f"{where}: a pack needs a 'mods' list")

        self.check_entry_refs(category, mod, where)

        tags = mod.get("tags")
        if tags is not None and not isinstance(tags, dict):
            warn(MODS_JSON, f"{where}: 'tags' should be an object")

        styles = mod.get("styles")
        if styles is None:
            return
        if not isinstance(styles, list) or not all(isinstance(s, dict) for s in styles):
            err(MODS_JSON, f"{where}: 'styles' must be a list of objects")
            return
        for i, style in enumerate(styles):
            swhere = f"{where} / style #{i + 1}"
            self.check_entry_refs(category, style, swhere)
            if len(styles) > 1:
                if not isinstance(style.get("label"), str):
                    err(MODS_JSON, f"{swhere}: 'label' must be a string (the card crashes in createModCard)")
                if not style.get("color"):
                    warn(MODS_JSON, f"{swhere}: missing 'color' for the style switcher")

    def check_category(self, category, content):
        if isinstance(content, list):
            for mod in content:
                self.check_mod(category, mod)
        elif isinstance(content, dict) and isinstance(content.get("groups"), list):
            seen_ids = Counter()
            for g_index, group in enumerate(content["groups"]):
                if not isinstance(group, dict) or not isinstance(group.get("mods"), list):
                    err(MODS_JSON, f"{category}: group #{g_index + 1} must be an object with a 'mods' list")
                    continue
                gname = group.get("name")
                gid = group.get("id")
                if not isinstance(gname, str) or not gname:
                    err(MODS_JSON, f"{category}: group #{g_index + 1} has no 'name'")
                if gid in (None, ""):
                    warn(MODS_JSON, f"{category}: group {gname!r} has no 'id'")
                else:
                    seen_ids[gid] += 1
                label = f" [{gname}]" if gname else f" [group #{g_index + 1}]"
                for mod in group["mods"]:
                    self.check_mod(category, mod, label)
            for gid, n in seen_ids.items():
                if n > 1:
                    err(MODS_JSON, f"{category}: group id '{gid}' is used {n} times")
        else:
            err(MODS_JSON, f"{category}: expected a list of mods or an object with 'groups'")

    def check_packs(self):
        for category, pack, members in self.packs:
            for entry in members:
                name = entry if isinstance(entry, str) else (entry or {}).get("name")
                style = None if isinstance(entry, str) else (entry or {}).get("style")
                if name not in self.labels:
                    warn(MODS_JSON, f"{category} / pack {pack!r}: member {name!r} is not an existing mod")
                elif style and style not in self.labels[name]:
                    warn(MODS_JSON, f"{category} / pack {pack!r}: mod {name!r} has no style {style!r}")

    def check_duplicates(self):
        for category, counter in self.names.items():
            for name, n in counter.items():
                if n > 1:
                    err(
                        MODS_JSON,
                        f"{category}: duplicate mod name {name!r} ({n} times) - "
                        f"'?mod=' links and the style memory use the name as a key",
                    )


def check_constants(constants, mods_data, guides):
    if not isinstance(constants, dict):
        err(CONSTANTS_JSON, "missing or not an object")
        return
    categories = constants.get("categories")
    if not isinstance(categories, list):
        err(CONSTANTS_JSON, "'categories' must be a list")
        return

    translations = resolve_translations(constants)
    if translations is None:
        warn(CONSTANTS_JSON, "'translations' not found - category title/description checks skipped")

    ids = Counter()
    for c in categories:
        if not isinstance(c, dict) or not c.get("id"):
            err(CONSTANTS_JSON, f"category entry without 'id': {json.dumps(c, ensure_ascii=False)[:80]}")
            continue
        cid = c["id"]
        ids[cid] += 1
        key = c.get("key")
        if not key:
            err(CONSTANTS_JSON, f"category '{cid}' has no 'key'")
            continue
        if not c.get("hidden") and translations is not None:
            for k in (key, f"{key}-desc"):
                if not isinstance(translations.get(k), str) or not translations[k].strip():
                    err(CONSTANTS_JSON, f"category '{cid}': translation '{k}' is missing (category search crashes on it)")
        gid = c.get("guideId")
        if gid and guides is not None and not contains_id(guides, gid):
            warn(CONSTANTS_JSON, f"category '{cid}': guideId '{gid}' not found in guides.json")
        if not c.get("hidden") and cid not in mods_data:
            warn(CONSTANTS_JSON, f"category '{cid}' has no entry in mods.json")

    for cid, n in ids.items():
        if n > 1:
            err(CONSTANTS_JSON, f"category id '{cid}' is defined {n} times")
    for cid in mods_data:
        if cid not in ids:
            warn(MODS_JSON, f"category '{cid}' is in modsData but not listed in constants.json categories")


def check_recent(mods_json, validator):
    recent = mods_json.get("recentlyAddedMods")
    if recent is None:
        return
    if not isinstance(recent, list):
        err(MODS_JSON, "'recentlyAddedMods' must be a list")
        return
    for entry in recent:
        if not isinstance(entry, dict):
            err(MODS_JSON, f"recentlyAddedMods: entry is not an object: {entry!r}")
            continue
        name, cat = entry.get("name"), entry.get("category")
        if name not in validator.names.get(cat, {}):
            warn(MODS_JSON, f"recentlyAddedMods: {name!r} not found in category {cat!r}")


def emit(level, file, msg):
    if IN_ACTIONS:
        text = msg.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::{level} file={file}::{text}")
    else:
        print(f"[{level.upper()}] {file}: {msg}")


def write_summary(stats):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    errors = [i for i in issues if i[0] == "error"]
    warnings = [i for i in issues if i[0] == "warning"]
    lines = ["## Data validation", "", " | ".join(f"**{k}:** {v}" for k, v in stats.items()), ""]
    for title, items in (("Errors", errors), ("Warnings", warnings)):
        lines.append(f"### {title} ({len(items)})")
        if not items:
            lines += ["None", ""]
            continue
        lines += ["| File | Message |", "|---|---|"]
        for _, f, m in items[:MAX_SUMMARY_ROWS]:
            cell = m.replace("|", "\\|")
            lines.append(f"| `{f}` | {cell} |")
        if len(items) > MAX_SUMMARY_ROWS:
            lines.append(f"| | ...and {len(items) - MAX_SUMMARY_ROWS} more (see the job log) |")
        lines.append("")
    with open(path, "a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    if not os.path.isdir(DATA_DIR):
        print(f"::error::{DATA_DIR} not found - run from the repository root", file=sys.stderr)
        return 1
    for name in sorted(os.listdir(DATA_DIR)):
        if name.endswith(".json"):
            load_json(f"{DATA_DIR}/{name}")

    mods_json = load_json(MODS_JSON)
    constants = load_json(CONSTANTS_JSON)
    guides = load_json(GUIDES_JSON)
    announcements = load_json(ANNOUNCEMENTS_JSON)

    if announcements is not None and not isinstance(announcements, list):
        err(ANNOUNCEMENTS_JSON, "must be a list")

    if not isinstance(mods_json, dict) or not isinstance(mods_json.get("modsData"), dict):
        err(MODS_JSON, "missing or no 'modsData' object")
        mods_data, validator = {}, None
    else:
        mods_data = mods_json["modsData"]
        try:
            files_index = PathIndex(tree_paths(FILES_PREFIX))
            previews_index = PathIndex(tree_paths(PREVIEWS_PREFIX))
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            detail = getattr(e, "stderr", b"") or b""
            print(f"::error::cannot read the git tree at {REF}: {e} {detail.decode(errors='replace')}", file=sys.stderr)
            return 1

        validator = Validator(files_index, previews_index, guides)
        for category, content in mods_data.items():
            validator.check_category(category, content)
        validator.check_duplicates()
        validator.check_packs()
        check_recent(mods_json, validator)

        orphans = sorted(
            p
            for p in files_index.exact - validator.referenced_files
            if not os.path.basename(p).startswith(".")
        )
        if orphans:
            shown = ", ".join(o[len(FILES_PREFIX):] for o in orphans[:MAX_LISTED])
            more = f" ...and {len(orphans) - MAX_LISTED} more" if len(orphans) > MAX_LISTED else ""
            warn(MODS_JSON, f"{len(orphans)} file(s) in assets/files are not referenced by any mod: {shown}{more}")

    check_constants(constants, mods_data, guides)

    for level, file, msg in issues:
        emit(level, file, msg)

    n_err = sum(1 for i in issues if i[0] == "error")
    n_warn = sum(1 for i in issues if i[0] == "warning")
    stats = {
        "categories": len(mods_data),
        "mods": validator.mod_count if validator else 0,
        "errors": n_err,
        "warnings": n_warn,
    }
    write_summary(stats)
    print(f"\nChecked {stats['categories']} categories, {stats['mods']} mods: {n_err} error(s), {n_warn} warning(s)")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main())
