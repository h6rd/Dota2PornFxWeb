import sys
import os
import gzip
import shutil

# Force UTF-8 for console output to handle Cyrillic filenames
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join('assets', 'data')
OUTPUT_DIR = 'compressed'
OUTPUT_DATA_DIR = os.path.join(OUTPUT_DIR, 'data')


def compress_json(src_path, dst_path):
    try:
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        with open(src_path, 'rb') as f_in:
            with gzip.open(dst_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        print(f"Compressed: {dst_path}")
        return True
    except Exception as e:
        print(f"Error compressing {src_path}: {e}")
        return False

def main():
    os.makedirs(OUTPUT_DATA_DIR, exist_ok=True)

    success = True

    # Compress JSON files
    if os.path.exists(DATA_DIR):
        for filename in os.listdir(DATA_DIR):
            if filename.endswith('.json'):
                src_path = os.path.join(DATA_DIR, filename)
                dst_path = os.path.join(OUTPUT_DATA_DIR, f"{filename}.gz")
                if not compress_json(src_path, dst_path):
                    success = False

    if success:
        print("Data generation and compression complete!")
    else:
        print("Data generation finished with errors.")
        sys.exit(1)

if __name__ == '__main__':
    main()
