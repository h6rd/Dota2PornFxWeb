from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
MODS_JSON = (REPO_ROOT / "assets" / "data" / "mods.json").resolve()
FILES_DIR = (REPO_ROOT / "assets" / "files").resolve()

FILE_KEYS = ("file", "fileWin", "fileLinux")
CHUNK_SIZE = 1024 * 1024
INVALID_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


class ConversionError(RuntimeError):
    pass


@dataclass
class Reference:
    category: str
    category_dir: Path
    entry: dict[str, Any]
    key: str
    value: str
    source: Path
    mod_name: str
    style_label: Optional[str]


@dataclass
class Job:
    category: str
    source: Path
    target: Path
    refs: list[Reference] = field(default_factory=list)
    names: list[str] = field(default_factory=list)
    styles: list[Optional[str]] = field(default_factory=list)


def iter_mods(category: str, content: Any) -> Iterable[dict[str, Any]]:
    """Yield mod entries from either a flat category or a grouped category."""
    if isinstance(content, list):
        for mod in content:
            if isinstance(mod, dict):
                yield mod
        return

    if isinstance(content, dict) and isinstance(content.get("groups"), list):
        for group in content["groups"]:
            if not isinstance(group, dict):
                continue
            for mod in group.get("mods") or []:
                if isinstance(mod, dict):
                    yield mod


def is_local_vpk(value: Any) -> bool:
    return (
        isinstance(value, str)
        and value.lower().endswith(".vpk")
        and "://" not in value
    )


def safe_zip_stem(name: str) -> str:
    """Keep the mod name readable while making it safe on Windows/macOS/Linux."""
    cleaned = INVALID_FILENAME_CHARS.sub("_", name).strip().rstrip(". ")
    return cleaned or "mod"


def style_stem(mod_name: str, label: Optional[str]) -> str:
    if label:
        return safe_zip_stem(f"{mod_name} - {label}")
    return safe_zip_stem(mod_name)


def resolve_source(category: str, category_dir: Path, value: str) -> Path:
    relative = Path(value)
    if relative.is_absolute() or ".." in relative.parts:
        raise ConversionError(
            f"[{category}] {value!r} must be a path inside its category folder"
        )

    source = (category_dir / relative).resolve()
    try:
        source.relative_to(category_dir.resolve())
    except ValueError as exc:
        raise ConversionError(
            f"[{category}] {value!r} resolves outside its category folder"
        ) from exc
    return source


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(CHUNK_SIZE)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def sha256_stream(handle: Any) -> str:
    digest = hashlib.sha256()
    while True:
        chunk = handle.read(CHUNK_SIZE)
        if not chunk:
            break
        digest.update(chunk)
    return digest.hexdigest()


def archive_matches_source(archive: Path, source: Path) -> bool:
    """Return True when archive is a valid single-entry copy of source."""
    if not archive.is_file():
        return False
    try:
        with zipfile.ZipFile(archive) as zf:
            infos = zf.infolist()
            if len(infos) != 1 or infos[0].filename != source.name:
                return False
            if infos[0].file_size != source.stat().st_size:
                return False
            if zf.testzip() is not None:
                return False
            with zf.open(infos[0]) as packed:
                return sha256_stream(packed) == sha256_file(source)
    except (OSError, zipfile.BadZipFile):
        return False


def verify_archive(archive: Path, source: Path) -> str:
    """Verify a freshly written ZIP and return the source SHA-256."""
    try:
        with zipfile.ZipFile(archive) as zf:
            bad_member = zf.testzip()
            if bad_member is not None:
                raise ConversionError(f"CRC check failed for archive member {bad_member!r}")

            infos = zf.infolist()
            if len(infos) != 1:
                raise ConversionError(
                    f"expected exactly one archive member, found {len(infos)}"
                )

            info = infos[0]
            if info.filename != source.name:
                raise ConversionError(
                    f"archive member is {info.filename!r}, expected {source.name!r}"
                )
            if info.file_size != source.stat().st_size:
                raise ConversionError("archive member size does not match the source")

            source_hash = sha256_file(source)
            with zf.open(info) as packed:
                packed_hash = sha256_stream(packed)
            if packed_hash != source_hash:
                raise ConversionError(
                    "archive member SHA-256 does not match the source file"
                )
            return source_hash
    except zipfile.BadZipFile as exc:
        raise ConversionError(f"cannot read archive: {exc}") from exc


