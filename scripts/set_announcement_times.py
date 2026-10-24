import json
import sys
import time
from pathlib import Path

DATA_FILE = Path("assets/data/announcements.json")


def is_empty(value):
    return value is None or value == ""


def main():
    if not DATA_FILE.exists():
        print(f"{DATA_FILE} not found, skipping.")
        return

    with DATA_FILE.open("r", encoding="utf-8") as f:
        try:
            announcements = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Failed to parse {DATA_FILE}: {e}", file=sys.stderr)
            sys.exit(1)

    if not isinstance(announcements, list):
        print(f"{DATA_FILE} does not contain a list, skipping.")
        return

    now = int(time.time())
    changed = False

    for note in announcements:
        if isinstance(note, dict) and is_empty(note.get("time")):
            note["time"] = now
            changed = True
            preview = str(note.get("text", ""))[:60]
            print(f"Stamped announcement with time={now}: {preview!r}")

    if not changed:
        print("No empty announcement times found, nothing to do.")
        return

    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(announcements, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Updated {DATA_FILE}")


if __name__ == "__main__":
    main()
