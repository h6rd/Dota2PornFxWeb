import argparse
import os
import shutil
import struct
import sys
import tempfile
import zipfile
import zlib

VPK_SIG = 0x55AA1234
EMBEDDED = 0x7FFF
DEFAULT_TEMPLATE = "dire_tree004.vmdl_c"


class Entry:
    __slots__ = ("ext", "dir", "name", "crc", "preload", "arch", "offset", "length")

    @property
    def path(self):
        d = "" if self.dir in ("", " ") else self.dir + "/"
        return f"{d}{self.name}.{self.ext}" if self.ext.strip() else f"{d}{self.name}"


def _cstr(f):
    out = bytearray()
    while True:
        b = f.read(1)
        if not b:
            raise EOFError("Unexpected end of VPK")
        if b == b"\0":
            return out.decode("utf-8", "replace")
        out += b


class VPK:
    def __init__(self, path):
        self.path = os.path.abspath(path)
        self.entries = []
        self._parse()

    def _parse(self):
        with open(self.path, "rb") as f:
            sig, ver = struct.unpack("<II", f.read(8))
            if sig != VPK_SIG:
                raise ValueError(f"{self.path}: not a VPK file")
            if ver == 1:
                (tree_size,) = struct.unpack("<I", f.read(4))
                self.header_size = 12
            elif ver == 2:
                tree_size, *_ = struct.unpack("<5I", f.read(20))
                self.header_size = 28
            else:
                raise ValueError(f"Unsupported VPK version: {ver}")
            self.version = ver
            self.tree_size = tree_size

            while True:
                ext = _cstr(f)
                if ext == "":
                    break
                while True:
                    d = _cstr(f)
                    if d == "":
                        break
                    while True:
                        name = _cstr(f)
                        if name == "":
                            break
                        e = Entry()
                        e.ext, e.dir, e.name = ext, d, name
                        e.crc, pre, e.arch, e.offset, e.length, term = struct.unpack("<IHHIIH", f.read(18))
                        e.preload = f.read(pre)
                        self.entries.append(e)

    def _archive_path(self, idx):
        base = self.path
        if base.endswith("_dir.vpk"):
            base = base[:-8]
        else:
            base = base[:-4]
        return f"{base}_{idx:03d}.vpk"

    def read(self, e):
        if e.length == 0:
            return e.preload
        if e.arch == EMBEDDED:
            p, base = self.path, self.header_size + self.tree_size
        else:
            p, base = self._archive_path(e.arch), 0
        with open(p, "rb") as f:
            f.seek(base + e.offset)
            return e.preload + f.read(e.length)

    def archive_files(self):
        files = {e.arch for e in self.entries if e.arch != EMBEDDED and e.length}
        return [self._archive_path(i) for i in sorted(files)]


def write_vpk(out_path, files):
    tree = {}
    for path, data in sorted(files.items()):
        path = path.replace("\\", "/")
        d, _, fname = path.rpartition("/")
        name, dot, ext = fname.rpartition(".")
        if not dot:
            name, ext = fname, " "
        d = d or " "
        tree.setdefault(ext, {}).setdefault(d, []).append((name, data))

    tb = bytearray()
    blobs = []
    offset = 0
    for ext, dirs in tree.items():
        tb += ext.encode() + b"\0"
        for d, items in dirs.items():
            tb += d.encode() + b"\0"
            for name, data in items:
                tb += name.encode() + b"\0"
                tb += struct.pack("<IHHIIH", zlib.crc32(data) & 0xFFFFFFFF, 0, EMBEDDED, offset, len(data), 0xFFFF)
                blobs.append(data)
                offset += len(data)
            tb += b"\0"
        tb += b"\0"
    tb += b"\0"

    with open(out_path, "wb") as f:
        f.write(struct.pack("<7I", VPK_SIG, 2, len(tb), offset, 0, 0, 0))
        f.write(tb)
        for data in blobs:
            f.write(data)


def verify_vpk(path, expected):
    vpk = VPK(path)
    found = {e.path: e for e in vpk.entries}
    if set(found) != set(expected):
        raise ValueError("file list mismatch after writing")
    for p, e in found.items():
        data = vpk.read(e)
        if data != expected[p] or (zlib.crc32(data) & 0xFFFFFFFF) != e.crc:
            raise ValueError(f"data mismatch for {p}")


