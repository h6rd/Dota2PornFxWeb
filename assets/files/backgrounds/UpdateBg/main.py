import os
import shutil
from pathlib import Path
import vpk

def unpack_vpk(vpk_path, extract_dir):
    try:
        pak = vpk.open(str(vpk_path))

        for filepath in pak:
            file_data = pak.get_file(filepath)
            output_path = extract_dir / filepath

            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'wb') as f:
                f.write(file_data.read())
        
        return True
    except Exception as e:
        print(f"   ❌ Error unpacking VPK: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_vpk_from_dir(source_dir, output_vpk_path):
    try:
        print(f"   Building VPK structure...")
        newpak = vpk.new(str(output_vpk_path))
        newpak.read_dir(str(source_dir))
        newpak.save(str(output_vpk_path))
        return True
    except Exception as e:
        print(f"   ❌ Error creating VPK: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_vpk_file(vpk_path, new_panorama_path, output_dir, temp_dir):
    vpk_name = vpk_path.stem

    if vpk_name.endswith('_dir'):
        base_name = vpk_name
    else:
        base_name = vpk_name + '_dir'
    
    print(f"Processing '{vpk_path.name}'...")

    extract_dir = temp_dir / base_name
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        print(f"   Unpacking VPK...")
        if not unpack_vpk(vpk_path, extract_dir):
            return False

        panorama_dir = extract_dir / "panorama"
        if panorama_dir.exists():
            print(f"   Removing old panorama folder...")
            shutil.rmtree(panorama_dir)
        else:
            print(f"   ⚠️  No existing panorama folder found")

        print(f"   Adding new panorama folder...")
        shutil.copytree(new_panorama_path, panorama_dir)

        output_vpk_path = output_dir / f"{base_name}.vpk"

        print(f"   Repacking to {output_vpk_path.name}...")
        if not create_vpk_from_dir(extract_dir, output_vpk_path):
            return False
        
        print(f"✅ Completed '{vpk_path.name}'")
        return True
        
    except Exception as e:
        print(f"   ❌ Error processing VPK: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if extract_dir.exists():
            shutil.rmtree(extract_dir)


def main():
    script_dir = Path(__file__).parent
    input_dir = script_dir / "input"
    output_dir = script_dir / "output"
    panorama_dir = script_dir / "panorama"
    temp_dir = script_dir / "temp"

    output_dir.mkdir(exist_ok=True)
    temp_dir.mkdir(exist_ok=True)

    if not input_dir.exists():
        print(f"❌ Error: Input directory not found: {input_dir}")
        print("Please create an 'input' folder next to the script with your VPK files.")
        return

    if not panorama_dir.exists():
        print(f"❌ Error: Panorama directory not found: {panorama_dir}")
        print("Please create a 'panorama' folder next to the script with the new panorama content.")
        return

    vpk_files = list(input_dir.glob("*.vpk"))
    
    if not vpk_files:
        print(f"❌ No VPK files found in {input_dir}")
        return

    vpk_files.sort()
    
    print(f"VPK Panorama Updater")
    print(f"Found {len(vpk_files)} VPK file(s)")
    print(f"New panorama source: {panorama_dir}\n")

    processed = 0
    for vpk_file in vpk_files:
        if process_vpk_file(vpk_file, panorama_dir, output_dir, temp_dir):
            processed += 1
        print()

    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    
    print(f"Processing complete!")
    print(f"Successfully processed {processed}/{len(vpk_files)} VPK file(s)")
    print(f"Output location: {output_dir}")


if __name__ == "__main__":
    main()