(function () {
  'use strict';
  const TEMPLATE_URL = 'assets/tools/cursors/template.zip';
  const CURSORS = [
    { id: 'cursor_attack_default', label: 'Attack', hot: [0, 0] },
    { id: 'cursor_attack_enemy', label: 'Attack enemy', hot: [0, 0] },
    { id: 'cursor_attack_illegal', label: 'Attack illegal', hot: [0, 0] },
    { id: 'cursor_attack_team', label: 'Attack ally', hot: [0, 0] },
    { id: 'cursor_default', label: 'Default', hot: [0, 0] },
    { id: 'cursor_default_enemy', label: 'Default enemy', hot: [0, 0] },
    { id: 'cursor_default_team', label: 'Default ally', hot: [0, 0] },
    { id: 'cursor_learn_ability', label: 'Learn ability', hot: [0, 0] },
    { id: 'cursor_move', label: 'Move', hot: [16, 16] },
    { id: 'cursor_db_default', label: 'DB default', hot: [0, 0], base: false, ani: false },
    { id: 'cursor_coach', label: 'Coach', hot: [0, 0] },
    { id: 'cursor_item_drop', label: 'Item drop', hot: [0, 0], vsz: false },
    { id: 'cursor_spell_default', label: 'Spell', hot: [0, 0] },
    { id: 'cursor_spell_illegal', label: 'Spell illegal', hot: [0, 0] },
    { id: 'cursor_spell_walkto', label: 'Spell walk to', hot: [16, 16] }
  ];
  const BASE = 32;
  const ORIGINAL_INNER = 32;
  const VSZ = [32, 32, 32, 32];
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const state = {};
  CURSORS.forEach(c => {
    state[c.id] = { img: null, url: null, scale: 1, ox: 0, oy: 0, rot: 0, fx: false, fy: false };
  });

  let active = CURSORS[0].id;
  let el = {};
  let busy = false;
  let resultBlob = null;
  let resultName = '';

  function log(msg, kind) {
    const row = document.createElement('div');
    row.className = 'upload-preview-log-entry' + (kind ? ' ' + kind : '');
    const ic = document.createElement('span');
    ic.className = 'material-symbols-rounded';
    ic.textContent = kind === 'error' ? 'error' : kind === 'success' ? 'check_circle' : 'chevron_right';
    const tx = document.createElement('span');
    tx.textContent = msg;
    row.append(ic, tx);
    el.log.appendChild(row);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function setStatus(msg, kind) {
    el.status.textContent = msg || '';
    el.status.className = 'cr-status' + (kind ? ' ' + kind : '');
  }

  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => res({ img, url });
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Cannot read ' + file.name)); };
      img.src = url;
    });
  }

  function drawFrame(ctx, size, st) {
    ctx.clearRect(0, 0, size, size);
    if (!st.img) return;
    const w = st.img.naturalWidth, h = st.img.naturalHeight;
    const k = Math.min(size / w, size / h) * st.scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(size / 2 + st.ox * size, size / 2 + st.oy * size);
    ctx.rotate(st.rot * Math.PI / 180);
    ctx.scale(st.fx ? -1 : 1, st.fy ? -1 : 1);
    ctx.drawImage(st.img, -w * k / 2, -h * k / 2, w * k, h * k);
    ctx.restore();
  }

  function newCanvas(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  }

  function renderSize(st, size) {
    let cur = newCanvas(Math.max(size * 4, 128));
    drawFrame(cur.getContext('2d'), cur.width, st);
    while (cur.width / 2 >= size) {
      const next = newCanvas(cur.width / 2);
      const nctx = next.getContext('2d');
      nctx.imageSmoothingEnabled = true;
      nctx.imageSmoothingQuality = 'high';
      nctx.drawImage(cur, 0, 0, next.width, next.height);
      cur = next;
    }
    if (cur.width !== size) {
      const fin = newCanvas(size);
      const fctx = fin.getContext('2d');
      fctx.imageSmoothingEnabled = true;
      fctx.imageSmoothingQuality = 'high';
      fctx.drawImage(cur, 0, 0, size, size);
      cur = fin;
    }
    return cur;
  }

  function pixels(canvas) {
    return canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
  }

  function dib(data, size) {
    const out = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      const sy = size - 1 - y;
      for (let x = 0; x < size; x++) {
        const s = (sy * size + x) * 4, d = (y * size + x) * 4;
        out[d] = data[s + 2]; out[d + 1] = data[s + 1]; out[d + 2] = data[s]; out[d + 3] = data[s + 3];
      }
    }
    return out;
  }

  function infoHeader(size, heightField) {
    const b = new DataView(new ArrayBuffer(40));
    b.setUint32(0, 40, true);
    b.setInt32(4, size, true);
    b.setInt32(8, heightField, true);
    b.setUint16(12, 1, true);
    b.setUint16(14, 32, true);
    return new Uint8Array(b.buffer);
  }

  function encodeBmp(canvas) {
    const size = canvas.width;
    const px = dib(pixels(canvas), size);
    const head = new DataView(new ArrayBuffer(14));
    head.setUint8(0, 0x42); head.setUint8(1, 0x4d);
    head.setUint32(2, 54 + px.length, true);
    head.setUint32(10, 54, true);
    const out = new Uint8Array(54 + px.length);
    out.set(new Uint8Array(head.buffer), 0);
    out.set(infoHeader(size, size), 14);
    out.set(px, 54);
    return out;
  }

  function encodeCur(canvas, hx, hy) {
    const size = canvas.width;
    const px = dib(pixels(canvas), size);
    const mask = new Uint8Array(Math.ceil(size / 32) * 4 * size);
    const dibLen = 40 + px.length + mask.length;
    const dir = new DataView(new ArrayBuffer(22));
    dir.setUint16(2, 2, true);
    dir.setUint16(4, 1, true);
    dir.setUint8(6, size);
    dir.setUint8(7, size);
    dir.setUint16(10, hx, true);
    dir.setUint16(12, hy, true);
    dir.setUint32(14, dibLen, true);
    dir.setUint32(18, 22, true);
    const out = new Uint8Array(22 + dibLen);
    out.set(new Uint8Array(dir.buffer), 0);
    out.set(infoHeader(size, size * 2), 22);
    out.set(px, 62);
    out.set(mask, 62 + px.length);
    return out;
  }

  const fourcc = (s) => new Uint8Array([...s].map(c => c.charCodeAt(0)));

  function u32(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, true);
    return b;
  }

  function concat(parts) {
    const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    let o = 0;
    parts.forEach(p => { out.set(p, o); o += p.length; });
    return out;
  }

  function chunk(id, data) {
    return concat([fourcc(id), u32(data.length), data, new Uint8Array(data.length % 2)]);
  }

  function encodeAni(cur) {
    const h = new DataView(new ArrayBuffer(36));
    h.setUint32(0, 36, true);
    h.setUint32(4, 1, true);
    h.setUint32(8, 1, true);
    h.setUint32(28, 60, true);
    h.setUint32(32, 1, true);
    const fram = concat([fourcc('fram'), chunk('icon', cur)]);
    const body = concat([fourcc('ACON'), chunk('anih', new Uint8Array(h.buffer)), chunk('LIST', fram)]);
    return concat([fourcc('RIFF'), u32(body.length), body]);
  }

  const safeName = (n) => (n || '').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 48) || 'My Cursor';

  function isDirty(id) {
    return !!state[id].img;
  }

  function filledIds() {
    return CURSORS.filter(c => isDirty(c.id)).map(c => c.id);
  }

  function resetResult() {
    resultBlob = null;
    el.result.style.display = 'none';
  }

  function buildList() {
    el.list.innerHTML = '';
    CURSORS.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cr-item';
      b.dataset.id = c.id;
      b.innerHTML = '<canvas width="40" height="40"></canvas><span class="cr-item-name"></span><span class="material-symbols-rounded cr-item-ok"></span>';
      b.querySelector('.cr-item-name').textContent = c.label;
      b.addEventListener('click', () => select(c.id));
      el.list.appendChild(b);
    });
  }

  function updateList() {
    el.list.querySelectorAll('.cr-item').forEach(b => {
      const id = b.dataset.id;
      b.classList.toggle('active', id === active);
      b.classList.toggle('filled', isDirty(id));
      const ok = b.querySelector('.cr-item-ok');
      const filled = isDirty(id);
      ok.textContent = filled ? 'check_circle' : '';
      ok.style.display = filled ? 'inline-block' : 'none';
      const cv = b.querySelector('canvas');
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 40, 40);
      if (state[id].img) {
        ctx.drawImage(renderSize(state[id], 40), 0, 0);
      } else if (originals[id]) {
        const o = originals[id];
        const w = o.naturalWidth || o.width, h = o.naturalHeight || o.height;
        const fit = Math.min(ORIGINAL_INNER / w, ORIGINAL_INNER / h);
        const k = fit >= 1 ? Math.floor(fit) : fit;
        ctx.imageSmoothingEnabled = fit < 1;
        ctx.drawImage(o, (40 - w * k) / 2, (40 - h * k) / 2, w * k, h * k);
      }
    });
    el.count.textContent = filledIds().length + ' / ' + CURSORS.length;
    el.generate.disabled = busy || filledIds().length === 0;
  }

  function select(id) {
    active = id;
    syncControls();
    renderAll();
  }

  function syncControls() {
    const st = state[active];
    const c = CURSORS.find(x => x.id === active);
    el.title.textContent = c.label;
    el.scale.value = Math.round(st.scale * 100);
    el.scaleVal.textContent = Math.round(st.scale * 100) + '%';
    el.rot.value = Math.round(st.rot);
    el.rotVal.textContent = Math.round(st.rot) + '°';
    el.stage.classList.toggle('empty', !st.img);
    el.editor.classList.toggle('has-image', !!st.img);
  }

  function renderPreviews() {
    const st = state[active];
    if (st.img) {
      const c = CURSORS.find(x => x.id === active);
      el.test.style.cursor = 'url(' + renderSize(st, BASE).toDataURL('image/png') + ') ' + c.hot[0] + ' ' + c.hot[1] + ', auto';
    } else {
      el.test.style.cursor = 'default';
    }
  }

  let raf = 0;
  function renderAll() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      drawFrame(el.ctx, el.canvas.width, state[active]);
      renderPreviews();
      updateList();
    });
  }

  function renderStageOnly() {
    drawFrame(el.ctx, el.canvas.width, state[active]);
  }

  async function setImage(id, file) {
    if (!file || !file.type.startsWith('image/')) { setStatus('Only image files are supported.', 'error'); return; }
    try {
      const { img, url } = await loadImage(file);
      const st = state[id];
      if (st.url) URL.revokeObjectURL(st.url);
      st.img = img; st.url = url;
      st.scale = 1; st.ox = 0; st.oy = 0; st.rot = 0; st.fx = false; st.fy = false;
      setStatus('');
      resetResult();
      if (id === active) syncControls();
      renderAll();
    } catch (e) {
      setStatus(e.message, 'error');
    }
  }

  function removeImage(id) {
    const st = state[id];
    if (st.url) URL.revokeObjectURL(st.url);
    st.img = st.url = null;
    st.scale = 1; st.ox = 0; st.oy = 0; st.rot = 0; st.fx = false; st.fy = false;
    resetResult();
    if (id === active) syncControls();
    renderAll();
  }

  function resetTransform() {
    const st = state[active];
    st.scale = 1; st.ox = 0; st.oy = 0; st.rot = 0; st.fx = false; st.fy = false;
    resetResult();
    syncControls();
    renderAll();
  }

  function bindStage() {
    let dragging = false, sx = 0, sy = 0, bx = 0, by = 0, soft = 0;

    const renderSoft = () => {
      cancelAnimationFrame(soft);
      soft = requestAnimationFrame(() => { renderPreviews(); updateList(); });
    };

    el.stage.addEventListener('pointerdown', (e) => {
      const st = state[active];
      if (!st.img) { el.file.click(); return; }
      dragging = true;
      sx = e.clientX; sy = e.clientY; bx = st.ox; by = st.oy;
      el.stage.setPointerCapture(e.pointerId);
      el.stage.classList.add('dragging');
    });

    el.stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const st = state[active];
      const r = el.stage.getBoundingClientRect();
      st.ox = clamp(bx + (e.clientX - sx) / r.width, -1.5, 1.5);
      st.oy = clamp(by + (e.clientY - sy) / r.height, -1.5, 1.5);
      renderStageOnly();
      resetResult();
      renderSoft();
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.stage.classList.remove('dragging');
      renderAll();
    };

    el.stage.addEventListener('pointerup', end);
    el.stage.addEventListener('pointercancel', end);

    el.stage.addEventListener('wheel', (e) => {
      const st = state[active];
      if (!st.img) return;
      st.scale = clamp(st.scale * Math.exp(-e.deltaY * 0.0018), 0.1, 4);
      resetResult();
      syncControls();
      renderAll();
    }, { passive: true });

    ['dragenter', 'dragover'].forEach(ev => el.stage.addEventListener(ev, e => { e.preventDefault(); el.stage.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => el.stage.addEventListener(ev, e => { e.preventDefault(); el.stage.classList.remove('over'); }));
    el.stage.addEventListener('drop', e => { if (e.dataTransfer.files[0]) setImage(active, e.dataTransfer.files[0]); });
  }

  let templateCache = null;
  const originals = {};
  let originalsStarted = false;

  async function loadTemplate() {
    if (templateCache) return templateCache;
    try {
      const r = await fetch(TEMPLATE_URL, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      const files = fflate.unzipSync(new Uint8Array(await r.arrayBuffer()));
      const names = Object.keys(files).filter(n => !n.endsWith('/'));
      const root = names.length && names.every(n => n.includes('/')) ? names[0].split('/')[0] + '/' : '';
      const out = {};
      names.forEach(n => { out[root ? n.slice(root.length) : n] = files[n]; });
      templateCache = out;
      return out;
    } catch (e) {
      return null;
    }
  }

  function fallbackFiles(name) {
    const enc = new TextEncoder();
    const bat = '@echo off\r\nset "DST=%ProgramFiles(x86)%\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor"\r\nif not exist "%DST%" mkdir "%DST%"\r\nxcopy /Y /E "%~dp0cursor\\*" "%DST%\\"\r\necho Done.\r\npause\r\n';
    const guide = name + '\r\n\r\nRun Install.bat to copy the cursor files to the Dota 2 resource\\cursor folder.\r\nIf Dota 2 is installed elsewhere, copy the contents of the cursor folder there manually.\r\n';
    return { 'Install.bat': enc.encode(bat), 'guide.txt': enc.encode(guide) };
  }

  async function generate() {
    if (busy) return;
    const ids = filledIds();
    if (!ids.length) return;
    busy = true;
    resetResult();
    el.generate.disabled = true;
    el.log.innerHTML = '';
    const name = safeName(el.name.value);
    try {
      setStatus('Working…');
      log('Loading template');
      let files = await loadTemplate();
      if (!files) {
        log('Template not found at ' + TEMPLATE_URL + ', packing only the selected cursors', 'error');
        files = fallbackFiles(name);
      }
      const out = { ...files };
      for (const id of ids) {
        const st = state[id];
        log('Converting ' + id);
        const c = CURSORS.find(x => x.id === id);
        const base = renderSize(st, BASE);
        const bmp = encodeBmp(base);
        if (c.base !== false) out['cursor/' + id + '.bmp'] = bmp;
        if (c.vsz !== false) VSZ.forEach((sz, k) => { out['cursor/' + id + '_vsz' + k + '.bmp'] = encodeBmp(renderSize(st, sz)); });
        (c.extra || []).forEach(suffix => { out['cursor/' + id + suffix + '.bmp'] = bmp; });
        if (c.ani !== false) out['cursor/' + id + '.ani'] = encodeAni(encodeCur(base, c.hot[0], c.hot[1]));
        await new Promise(r => setTimeout(r));
      }
      log('Packing archive');
      const tree = {};
      Object.keys(out).sort().forEach(k => { tree[name + '/' + k] = out[k]; });
      resultBlob = new Blob([fflate.zipSync(tree, { level: 6 })], { type: 'application/zip' });
      resultName = name + '.zip';
      el.resultText.textContent = resultName + ' (' + (resultBlob.size / 1024).toFixed(0) + ' KB)';
      el.result.style.display = 'flex';
      setStatus('Done.', 'success');
      log('Archive ready', 'success');
    } catch (e) {
      setStatus('Failed: ' + e.message, 'error');
      log(e.message, 'error');
    } finally {
      busy = false;
      updateList();
    }
  }

  function download() {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    a.download = resultName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  const ORIGINALS_DIR = 'assets/tools/cursors/';

  function decodeBmp(buf) {
    const dv = new DataView(buf);
    if (dv.byteLength < 54 || dv.getUint16(0, true) !== 0x4d42) return null;
    const off = dv.getUint32(10, true);
    const hs = dv.getUint32(14, true);
    if (hs < 40) return null;
    const w = dv.getInt32(18, true);
    let h = dv.getInt32(22, true);
    const bpp = dv.getUint16(28, true);
    const comp = dv.getUint32(30, true);
    const topDown = h < 0;
    h = Math.abs(h);
    if ((comp !== 0 && comp !== 3) || ![1, 4, 8, 24, 32].includes(bpp) || w <= 0 || h <= 0) return null;
    let palette = null;
    if (bpp <= 8) {
      const n = dv.getUint32(46, true) || (1 << bpp);
      palette = [];
      for (let i = 0; i < n; i++) {
        const p = 14 + hs + i * 4;
        palette.push([dv.getUint8(p + 2), dv.getUint8(p + 1), dv.getUint8(p)]);
      }
    }
    const rowSize = Math.floor((bpp * w + 31) / 32) * 4;
    const data = new Uint8ClampedArray(w * h * 4);
    let anyAlpha = false;
    for (let y = 0; y < h; y++) {
      const row = off + (topDown ? y : h - 1 - y) * rowSize;
      for (let x = 0; x < w; x++) {
        const d = (y * w + x) * 4;
        let r, g, b, a = 255;
        if (bpp === 32) {
          const p = row + x * 4;
          b = dv.getUint8(p); g = dv.getUint8(p + 1); r = dv.getUint8(p + 2); a = dv.getUint8(p + 3);
          if (a) anyAlpha = true;
        } else if (bpp === 24) {
          const p = row + x * 3;
          b = dv.getUint8(p); g = dv.getUint8(p + 1); r = dv.getUint8(p + 2);
        } else {
          const perByte = 8 / bpp;
          const byte = dv.getUint8(row + Math.floor(x / perByte));
          const shift = 8 - bpp * ((x % perByte) + 1);
          const c = palette[(byte >> shift) & ((1 << bpp) - 1)] || [0, 0, 0];
          r = c[0]; g = c[1]; b = c[2];
        }
        data[d] = r; data[d + 1] = g; data[d + 2] = b; data[d + 3] = a;
      }
    }
    if (bpp === 32 && !anyAlpha) {
      for (let i = 3; i < data.length; i += 4) data[i] = 255;
    }
    if (!anyAlpha) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 255) data[i + 3] = 0;
      }
    }
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
    return cv;
  }

  async function tryImage(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return decodeBmp(await r.arrayBuffer());
    } catch (e) {
      return null;
    }
  }

  async function ensureOriginals() {
    if (originalsStarted) return;
    originalsStarted = true;
    for (const c of CURSORS) {
      const img = await tryImage(ORIGINALS_DIR + c.id + '.bmp');
      if (img) originals[c.id] = img;
    }
    updateList();
  }

  function open() {
    el.overlay.classList.add('active');
    el.modal.classList.add('active');
    if (typeof window.openModal === 'function') window.openModal();
    else document.body.classList.add('modal-open');
    renderAll();
    ensureOriginals();
  }

  function close() {
    if (busy && !confirm('Archive is being created. Close anyway?')) return;
    el.overlay.classList.remove('active');
    el.modal.classList.remove('active');
    if (typeof window.closeModal === 'function') window.closeModal();
    else document.body.classList.remove('modal-open');
  }

  function init() {
    el = {
      overlay: $('cursorOverlay'), modal: $('cursorModal'), closeBtn: $('closeCursorModal'),
      list: $('crList'), count: $('crCount'), title: $('crTitle'),
      editor: $('crEditor'), stage: $('crStage'), canvas: $('crCanvas'),
      file: $('crFile'), allFile: $('crAllFile'),
      scale: $('crScale'), scaleVal: $('crScaleVal'), rot: $('crRot'), rotVal: $('crRotVal'),
      reset: $('crReset'), remove: $('crRemove'),
      imgAll: $('crImgAll'), choose: $('crChoose'),
      test: $('crTest'),
      name: $('crName'), status: $('crStatus'), generate: $('crGenerate'),
      result: $('crResult'), resultText: $('crResultText'), download: $('crDownload'), log: $('crLog')
    };
    if (!el.modal) return;
    el.ctx = el.canvas.getContext('2d');

    buildList();
    bindStage();
    el.modal.addEventListener('wheel', (e) => {
      e.stopPropagation();
      if (e.target.closest('.cr-stage')) { e.preventDefault(); return; }
      const col = e.target.closest('.cr-col');
      const body = e.target.closest('.cr-body');
      const sc = [col, body].find(n => n && getComputedStyle(n).overflowY !== 'hidden' && n.scrollHeight > n.clientHeight + 1);
      if (!sc) { e.preventDefault(); return; }
      const down = e.deltaY > 0;
      const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
      const atTop = sc.scrollTop <= 0;
      if ((down && atBottom) || (!down && atTop)) e.preventDefault();
    }, { passive: false });
    el.modal.addEventListener('touchmove', (e) => {
      e.stopPropagation();
      if (!e.target.closest('.cr-col, .cr-body')) e.preventDefault();
    }, { passive: false });

    el.closeBtn.addEventListener('click', close);
    el.overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.modal.classList.contains('active')) close();
    });

    el.choose.addEventListener('click', () => el.file.click());
    el.file.addEventListener('change', () => { setImage(active, el.file.files[0]); el.file.value = ''; });

    el.scale.addEventListener('input', () => {
      state[active].scale = el.scale.value / 100;
      el.scaleVal.textContent = el.scale.value + '%';
      resetResult();
      renderAll();
    });
    el.rot.addEventListener('input', () => {
      state[active].rot = +el.rot.value;
      el.rotVal.textContent = el.rot.value + '°';
      resetResult();
      renderAll();
    });
    el.reset.addEventListener('click', resetTransform);
    el.remove.addEventListener('click', () => removeImage(active));

    el.imgAll.addEventListener('click', () => el.allFile.click());
    el.allFile.addEventListener('change', async () => {
      const f = el.allFile.files[0];
      el.allFile.value = '';
      if (!f) return;
      for (const c of CURSORS) await setImage(c.id, f);
    });
    el.generate.addEventListener('click', generate);
    el.download.addEventListener('click', download);

    syncControls();
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.openCursorModal = open;
})();