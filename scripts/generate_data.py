import sys
import os
import json
import gzip
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor

# Force UTF-8 for console output to handle Cyrillic filenames
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

PREVIEWS_DIR = os.path.join('assets', 'previews')
DATA_DIR = os.path.join('assets', 'data')
OUTPUT_DIR = 'compressed'
OUTPUT_PREVIEWS_DIR = os.path.join(OUTPUT_DIR, 'previews')
OUTPUT_DATA_DIR = os.path.join(OUTPUT_DIR, 'data')

def process_image(src_path, dst_path):
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        
        # Run ImageMagick
        try:
            result = subprocess.run(
                ['magick', src_path, '-quality', '80', '-strip', dst_path],
                capture_output=True,
                text=True
            )
        except FileNotFoundError:
            # Fallback to 'convert' if 'magick' is not available
            result = subprocess.run(
                ['convert', src_path, '-quality', '80', '-strip', dst_path],
                capture_output=True,
                text=True
            )
        
        # Check if either 'magick' or 'convert' succeeded
        if result.returncode == 0:
            print(f"Processed: {dst_path}")
            return True
        else:
            print(f"Failed to process {src_path}: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error processing {src_path}: {e}")
        return False

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
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(OUTPUT_PREVIEWS_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DATA_DIR, exist_ok=True)

    success = True

    # 1. Compress JSON files
    if os.path.exists(DATA_DIR):
        for filename in os.listdir(DATA_DIR):
            if filename.endswith('.json'):
                src_path = os.path.join(DATA_DIR, filename)
                dst_path = os.path.join(OUTPUT_DATA_DIR, f"{filename}.gz")
                if not compress_json(src_path, dst_path):
                    success = False

    # 1.5 Copy favicon.ico to compressed folder as fallback
    favicon_src = os.path.join('assets', 'favicon.ico')
    favicon_dst = os.path.join(OUTPUT_DIR, 'favicon.ico')
    if os.path.exists(favicon_src):
        try:
            shutil.copy2(favicon_src, favicon_dst)
            print(f"Copied fallback icon to: {favicon_dst}")
        except Exception as e:
            print(f"Error copying favicon: {e}")
            success = False

    # 2. Convert WebP images to compressed JPG
    image_tasks = []
    if os.path.exists(PREVIEWS_DIR):
        for root, _, files in os.walk(PREVIEWS_DIR):
            for filename in files:
                if filename.lower().endswith('.webp'):
                    src_path = os.path.join(root, filename)
                    
                    # Compute relative path to recreate directory structure
                    rel_path = os.path.relpath(src_path, PREVIEWS_DIR)
                    
                    # Change extension to .jpg
                    rel_dst_path = os.path.splitext(rel_path)[0] + '.jpg'
                    dst_path = os.path.join(OUTPUT_PREVIEWS_DIR, rel_dst_path)
                    
                    image_tasks.append((src_path, dst_path))

    # Process images concurrently with 5 workers
    if image_tasks:
        print(f"Found {len(image_tasks)} webp images to process. Starting thread pool...")
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_image, src, dst) for src, dst in image_tasks]
            
            for future in futures:
                if not future.result():
                    success = False

    if success:
        print("Data generation and compression complete!")
    else:
        print("Data generation finished with errors.")
        sys.exit(1)

if __name__ == '__main__':
    main()
