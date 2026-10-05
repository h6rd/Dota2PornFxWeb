(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  const RAW = 'https://raw.githubusercontent.com/spirit-bear-productions/dota_vpk_updates/main/resource/localization';
  const VPK_DIR = 'resource/localization';
  const CHUNK = 50;
  const LANGS = [
    'english', 'russian', 'ukrainian', 'schinese', 'tchinese', 'japanese', 'koreana', 'thai', 'vietnamese',
    'brazilian', 'portuguese', 'spanish', 'latam', 'french', 'german', 'italian', 'dutch', 'polish', 'czech',
    'bulgarian', 'romanian', 'hungarian', 'greek', 'turkish', 'finnish', 'swedish', 'danish', 'norwegian'
  ];
  const FILES = [
    ['dota', 'Dota: interface & items'],
    ['gameui', 'GameUI: menus'],
    ['abilities', 'Abilities']
  ];

  function parse(text) {
    const toks = [];
    const n = text.length;
    let i = 0, depth = 0;
    while (i < n) {
      const c = text[i];
      if (c <= ' ') { i++; continue; }
      if (c === '/' && text[i + 1] === '/') { i = text.indexOf('\n', i); if (i < 0) break; continue; }
      if (c === '{') { depth++; toks.push({ t: '{' }); i++; continue; }
      if (c === '}') { depth--; toks.push({ t: '}' }); i++; continue; }
      if (c === '"') {
        let j = i + 1;
        while (j < n && text[j] !== '"') { if (text[j] === '\\') j++; j++; }
        toks.push({ t: 's', s: i + 1, e: j, d: depth });
        i = j + 1; continue;
      }
      let j = i;
      while (j < n && text[j] > ' ' && text[j] !== '"' && text[j] !== '{' && text[j] !== '}') j++;
      toks.push({ t: 'u' });
      i = j;
    }
    const entries = [];
    for (let k = 0; k < toks.length - 1; k++) {
      const a = toks[k], b = toks[k + 1];
      if (a.t === 's' && b.t === 's' && a.d >= 2) {
        entries.push({ key: text.slice(a.s, a.e), vs: b.s, ve: b.e, val: text.slice(b.s, b.e) });
        k++;
      }
    }
    return entries;
  }

  function applyEdits(text, entries, edits) {
    const out = [];
    let pos = 0;
    for (const e of entries) {
      if (!edits.has(e.key)) continue;
      out.push(text.slice(pos, e.vs), edits.get(e.key));
      pos = e.ve;
    }
    out.push(text.slice(pos));
    return out.join('');
  }

  function sanitize(v) {
    let r = '';
    for (let i = 0; i < v.length; i++) {
      const ch = v[i];
      if (ch === '\\') { r += ch + (v[i + 1] ?? ''); i++; }
      else if (ch === '"') r += '\\"';
      else if (ch === '\r') continue;
      else if (ch === '\n') r += '\\n';
      else r += ch;
    }
    return r;
  }

  const PH = /%[%\w$]+|\{[^}]+\}|<[^>]+>/g;
  const phSig = (s) => (s.match(PH) || []).sort().join('|');

  async function gitBlobSha(bytes) {
    if (!(window.crypto && crypto.subtle)) return null;
    const head = new TextEncoder().encode(`blob ${bytes.length}\0`);
    const buf = new Uint8Array(head.length + bytes.length);
    buf.set(head); buf.set(bytes, head.length);
    const d = new Uint8Array(await crypto.subtle.digest('SHA-1', buf));
    return Array.from(d, b => b.toString(16).padStart(2, '0')).join('');
  }

  function decode(bytes) {
    const bom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    return { bom, text: new TextDecoder('utf-8').decode(bom ? bytes.subarray(3) : bytes) };
  }

  function encode(text, bom) {
    const body = new TextEncoder().encode(text);
    if (!bom) return body;
    const out = new Uint8Array(body.length + 3);
    out.set([0xEF, 0xBB, 0xBF]); out.set(body, 3);
    return out;
  }

  async function fetchFile(file, lang) {
    const r = await fetch(`${RAW}/${file}_${lang}.txt`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${file}_${lang}.txt: HTTP ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    const { bom, text } = decode(bytes);
    return { bom, text, sha: await gitBlobSha(bytes), entries: parse(text) };
  }

  const dbp = () => new Promise((res, rej) => {
    const r = indexedDB.open('dota-localization', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('sets', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  async function tx(mode, fn) {
    const db = await dbp();
    return new Promise((res, rej) => {
      const t = db.transaction('sets', mode);
      const q = fn(t.objectStore('sets'));
      t.oncomplete = () => res(q && q.result);
      t.onerror = () => rej(t.error);
    });
  }
  const dbGet = (id) => tx('readonly', s => s.get(id));
  const dbAll = () => tx('readonly', s => s.getAll());
  const dbPut = (rec) => tx('readwrite', s => s.put(rec));
  const dbDel = (id) => tx('readwrite', s => s.delete(id));

  const S = {
    lang: '', file: '', id: '', text: '', bom: false, sha: null, entries: [],
    edits: new Map(), conflicts: new Set(), stale: null, view: [], shown: 0,
    dirty: false, loaded: false, busy: false
  };
  let el;
  let searchTimer;

  const setStatus = (msg, kind) => { el.status.textContent = msg || ''; el.status.dataset.kind = kind || ''; };

  function updateCount() {
    el.count.textContent = S.loaded
      ? `${S.edits.size} changed · showing ${S.view.length} of ${S.entries.length}`
      : '';
    el.resetBtn.disabled = !S.loaded || !S.edits.size;
  }

  function filter() {
    const q = el.search.value.trim().toLowerCase();
    const onlyMod = el.onlyMod.checked;
    S.view = [];
    S.entries.forEach((e, i) => {
      if (onlyMod && !S.edits.has(e.key)) return;
      if (q) {
        const cur = S.edits.get(e.key) || '';
        if (!(e.key.toLowerCase().includes(q) || e.val.toLowerCase().includes(q) || cur.toLowerCase().includes(q))) return;
      }
      S.view.push(i);
    });
    S.shown = 0;
    el.list.innerHTML = '';
    el.list.scrollTop = 0;
    more();
    updateCount();
  }

  function more() {
    const end = Math.min(S.shown + CHUNK, S.view.length);
    const frag = document.createDocumentFragment();
    for (; S.shown < end; S.shown++) frag.appendChild(buildRow(S.entries[S.view[S.shown]]));
    el.list.appendChild(frag);
    if (!S.view.length) el.list.innerHTML = '<div class="lc-empty">Nothing found</div>';
  }

  function fit(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, 260) + 'px'; }

  function buildRow(e) {
    const row = document.createElement('div');
    row.className = 'lc-row';
    const head = document.createElement('div');
    head.className = 'lc-row-head';
    const key = document.createElement('code');
    key.className = 'lc-key'; key.textContent = e.key;
    const badges = document.createElement('span');
    badges.className = 'lc-badges';
    const revert = document.createElement('button');
    revert.type = 'button';
    revert.className = 'lc-revert';
    revert.title = 'Revert to original';
    revert.setAttribute('aria-label', 'Revert to original');
    revert.innerHTML = '<span class="material-symbols-rounded">undo</span>';
    head.append(key, badges);

    const orig = document.createElement('div');
    orig.className = 'lc-orig'; orig.textContent = e.val;

    const ta = document.createElement('textarea');
    ta.className = 'lc-ta'; ta.rows = 1; ta.spellcheck = false;
    ta.value = S.edits.has(e.key) ? S.edits.get(e.key) : e.val;

    const refresh = () => {
      const mod = S.edits.has(e.key);
      row.classList.toggle('mod', mod);
      revert.hidden = !mod;
      let b = '';
      if (S.conflicts.has(e.key)) b += '<span class="lc-badge warn" title="Upstream text changed after you saved. Your version was kept.">upstream changed</span>';
      if (mod && phSig(e.val) !== phSig(S.edits.get(e.key))) b += '<span class="lc-badge warn" title="Placeholders / tags (%s1, {d:x}, &lt;b&gt;) differ from the original">placeholders differ</span>';
      badges.innerHTML = b;
    };
    ta.addEventListener('input', () => {
      if (ta.value === e.val) S.edits.delete(e.key);
      else S.edits.set(e.key, sanitize(ta.value));
      S.dirty = true;
      refresh(); fit(ta); updateCount(); scheduleSave();
    });
    revert.addEventListener('click', () => {
      S.edits.delete(e.key);
      S.conflicts.delete(e.key);
      ta.value = e.val;
      S.dirty = true;
      refresh(); fit(ta); updateCount(); scheduleSave();
    });
    ta.addEventListener('change', () => { ta.value = S.edits.has(e.key) ? S.edits.get(e.key) : e.val; fit(ta); });

    const info = document.createElement('div');
    info.className = 'lc-info';
    info.append(head, orig);
    const edit = document.createElement('div');
    edit.className = 'lc-edit';
    edit.append(ta, revert);
    row.append(info, edit);
    refresh();
    requestAnimationFrame(() => fit(ta));
    return row;
  }

  async function load(lang, file) {
    if (S.busy) return;
    S.busy = true;
    el.list.innerHTML = '<div class="lc-empty">Downloading from GitHub…</div>';
    try {
      setStatus('Downloading from GitHub…');
      const f = await fetchFile(file, lang);
      Object.assign(S, {
        lang, file, id: `${lang}/${file}`, text: f.text, bom: f.bom, sha: f.sha, entries: f.entries,
        edits: new Map(), conflicts: new Set(), stale: null, dirty: false, loaded: true
      });
      const rec = await dbGet(S.id);
      let msg = `${f.entries.length} strings loaded · git ${f.sha ? f.sha.slice(0, 7) : 'n/a'}`;
      if (rec) {
        if (rec.sha === f.sha) {
          const keys = new Set(f.entries.map(e => e.key));
          for (const [k, o] of Object.entries(rec.overrides)) if (keys.has(k)) S.edits.set(k, o.v);
          msg += ` · restored ${S.edits.size} saved changes`;
        } else {
          S.stale = rec;
        }
      }
      setStatus(msg, 'ok');
      el.bar.classList.add('ready');
      remember();
      renderBanner();
      filter();
    } catch (err) {
      S.loaded = false;
      el.list.innerHTML = '<div class="lc-empty">Failed to load. Check your connection and pick the file again.</div>';
      setStatus(String(err.message || err), 'error');
    } finally {
      S.busy = false;
      updateCount();
      renderSaved();
    }
  }

  function renderBanner() {
    const r = S.stale;
    el.banner.hidden = !r;
    if (r) el.bannerText.textContent =
      `The game file changed on GitHub since you saved (${r.sha ? r.sha.slice(0, 7) : '?'} → ${S.sha ? S.sha.slice(0, 7) : '?'}). ` +
      `Your ${Object.keys(r.overrides).length} saved changes can be re-applied to the new version.`;
  }

  function updateSaved() {
    const r = S.stale;
    if (!r) return;
    const byKey = new Map(S.entries.map(e => [e.key, e]));
    let kept = 0, removed = 0;
    S.conflicts = new Set();
    for (const [k, o] of Object.entries(r.overrides)) {
      const e = byKey.get(k);
      if (!e) { removed++; continue; }
      if (e.val === o.v) continue;
      if (e.val !== o.b) S.conflicts.add(k);
      S.edits.set(k, o.v); kept++;
    }
    S.stale = null; S.dirty = true;
    renderBanner(); filter();
    save().then(() => {
      setStatus(`Updated: ${kept} changes re-applied, ${S.conflicts.size} with changed upstream text (marked), ${removed} removed from the game.`, 'ok');
    });
  }

  let saveTimer = 0;
  const SAVE_DELAY = 400;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { save(); }, SAVE_DELAY);
  }

  async function flushSave() {
    clearTimeout(saveTimer);
    if (S.loaded && S.dirty) await save();
  }

  async function save() {
    clearTimeout(saveTimer);
    if (!S.loaded) return;
    const id = S.id, lang = S.lang, file = S.file, sha = S.sha;
    const overrides = {};
    const byKey = new Map(S.entries.map(e => [e.key, e]));
    for (const [k, v] of S.edits) overrides[k] = { b: byKey.get(k).val, v };
    const count = S.edits.size;
    S.dirty = false; S.stale = null;
    try {
      if (count) await dbPut({ id, lang, file, sha, overrides, savedAt: Date.now() });
      else await dbDel(id);
    } catch (err) {
      S.dirty = true;
      setStatus('Autosave failed: ' + String(err.message || err), 'error');
      return;
    }
    renderBanner(); updateCount(); renderSaved();
    setStatus(count ? `Autosaved · ${count} changed` : 'No changes, saved copy removed', 'ok');
  }

  function setSelect(sel, v) {
    sel.value = v;
    if (window.MD3Select) MD3Select.refresh(sel);
  }

  function remember() {
    try { localStorage.setItem('lc-last', JSON.stringify([S.lang, S.file])); } catch (_) { /* ignore */ }
  }

  async function requestLoad(lang, file) {
    await flushSave();
    load(lang, file);
  }

  async function renderSaved() {
    let recs = [];
    try { recs = await dbAll(); } catch (_) { }
    el.saved.hidden = !recs.length;
    el.savedList.innerHTML = '';
    recs.sort((a, b) => b.savedAt - a.savedAt).forEach(r => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'lc-chip';
      b.textContent = `${r.file}_${r.lang} · ${Object.keys(r.overrides).length}`;
      b.title = `Saved ${new Date(r.savedAt).toLocaleString()} · git ${r.sha ? r.sha.slice(0, 7) : 'n/a'}`;
      b.addEventListener('click', () => { setSelect(el.lang, r.lang); setSelect(el.file, r.file); requestLoad(r.lang, r.file); });
      el.savedList.appendChild(b);
    });
  }

  function normalizePak(commit) {
    const digits = el.pak.value.replace(/\D/g, '').slice(0, 2);
    if (!commit) { el.pak.value = digits; return; }
    const n = Math.min(99, Math.max(2, parseInt(digits, 10) || 3));
    el.pak.value = String(n).padStart(2, '0');
  }

  async function buildVpk() {
    if (S.busy) return;
    S.busy = true; el.buildBtn.disabled = true;
    try {
      const files = [];
      const path = (file, lang) => `${VPK_DIR}/${file}_${lang}.txt`;
      if (S.loaded && S.edits.size) {
        files.push({ path: path(S.file, S.lang), data: encode(applyEdits(S.text, S.entries, S.edits), S.bom) });
      }
      const recs = await dbAll();
      for (const r of recs) {
        if (S.loaded && r.id === S.id) continue;
        setStatus(`Preparing ${r.file}_${r.lang}…`);
        const f = await fetchFile(r.file, r.lang);
        const ed = new Map(Object.entries(r.overrides).map(([k, o]) => [k, o.v]));
        files.push({ path: path(r.file, r.lang), data: encode(applyEdits(f.text, f.entries, ed), f.bom) });
      }
      if (!files.length) { setStatus('Nothing to pack: edit some strings first.', 'error'); return; }
      if (typeof VPKBuilder === 'undefined') { setStatus('vpk.js failed to load.', 'error'); return; }
      const vpk = VPKBuilder.build(files);
      normalizePak(true);
      const name = `pak${el.pak.value}_dir.vpk`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([vpk], { type: 'application/octet-stream' }));
      a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      setStatus(`${name} built: ${files.length} file(s), ${(vpk.length / 1048576).toFixed(1)} MB`, 'ok');
    } catch (err) {
      setStatus(String(err.message || err), 'error');
    } finally {
      S.busy = false; el.buildBtn.disabled = false;
    }
  }

  function cleanRec(r) {
    if (!r || typeof r !== 'object') return null;
    const { lang, file } = r;
    if (!LANGS.includes(lang) || !FILES.some(f => f[0] === file)) return null;
    const overrides = {};
    for (const [k, o] of Object.entries(r.overrides || {})) {
      if (o && typeof o.v === 'string') overrides[k] = { b: typeof o.b === 'string' ? o.b : '', v: o.v };
    }
    if (!Object.keys(overrides).length) return null;
    return {
      id: `${lang}/${file}`, lang, file,
      sha: typeof r.sha === 'string' ? r.sha : null,
      overrides, savedAt: Number(r.savedAt) || Date.now()
    };
  }

  window.LocalizationStore = {
    async exportAll() {
      await flushSave();
      return (await dbAll()).map(cleanRec).filter(Boolean);
    },
    async importAll(list) {
      let n = 0;
      clearTimeout(saveTimer);
      for (const r of Array.isArray(list) ? list : []) {
        const c = cleanRec(r);
        if (!c) continue;
        await dbPut(c); n++;
      }
      if (!el || !el.modal) return n;
      S.dirty = false;
      await renderSaved();
      if (S.loaded) {
        if (el.modal.classList.contains('active')) load(S.lang, S.file);
        else S.loaded = false;
      }
      return n;
    }
  };

  function open() {
    el.overlay.classList.add('active');
    el.modal.classList.add('active');
    if (typeof window.openModal === 'function') window.openModal();
    else document.body.classList.add('modal-open');
    renderSaved();
    if (!S.loaded && !S.busy) load(el.lang.value, el.file.value);
  }

  function close() {
    flushSave();
    el.overlay.classList.remove('active');
    el.modal.classList.remove('active');
    if (typeof window.closeModal === 'function') window.closeModal();
    else document.body.classList.remove('modal-open');
  }

  function init() {
    el = {
      overlay: $('localeOverlay'), modal: $('localeModal'), close: $('closeLocaleModal'),
      lang: $('lcLang'), file: $('lcFile'), status: $('lcStatus'), bar: $('lcBar'), search: $('lcSearch'), onlyMod: $('lcOnlyMod'), count: $('lcCount'),
      list: $('lcList'), resetBtn: $('lcReset'), buildBtn: $('lcBuild'), pak: $('lcPak'),
      banner: $('lcBanner'), bannerText: $('lcBannerText'), updateBtn: $('lcUpdate'),
      saved: $('lcSaved'), savedList: $('lcSavedList')
    };
    if (!el.modal) return;

    el.lang.innerHTML = LANGS.map(l => `<option value="${l}">${l[0].toUpperCase() + l.slice(1)}</option>`).join('');
    el.file.innerHTML = FILES.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
    let last = ['russian', 'dota'];
    try { last = JSON.parse(localStorage.getItem('lc-last')) || last; } catch (_) { }
    setSelect(el.lang, LANGS.includes(last[0]) ? last[0] : 'russian');
    setSelect(el.file, FILES.some(f => f[0] === last[1]) ? last[1] : 'dota');

    el.close.addEventListener('click', close);
    el.overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.modal.classList.contains('active')) close(); });

    el.lang.addEventListener('change', () => requestLoad(el.lang.value, el.file.value));
    el.file.addEventListener('change', () => requestLoad(el.lang.value, el.file.value));
    ['wheel', 'touchmove'].forEach(t => el.list.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
    el.search.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(filter, 200); });
    el.onlyMod.addEventListener('change', filter);
    el.list.addEventListener('scroll', () => {
      if (S.shown < S.view.length && el.list.scrollTop + el.list.clientHeight > el.list.scrollHeight - 400) more();
    });
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
    el.updateBtn.addEventListener('click', updateSaved);
    el.buildBtn.addEventListener('click', buildVpk);
    el.pak.addEventListener('input', () => normalizePak(false));
    el.pak.addEventListener('change', () => normalizePak(true));
    el.pak.addEventListener('blur', () => normalizePak(true));
    el.pak.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const n = parseInt(el.pak.value, 10) || 3;
      el.pak.value = String(n + (e.key === 'ArrowUp' ? 1 : -1));
      normalizePak(true);
    });
    normalizePak(true);
    el.resetBtn.addEventListener('click', async () => {
      if (!confirm('Reset all changes in this file? The saved copy will be removed too.')) return;
      clearTimeout(saveTimer);
      S.edits.clear(); S.conflicts.clear(); S.stale = null;
      try { await dbDel(S.id); } catch (_) { }
      S.dirty = false;
      renderBanner(); filter(); renderSaved();
      setStatus('File reset, saved copy removed', 'ok');
    });

    window.openLocalizationModal = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();