def build_archive(source: Path, target: Path, force: bool) -> tuple[str, bool]:
    """Create and verify target.  Return (sha256, reused_existing)."""
    if target.exists():
        if archive_matches_source(target, source):
            return sha256_file(source), True
        if not force:
            raise ConversionError(
                f"{target} already exists and does not match {source}; "
                "rerun with --force to replace it"
            )

    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(
        prefix=f".{target.name}.", suffix=".tmp", dir=target.parent
    )
    os.close(fd)
    temp_path = Path(temp_name)

    try:
        with zipfile.ZipFile(
            temp_path,
            "w",
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=9,
            allowZip64=True,
        ) as zf:
            zf.write(source, arcname=source.name)

        digest = verify_archive(temp_path, source)
        os.chmod(temp_path, source.stat().st_mode & 0o777)
        os.replace(temp_path, target)
        return digest, False
    except Exception:
        try:
            temp_path.unlink()
        except FileNotFoundError:
            pass
        raise


def collect_references(mods_data: dict[str, Any]) -> list[Reference]:
    refs: list[Reference] = []

    for category, content in mods_data.items():
        if not isinstance(category, str):
            continue
        category_dir = FILES_DIR / category

        for mod in iter_mods(category, content):
            mod_name = mod.get("name")
            if not isinstance(mod_name, str) or not mod_name.strip():
                continue
            mod_name = mod_name.strip()

            for key in FILE_KEYS:
                value = mod.get(key)
                if not is_local_vpk(value):
                    continue
                refs.append(
                    Reference(
                        category=category,
                        category_dir=category_dir,
                        entry=mod,
                        key=key,
                        value=value,
                        source=resolve_source(category, category_dir, value),
                        mod_name=mod_name,
                        style_label=None,
                    )
                )

            styles = mod.get("styles")
            if not isinstance(styles, list):
                continue
            for style in styles:
                if not isinstance(style, dict):
                    continue
                label = style.get("label")
                if not isinstance(label, str):
                    label = None
                for key in FILE_KEYS:
                    value = style.get(key)
                    if not is_local_vpk(value):
                        continue
                    refs.append(
                        Reference(
                            category=category,
                            category_dir=category_dir,
                            entry=style,
                            key=key,
                            value=value,
                            source=resolve_source(category, category_dir, value),
                            mod_name=mod_name,
                            style_label=label,
                        )
                    )

    return refs


def all_vpk_sources() -> list[Path]:
    if not FILES_DIR.is_dir():
        raise ConversionError(f"{FILES_DIR} does not exist")
    return sorted(
        path.resolve()
        for path in FILES_DIR.rglob("*")
        if path.is_file() and path.suffix.lower() == ".vpk"
    )


def plan_jobs(refs: list[Reference]) -> list[Job]:
    grouped: dict[Path, list[Reference]] = {}
    for ref in refs:
        grouped.setdefault(ref.source, []).append(ref)

    ordered_sources = list(grouped)
    seen = set(ordered_sources)
    for source in all_vpk_sources():
        if source not in seen:
            ordered_sources.append(source)
            seen.add(source)

    jobs: list[Job] = []
    for source in ordered_sources:
        source_refs = grouped.get(source, [])

        if source_refs:
            first = source_refs[0]
            if first.style_label is None:
                stem = safe_zip_stem(first.mod_name)
            else:
                stem = style_stem(first.mod_name, first.style_label)
        else:
            stem = safe_zip_stem(source.stem)

        job = Job(
            category=(
                source_refs[0].category
                if source_refs
                else source.parent.relative_to(FILES_DIR).as_posix()
            ),
            source=source,
            target=source.parent / f"{stem}.zip",
            refs=source_refs,
        )

        for ref in source_refs:
            if ref.mod_name not in job.names:
                job.names.append(ref.mod_name)
            if ref.style_label not in job.styles:
                job.styles.append(ref.style_label)

        jobs.append(job)

    targets: dict[Path, Path] = {}
    for job in jobs:
        previous = targets.get(job.target)
        if previous is not None and previous != job.source:
            raise ConversionError(
                f"both {previous.relative_to(FILES_DIR)} and "
                f"{job.source.relative_to(FILES_DIR)} would map to "
                f"{job.target.relative_to(FILES_DIR)}"
            )
        targets[job.target] = job.source

    return jobs


