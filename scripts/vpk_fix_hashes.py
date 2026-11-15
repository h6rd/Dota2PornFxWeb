import hashlib
import os
import shutil
import struct
import sys
import tempfile
import zipfile

VPK_SIG = 0x55AA1234


def fix_vpk(path):
    with open(path, "rb") as f:
        data = bytearray(f.read())

    sig, ver = struct.unpack_from("<II", data, 0)
    if sig != VPK_SIG or ver != 2:
        print(f"  [skip] {os.path.basename(path)}: no VPK v2")
        return False

    tree, filedata, arch_md5, other_md5, signature = struct.unpack_from("<5I", data, 8)
    if other_md5 == 48:
        print(f"  [ok] {os.path.basename(path)}: already fixed")
        return False
    if other_md5 != 0 or arch_md5 != 0 or signature != 0:
        print(f"  [skip] {os.path.basename(path)}: non-standard sections - skip")
        return False

    tree_start = 28
    tree_md5 = hashlib.md5(data[tree_start:tree_start + tree]).digest()
    arch_sec_md5 = hashlib.md5(b"").digest()

    struct.pack_into("<I", data, 20, 48)
    body = bytes(data) + tree_md5 + arch_sec_md5
    whole_md5 = hashlib.md5(body).digest()
    result = body + whole_md5

    shutil.copy2(path, path + ".bak2")
    with open(path, "wb") as f:
        f.write(result)
    print(f"  [fixed] {os.path.basename(path)}")
    return True


def fix_zip(path):
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(path) as z:
            infos = z.infolist()
            z.extractall(tmp)
        changed = False
        for root, _, fs in os.walk(tmp):
            for fn in fs:
                if fn.lower().endswith(".vpk"):
                    p = os.path.join(root, fn)
                    if fix_vpk(p):
                        changed = True
                        os.remove(p + ".bak2")
        if not changed:
            return False
        shutil.copy2(path, path + ".bak2")
        new = path + ".tmp"
        with zipfile.ZipFile(new, "w", zipfile.ZIP_DEFLATED) as z:
            for i in infos:
                if i.is_dir():
                    continue
                z.write(os.path.join(tmp, i.filename), i.filename)
        os.replace(new, path)
        print(f"  [fixed zip] {os.path.basename(path)}")
    return True


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    files = sys.argv[1:] or [
        os.path.join(here, f) for f in sorted(os.listdir(here))
        if f.lower().endswith((".vpk", ".zip"))
    ]
    for p in files:
        print(f"== {p}")
        if p.lower().endswith(".zip"):
            fix_zip(p)
        elif p.lower().endswith(".vpk"):
            fix_vpk(p)
    print("Done.")


if __name__ == "__main__":
    main()