def load_names(txt):
    out = []
    with open(txt, encoding="utf-8-sig") as f:
        for line in f:
            s = line.strip().replace("\\", "/").strip("/")
            if not s or s.startswith("#"):
                continue
            if not s.lower().endswith(".vmdl_c"):
                s += ".vmdl_c"
            out.append(s)
    return out


def process_vpk(vpk_path, names, template):
    vpk = VPK(vpk_path)
    by_path = {e.path: e for e in vpk.entries}

    key = (template or DEFAULT_TEMPLATE).replace("\\", "/")
    if not key.endswith(".vmdl_c"):
        key += ".vmdl_c"
    src = by_path.get(key)
    if not src:
        base = key.rsplit("/", 1)[-1]
        src = next((e for e in vpk.entries if e.path.rsplit("/", 1)[-1] == base), None)
    if not src:
        print(f"  [skip] {os.path.basename(vpk_path)} has no {key}")
        return False
    print(f"  template: {src.path}")
    template_data = vpk.read(src)

    files = {e.path: vpk.read(e) for e in vpk.entries}
    added = 0
    for n in names:
        if n not in files:
            added += 1
        files[n] = template_data
    print(f"  added/replaced: {len(names)} (new: {added})")

    tmp = vpk_path + ".tmp"
    write_vpk(tmp, files)
    try:
        verify_vpk(tmp, files)
    except Exception as ex:
        os.remove(tmp)
        print(f"  [error] verification failed, original left untouched: {ex}")
        return False

    shutil.copy2(vpk_path, vpk_path + ".bak")
    os.replace(tmp, vpk_path)
    for a in vpk.archive_files():
        if os.path.exists(a):
            os.replace(a, a + ".bak")
    return True


def process_zip(zip_path, names, template):
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(tmp)
        vpks = []
        for root, _, fs in os.walk(tmp):
            for fn in fs:
                if fn.lower().endswith(".vpk") and not _is_chunk(fn):
                    vpks.append(os.path.join(root, fn))
        if not vpks:
            print("  [skip] no .vpk inside zip")
            return False
        changed = False
        for v in vpks:
            print(f" vpk inside zip: {os.path.relpath(v, tmp)}")
            if process_vpk(v, names, template):
                changed = True
        if not changed:
            return False

        shutil.copy2(zip_path, zip_path + ".bak")
        new_zip = zip_path + ".tmp"
        with zipfile.ZipFile(new_zip, "w", zipfile.ZIP_DEFLATED) as z:
            for root, _, fs in os.walk(tmp):
                for fn in fs:
                    if fn.endswith(".bak"):
                        continue
                    full = os.path.join(root, fn)
                    z.write(full, os.path.relpath(full, tmp))
        os.replace(new_zip, zip_path)
    return True


def _is_chunk(fn):
    stem = fn[:-4]
    return len(stem) > 4 and stem[-4] == "_" and stem[-3:].isdigit()


def main():
    ap = argparse.ArgumentParser(
        description="Add copies of a .vmdl_c template to VPK/ZIP archives under the paths listed in names.txt."
    )
    ap.add_argument("archives", nargs="*", help="vpk / zip files (default: all in the script folder)")
    ap.add_argument("-n", "--names", help="txt file with paths (default: names.txt next to the script)")
    ap.add_argument("-t", "--template", help=f".vmdl_c name or path inside the vpk (default: {DEFAULT_TEMPLATE})")
    args = ap.parse_args()

    here = os.path.dirname(os.path.abspath(__file__))
    names_file = args.names or os.path.join(here, "names.txt")
    if not os.path.isfile(names_file):
        sys.exit(f"Not found: {names_file}")
    names = load_names(names_file)
    if not names:
        sys.exit("names.txt is empty")

    archives = args.archives
    if not archives:
        archives = sorted(
            os.path.join(here, f)
            for f in os.listdir(here)
            if f.lower().endswith((".zip", ".vpk")) and not _is_chunk(f)
        )
        if not archives:
            sys.exit("No .zip / .vpk files in the script folder")

    for a in archives:
        print(f"== {a}")
        low = a.lower()
        if low.endswith(".zip"):
            process_zip(a, names, args.template)
        elif low.endswith(".vpk"):
            if _is_chunk(os.path.basename(a)):
                print("  [skip] this is a data chunk, use the *_dir.vpk file")
                continue
            process_vpk(a, names, args.template)
        else:
            print("  [skip] unknown format")
    print("Done.")


if __name__ == "__main__":
    main()