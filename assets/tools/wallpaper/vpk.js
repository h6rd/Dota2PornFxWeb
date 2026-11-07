(function (root) {
  'use strict';

  const SIGNATURE = 0x55AA1234;
  const VERSION = 2;
  const HEADER_SIZE = 28;
  const EMBEDDED = 0x7FFF;

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  const MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const MD5_K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;

  function md5(bytes) {
    const len = bytes.length;
    const paddedLen = (((len + 8) >> 6) + 1) << 6;
    const buf = new Uint8Array(paddedLen);
    buf.set(bytes);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(paddedLen - 8, (len << 3) >>> 0, true);
    dv.setUint32(paddedLen - 4, Math.floor(len / 0x20000000), true);

    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const M = new Uint32Array(16);

    for (let off = 0; off < paddedLen; off += 64) {
      for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) & 15; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) & 15; }
        else { F = C ^ (B | ~D); g = (7 * i) & 15; }
        F = (F + A + MD5_K[i] + M[g]) >>> 0;
        A = D; D = C; C = B;
        const s = MD5_S[(i >> 4) * 4 + (i & 3)];
        B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    const out = new Uint8Array(16);
    const odv = new DataView(out.buffer);
    odv.setUint32(0, a0, true); odv.setUint32(4, b0, true);
    odv.setUint32(8, c0, true); odv.setUint32(12, d0, true);
    return out;
  }

  const enc = new TextEncoder();

  function splitPath(full) {
    const p = full.replace(/\\/g, '/').replace(/^\/+/, '');
    const slash = p.lastIndexOf('/');
    const dir = slash === -1 ? '' : p.slice(0, slash);
    const file = slash === -1 ? p : p.slice(slash + 1);
    const dot = file.lastIndexOf('.');
    const name = dot === -1 ? file : file.slice(0, dot);
    const ext = dot === -1 ? '' : file.slice(dot + 1);
    // VPK uses a single space for "empty" ext / path / name
    return { ext: ext || ' ', dir: dir || ' ', name: name || ' ' };
  }

  function build(files) {
    if (!files || !files.length) throw new Error('VPK: no files');

    const entries = files.map(f => {
      const sp = splitPath(f.path);
      return { ...sp, data: f.data, crc: crc32(f.data) };
    });
    entries.sort((a, b) =>
      a.ext.localeCompare(b.ext) || a.dir.localeCompare(b.dir) || a.name.localeCompare(b.name));

    let dataSize = 0;
    entries.forEach(e => { e.offset = dataSize; dataSize += e.data.length; });

    const parts = [];
    const push = (u8) => parts.push(u8);
    const str = (s) => push(enc.encode(s + '\0'));
    const u32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n >>> 0, true); push(b); };
    const u16 = (n) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); push(b); };

    const tree = new Map();
    entries.forEach(e => {
      if (!tree.has(e.ext)) tree.set(e.ext, new Map());
      const dirs = tree.get(e.ext);
      if (!dirs.has(e.dir)) dirs.set(e.dir, []);
      dirs.get(e.dir).push(e);
    });

    for (const [ext, dirs] of tree) {
      str(ext);
      for (const [dir, list] of dirs) {
        str(dir);
        for (const e of list) {
          str(e.name);
          u32(e.crc);
          u16(0);
          u16(EMBEDDED);
          u32(e.offset);
          u32(e.data.length);
          u16(0xFFFF);
        }
        push(new Uint8Array([0]));
      }
      push(new Uint8Array([0]));
    }
    push(new Uint8Array([0]));

    const treeSize = parts.reduce((n, p) => n + p.length, 0);
    const treeBytes = new Uint8Array(treeSize);
    let o = 0;
    parts.forEach(p => { treeBytes.set(p, o); o += p.length; });

    const archiveMd5Size = 0;
    const otherMd5Size = 48;
    const total = HEADER_SIZE + treeSize + dataSize + archiveMd5Size + otherMd5Size;
    const out = new Uint8Array(total);
    const dv = new DataView(out.buffer);

    dv.setUint32(0, SIGNATURE, true);
    dv.setUint32(4, VERSION, true);
    dv.setUint32(8, treeSize, true);
    dv.setUint32(12, dataSize, true);
    dv.setUint32(16, archiveMd5Size, true);
    dv.setUint32(20, otherMd5Size, true);
    dv.setUint32(24, 0, true);

    out.set(treeBytes, HEADER_SIZE);
    const dataStart = HEADER_SIZE + treeSize;
    entries.forEach(e => out.set(e.data, dataStart + e.offset));

    const mdStart = dataStart + dataSize + archiveMd5Size;
    out.set(md5(treeBytes), mdStart);
    out.set(md5(new Uint8Array(0)), mdStart + 16);
    out.set(md5(out.subarray(0, mdStart + 32)), mdStart + 32);

    return out;
  }

  const api = { build, crc32, md5 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VPKBuilder = api;
})(typeof self !== 'undefined' ? self : this);
