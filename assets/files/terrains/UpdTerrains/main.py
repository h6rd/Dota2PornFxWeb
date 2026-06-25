import sys
import gc
import shutil
import zipfile
import logging
from pathlib import Path
import vpk

MAPS_DIR = Path(r"C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\dota\maps")
GUIDE_FILE = Path(__file__).parent / "Guide.txt"
OUTPUT_DIR = Path(__file__).parent / "output"
WORK_DIR   = Path(__file__).parent / "_work"
VPK_TO_ZIP: dict[str, str] = {
    "dota_autumn.vpk":    "Autumn.zip",
    "dota_cavern.vpk":    "TI8 Emerald Abyss.zip",
    "dota_coloseum.vpk":  "TI6 Immortal Gardens.zip",
    "dota_crownfall.vpk": "Crownfall.zip",
    "dota_desert.vpk":    "Desert.zip",
    "dota_journey.vpk":   "The Kings New Journey.zip",
    "dota_jungle.vpk":    "TI9 Overgrown Empire.zip",
    "dota_reef.vpk":      "TI7 Reefs Edge.zip",
    "dota_spring.vpk":    "Spring.zip",
    "dota_summer.vpk":    "Summer.zip",
    "dota_ti10.vpk":      "TI10 Sanctum of the Divine.zip",
    "dota_winter.vpk":    "Winter.zip",
}


logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


def check_prerequisites() -> None:
    errors: list[str] = []

    if not MAPS_DIR.exists():
        errors.append(f"Maps folder not found: {MAPS_DIR}")
    elif not (MAPS_DIR / "dota.vpk").exists():
        errors.append(f"Base VPK not found: {MAPS_DIR / 'dota.vpk'}")

    if not GUIDE_FILE.exists():
        errors.append(f"Guide.txt not found: {GUIDE_FILE}")

    if errors:
        for msg in errors:
            log.error(msg)
        sys.exit(1)

    log.info("All required files found.")


def extract_vpk(vpk_path: Path, dest_dir: Path) -> int:
    dest_dir.mkdir(parents=True, exist_ok=True)

    dir_variant = vpk_path.parent / (vpk_path.stem + "_dir.vpk")
    target = dir_variant if dir_variant.exists() else vpk_path

    log.info("  Extracting: %s", target.name)

    count = 0
    pak = vpk.open(str(target))
    for file_path in pak:
        try:
            entry = pak.get_file(file_path)
            out = dest_dir / file_path
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(entry.read())
            count += 1
        except Exception as exc:
            log.warning("    Skipped %s: %s", file_path, exc)

    gc.collect()
    log.info("  Extracted %d files from %s", count, target.name)
    return count


def build_vpk(source_dir: Path, output_vpk: Path) -> None:
    log.info("  Building VPK from: %s", source_dir.name)
    output_vpk.parent.mkdir(parents=True, exist_ok=True)

    new_pak = vpk.new(str(output_vpk))
    new_pak.read_dir(str(source_dir))
    new_pak.save(str(output_vpk))

    size_mb = output_vpk.stat().st_size / 1_048_576
    log.info("  VPK saved: %s (%.1f MB)", output_vpk.name, size_mb)


def create_zip(zip_path: Path, dota_vpk: Path, guide_src: Path) -> None:
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    log.info("  Creating archive: %s", zip_path.name)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(dota_vpk, arcname="maps/dota.vpk")
        zf.write(guide_src, arcname="Guide.txt")

    log.info("  Archive ready: %s (%.1f MB)",
             zip_path.name, zip_path.stat().st_size / 1_048_576)


def process_mod(custom_vpk_name: str, zip_name: str, base_dir: Path) -> None:
    custom_vpk_path = MAPS_DIR / custom_vpk_name
    if not custom_vpk_path.exists():
        log.warning("Skipping (not found): %s", custom_vpk_name)
        return

    mod_name = Path(zip_name).stem
    mod_work = WORK_DIR / mod_name / "content"
    maps_out = WORK_DIR / mod_name / "maps"

    log.info("")
    log.info("Processing: %s -> %s", custom_vpk_name, zip_name)

    log.info("  Copying base content...")
    shutil.copytree(str(base_dir), str(mod_work), dirs_exist_ok=True)

    extract_vpk(custom_vpk_path, mod_work)

    maps_out.mkdir(parents=True, exist_ok=True)
    build_vpk(mod_work, maps_out / "dota.vpk")

    create_zip(OUTPUT_DIR / zip_name, maps_out / "dota.vpk", GUIDE_FILE)


def main() -> None:
    check_prerequisites()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    log.info("\nExtracting base dota.vpk")
    base_dir = WORK_DIR / "_base"
    extract_vpk(MAPS_DIR / "dota.vpk", base_dir)

    log.info("\nProcessing %d terrains", len(VPK_TO_ZIP))

    success: list[str] = []
    failed:  list[str] = []

    for vpk_name, zip_name in VPK_TO_ZIP.items():
        try:
            process_mod(vpk_name, zip_name, base_dir)
            success.append(zip_name)
        except Exception as exc:
            log.error("Error processing %s: %s", vpk_name, exc, exc_info=True)
            failed.append(vpk_name)

    log.info("\nCleaning up")
    try:
        shutil.rmtree(WORK_DIR)
        log.info("  Removed: %s", WORK_DIR)
    except Exception as exc:
        log.warning("Could not remove work folder: %s", exc)

    log.info("\nDone")
    log.info("  Success: %d", len(success))
    for name in success:
        log.info("    %s", name)
    if failed:
        log.warning("  Failed: %d", len(failed))
        for name in failed:
            log.warning("    %s", name)


if __name__ == "__main__":
    main()