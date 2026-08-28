#!/bin/bash

# source: https://discord.com/channels/984169062735151174/1416473114082279424/1416473114082279424
# author: https://github.com/DotaModdingCommunity

source="tree.vmdl_c"
names_file="names.txt"

if [ ! -f "$names_file" ]; then
    echo "Error: $names_file not found in the current directory."
    exit 1
fi

if [ ! -f "$source" ]; then
    echo "Error: $source not found."
    exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue

    dest_dir=$(dirname "$line")
    echo "Processing: $line"

    if [ "$dest_dir" != "." ] && [ ! -d "$dest_dir" ]; then
        echo "  [FOLDER] Creating directory: $dest_dir"
        mkdir -p "$dest_dir"
        if [ $? -ne 0 ]; then
            echo "  [ERROR] Failed to create directory: $dest_dir"
            echo ""
            continue
        fi
    fi

    cp "$source" "${line}.vmdl_c" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "  [FAIL] Could not copy to: ${line}.vmdl_c"
    else
        echo "  [SUCCESS] Copied and renamed to: ${line}.vmdl_c"
    fi
    echo ""
done < "$names_file"

echo "Done."
read -p "Press Enter to continue..."