def update_references(jobs: list[Job]) -> int:
    updated = 0
    for job in jobs:
        for ref in job.refs:
            try:
                relative_target = job.target.relative_to(ref.category_dir.resolve())
            except ValueError as exc:
                raise ConversionError(
                    f"cannot express {job.target} relative to {ref.category_dir}"
                ) from exc
            new_value = relative_target.as_posix()
            if ref.entry.get(ref.key) != new_value:
                ref.entry[ref.key] = new_value
                updated += 1
    return updated


def write_json_atomic(path: Path, data: Any) -> None:
    text = json.dumps(data, ensure_ascii=False, indent=2)
    fd, temp_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
        os.chmod(temp_name, path.stat().st_mode & 0o777)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def describe(job: Job) -> str:
    source = job.source.relative_to(FILES_DIR).as_posix()
    details: list[str] = []
    if job.names:
        details.append("name: " + ", ".join(repr(name) for name in job.names))
    else:
        details.append("name: <unreferenced>")
    labels = [label for label in job.styles if label]
    if labels:
        details.append("style: " + ", ".join(repr(label) for label in labels))
    return f"[{job.category}] {job.target.name} <- {source} ({'; '.join(details)})"


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Compress .vpk files into ZIP archives, verify them, and update "
            "assets/data/mods.json."
        )
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="show what would be done without writing or deleting anything",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="replace an existing ZIP that does not match the source .vpk",
    )
    args = parser.parse_args(argv)

    if not MODS_JSON.is_file():
        print(f"error: {MODS_JSON} not found", file=sys.stderr)
        return 1

    try:
        with MODS_JSON.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"error: cannot read {MODS_JSON}: {exc}", file=sys.stderr)
        return 1

    mods_data = data.get("modsData") if isinstance(data, dict) else None
    if not isinstance(mods_data, dict):
        print(f"error: {MODS_JSON} has no 'modsData' object", file=sys.stderr)
        return 1

    try:
        refs = collect_references(mods_data)
        jobs = plan_jobs(refs)

        missing = [
            ref
            for ref in refs
            if not ref.source.is_file()
        ]
        if missing:
            for ref in missing[:20]:
                print(
                    f"error: [{ref.category}] {ref.value!r} not found "
                    f"({ref.source.relative_to(FILES_DIR)})",
                    file=sys.stderr,
                )
            if len(missing) > 20:
                print(f"error: ...and {len(missing) - 20} more missing files", file=sys.stderr)
            return 1
    except (ConversionError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.dry_run:
        print(f"Dry run: {len(jobs)} .vpk file(s) would be converted")
        for job in jobs:
            print(f"[dry-run] {describe(job)}")
        updated = sum(
            1
            for job in jobs
            for ref in job.refs
            if ref.entry.get(ref.key)
            != job.target.relative_to(ref.category_dir.resolve()).as_posix()
        )
        print(
            f"Dry run: {updated} mods.json reference(s) would be updated; "
            f"{len(jobs)} original .vpk file(s) would be removed"
        )
        return 0

    converted = 0
    reused = 0
    try:
        for job in jobs:
            digest, was_reused = build_archive(job.source, job.target, args.force)
            converted += 1
            reused += int(was_reused)
            suffix = " [existing archive verified]" if was_reused else ""
            print(f"{describe(job)} sha256={digest}{suffix}", flush=True)

        updated = update_references(jobs)
        if updated:
            write_json_atomic(MODS_JSON, data)
    except (ConversionError, OSError, zipfile.BadZipFile) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    removed = 0
    try:
        for job in jobs:
            if job.source.is_file():
                job.source.unlink()
                removed += 1
    except OSError as exc:
        print(f"error: could not remove source .vpk: {exc}", file=sys.stderr)
        return 1

    print(
        f"Converted {converted} .vpk file(s) to ZIP "
        f"({reused} already matched); updated {updated} mods.json reference(s); "
        f"removed {removed} original .vpk file(s)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
