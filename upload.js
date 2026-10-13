(() => {
  'use strict';

  const WORKER_BASE_URL = 'https://uploader.hrdq.workers.dev';
  const FFLATE_URL = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js';
  const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  const SOURCE_URLS = {
    github: 'https://raw.githubusercontent.com/h6rd/Dota2PornFxWeb/main',
    hf: 'https://huggingface.co/datasets/hrdq/Dota2PornFx/resolve/main',
    local: ''
  };
  const DATA_SOURCES = (() => {
    const host = location.hostname;
    const matches = list => list.some(h => host === h || host.endsWith('.' + h));
    const { github, hf, local } = SOURCE_URLS;
    if (matches(['d2pfx.onrender.com', 'd2pfx.netlify.app', 'd2pfx.vercel.app'])) return [hf, github, local];
    if (matches(['127.0.0.1', 'localhost'])) return [local, hf, github];
    return [github, hf];
  })();

  const MAX_OUTER_ARCHIVE_BYTES = 100 * 1024 * 1024;
  const MAX_ARCHIVE_ENTRIES = 1000;
  const MAX_EXTRACTED_BYTES = 250 * 1024 * 1024;
  const MAX_ENTRY_BYTES = 100 * 1024 * 1024;
  const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
  const MAX_NAME_LENGTH = 29;
  const NAME_LENGTH_EXCEPTIONS = { 'keeper of the light': 39, 'natures prophet': 39 };
  const MAX_URL_LENGTH = 2048;

  const NAME_CHAR_RE = /[a-zA-Z0-9 \-_.,!]/;
  const MOD_NAME_RE = /^[a-zA-Z0-9 \-_'.,!]+$/;
  const MISPLACED_HYPHEN_RE = /(^|[^a-zA-Z0-9])-|-([^a-zA-Z0-9]|$)/;
  const NICK_RE = /^[\p{L}\p{N} _.\-!,()\[\]#@+]+$/u;
  const SAFE_TEXT_RE = /^[^<>"`\\\u0000-\u001f\u007f]+$/;
  const NICK_HINT = 'letters, digits, spaces and . _ - ! , ( ) [ ] # @ + only';
  const YOUTUBE_HOST_RE = /^(m\.|www\.|music\.)?youtube\.com$|^youtu\.be$/i;

  const HERO_AWARE_CATEGORIES = ['heroes', 'hero-items', 'herofx', 'hero-sounds'];
  const BLACKLISTED_CATEGORIES = ['packs', 'cursors', 'tools', 'news', 'guides', 'sites', 'fonts', 'creeps'];
  const UPLOAD_HIDDEN_TAGS = { herofx: ['sounds'], 'hero-items': ['sounds'] };
  const NON_SLOT_TAGS = ['effects', 'icons', 'sounds'];
  const FALLBACK_SLOT_TAGS = ['base', 'totem', 'weapon', 'tail', 'legs', 'forge', 'spiderling', 'bear', 'off-hand', 'cart', 'mount', 'head', 'arm', 'arms', 'armor', 'shoulders', 'back', 'shield', 'hair', 'neck', 'rocket'];
  const FALLBACK_PREVIEW_VIDEO_CATEGORIES = ['sounds', 'hero-sounds', 'huds', 'ti-bp-effects'];
  const UPLOAD_VIDEO_CATEGORIES = ['sounds', 'hero-sounds', 'huds', 'ti-bp-effects'];
  const TAG_DESCRIPTIONS = { effects: 'ONLY ABILITY EFFECTS, NO VISUAL EFFECTS', icons: 'ONLY ABILITY ICONS' };
  const AUTHOR_PREF_KEY = 'd2pfx_upload_author';

  const STYLE_COUNT = 2;
  const MAX_STYLE_LABEL = 12;
  const STYLE_LABEL_RE = /^[a-zA-Z0-9 _.\-!]+$/;
  const HEX_RE = /^#[0-9a-f]{6}$/i;
  const MAX_STYLED_TOTAL_BYTES = 60 * 1024 * 1024;

  const STEP_COUNT = 5;
  const $ = id => document.getElementById(id);

  document.fonts.ready.then(() => document.documentElement.classList.add('fonts-loaded'));

  function getMaxNameLength(hero) {
    return NAME_LENGTH_EXCEPTIONS[String(hero || '').trim().toLowerCase()] || MAX_NAME_LENGTH;
  }
  function tr(key, fallback) { return (window.translations && window.translations[key]) || fallback || key; }
  function normalizeModName(name) { return String(name || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function toTitleCase(str) {
    return String(str || '').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ')
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
  }
  function titleCaseWords(str) {
    return String(str || '').replace(/[A-Za-z]+(?:'[A-Za-z]+)?/g, word => {
      if (word.includes("'")) return word.split("'").map(p => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p)).join("'");
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    });
  }
  function stripExt(fileName) { return String(fileName || '').replace(/\.[^./\\]+$/, ''); }
  function cleanNameValue(raw, max) {
    let kept = '', badChars = '', overflow = '';
    for (const ch of String(raw || '')) {
      if (!NAME_CHAR_RE.test(ch)) badChars += ch;
      else if (kept.length >= max) overflow += ch;
      else kept += ch;
    }
    return { kept, badChars, overflow };
  }
  function isWebpBytes(b) {
    return b instanceof Uint8Array && b.length > 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  }
  function isYouTubeUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && YOUTUBE_HOST_RE.test(url.hostname) && url.href.length <= MAX_URL_LENGTH;
    } catch { return false; }
  }
  function isAllowedHttpUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password && url.href.length <= MAX_URL_LENGTH;
    } catch { return false; }
  }
  function safeGithubUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && u.hostname === 'github.com' ? u.href : null;
    } catch { return null; }
  }
  async function sha256Hex(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function formatBytes(n) {
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
    return Math.max(1, Math.round(n / 1024)) + ' KB';
  }
  function formatCooldown(totalSeconds) {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(s / 60), r = s % 60;
    return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
  }
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }
  function icon(name) { return el('span', 'material-symbols-rounded', name); }
  function show(node, visible = true) { if (node) node.hidden = !visible; }

  function refreshSelect(sel) { if (sel && window.MD3Select) window.MD3Select.enhance(sel); }
  function setSelectValue(sel, value) { sel.value = value; refreshSelect(sel); }
  function showSelect(sel, visible) {
    if (window.MD3Select) window.MD3Select.setVisible(sel, visible);
    else sel.style.display = visible ? '' : 'none';
  }

  function loadScriptOnce(src, readyCheck) {
    if (readyCheck()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => (readyCheck() ? resolve() : reject(new Error('Script loaded but is unavailable: ' + src)));
      s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  const ensureFflate = () => loadScriptOnce(FFLATE_URL, () => typeof window.fflate !== 'undefined');
  const ensureTurnstile = () => loadScriptOnce(TURNSTILE_URL, () => typeof window.turnstile !== 'undefined');

  function loadAuthorPref() {
    try {
      const p = JSON.parse(localStorage.getItem(AUTHOR_PREF_KEY) || 'null');
      return p && typeof p === 'object' ? p : null;
    } catch { return null; }
  }
  function saveAuthorPref(pref) { try { localStorage.setItem(AUTHOR_PREF_KEY, JSON.stringify(pref)); } catch { } }

  async function fetchJson(base, name, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = base ? `${base}/assets/data/${name}` : `assets/data/${name}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  async function loadCatalog() {
    let lastError = null;
    for (let i = 0; i < DATA_SOURCES.length; i++) {
      try {
        const timeout = i === 0 ? 15000 : 10000;
        const [mods, constants] = await Promise.all([fetchJson(DATA_SOURCES[i], 'mods.json', timeout), fetchJson(DATA_SOURCES[i], 'constants.json', timeout)]);
        window.modsData = mods.modsData || {};
        Object.assign(window, constants);
        return;
      } catch (err) { lastError = err; }
    }
    throw lastError || new Error('No data source available');
  }

  function getPreviewVideoCategories() {
    const site = Array.isArray(window.PREVIEW_VIDEO_CATEGORIES) ? window.PREVIEW_VIDEO_CATEGORIES : FALLBACK_PREVIEW_VIDEO_CATEGORIES;
    return site.filter(c => UPLOAD_VIDEO_CATEGORIES.includes(c));
  }
  function getSlotTags(categoryId) {
    const list = (window.slotTags || {})[categoryId];
    if (Array.isArray(list) && list.length) return list;
    const cfg = (window.TAG_CONFIGS || {})[categoryId];
    if (cfg && cfg.map) return Object.keys(cfg.map).filter(k => !NON_SLOT_TAGS.includes(k));
    return FALLBACK_SLOT_TAGS;
  }

  function listCategoryMods(category) {
    const data = window.modsData && window.modsData[category];
    if (!data) return [];
    if (Array.isArray(data)) return data.map(mod => ({ mod, group: null }));
    if (Array.isArray(data.groups)) {
      return data.groups.flatMap(g => (Array.isArray(g.mods) ? g.mods : []).map(mod => ({ mod, group: g.name || null })));
    }
    return [];
  }
  function findExistingMod(category, name) {
    const key = normalizeModName(name);
    if (!key || !category) return null;
    return listCategoryMods(category).find(x => x.mod && normalizeModName(x.mod.name) === key) || null;
  }
  function modIsReplaceable(mod) {
    return !S.styled && typeof mod.file === 'string' && /^[^\\/]+\.zip$/i.test(mod.file);
  }

  const S = {
    step: 0,
    maxStep: 0,
    archiveFile: null,
    archive: null,
    reading: false,
    update: null,
    prefillKey: '',
    autoFilledName: '',
    busy: false,
    cooldown: 0,
    cooldownTimer: null,
    turnstileId: null,
    previewUrl: null,
    allHeroes: [],
    styled: false,
    sub: 0,
    activeStyle: 0,
    slot2: { archiveFile: null, archive: null, reading: false }
  };

  let form, categorySelect, heroGroup, heroSearch, heroHidden, heroList, nameInput, nameSuggest;
  let slotTagsWrap, effectsTagsWrap, genericTagsWrap;

  const LOG_ICONS = { muted: 'info', info: 'info', progress: 'sync', success: 'check_circle', error: 'error' };

  function setLogState(state) {
    const i = $('upLogIcon');
    i.classList.remove('is-busy', 'is-success', 'is-error');
    if (state === 'busy') { i.textContent = 'sync'; i.classList.add('is-busy'); }
    else if (state === 'success') { i.textContent = 'check_circle'; i.classList.add('is-success'); }
    else if (state === 'error') { i.textContent = 'error'; i.classList.add('is-error'); }
    else i.textContent = 'terminal';
  }
  function clearLog(placeholder = 'Nothing yet') {
    $('upLogBody').textContent = '';
    logLine(placeholder, 'muted');
    setLogState('idle');
  }
  function logLine(message, type = 'info') {
    const body = $('upLogBody');
    if (type !== 'muted') {
      const kids = Array.from(body.children);
      if (kids.length && kids.every(k => k.classList.contains('muted'))) body.textContent = '';
    }
    const row = el('div', `up-log-entry ${type}`);
    row.append(icon(LOG_ICONS[type] || 'info'), el('span', '', message));
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }
  function updateLogLine(row, message) {
    if (!row) return;
    row.querySelector('span:last-child').textContent = message;
  }

  function validateArchiveFile(file) {
    if (!file) throw new Error('Please select an archive.');
    if (file.size > MAX_OUTER_ARCHIVE_BYTES) {
      throw new Error(`Archive is too large. Maximum size is ${Math.floor(MAX_OUTER_ARCHIVE_BYTES / 1024 / 1024)} MB.`);
    }
  }

  async function extractArchive(file, report) {
    validateArchiveFile(file);
    report('Reading the ZIP…');
    const buf = new Uint8Array(await file.arrayBuffer());
    let entries;
    try { entries = fflate.unzipSync(buf); } catch { throw new Error('The selected file is not a valid ZIP archive.'); }

    const names = Object.keys(entries);
    if (names.length > MAX_ARCHIVE_ENTRIES) throw new Error(`Archive contains too many files. Maximum is ${MAX_ARCHIVE_ENTRIES}.`);

    let total = 0;
    for (const name of names) {
      const data = entries[name];
      if (!(data instanceof Uint8Array)) continue;
      if (data.length > MAX_ENTRY_BYTES) throw new Error('Archive contains a file that is too large.');
      total += data.length;
      if (total > MAX_EXTRACTED_BYTES) throw new Error('Archive expands to too much data.');
      const normalized = name.replace(/\\/g, '/');
      if (normalized.startsWith('/') || normalized.split('/').includes('..')) throw new Error('Archive contains an unsafe file path.');
    }

    let modZip = null, preview = null, previewExt = null, folderName = null, otherImage = false, previewError = null;
    for (const name of names) {
      if (name.endsWith('/')) continue;
      const parts = name.split('/');
      if (parts.length > 1 && !folderName) folderName = parts[0];
      const lower = name.toLowerCase();
      if (lower.endsWith('.zip') && !modZip) modZip = entries[name];
      else if (/\.(webp|png|jpe?g)$/.test(lower)) {
        if (lower.endsWith('.webp')) { if (!preview) { preview = entries[name]; previewExt = 'webp'; } }
        else otherImage = true;
      }
    }
    if (preview) {
      if (preview.length > MAX_PREVIEW_BYTES) {
        preview = null; previewExt = null;
        previewError = `Preview image is too large (max ${MAX_PREVIEW_BYTES / 1024 / 1024} MB).`;
      } else if (!isWebpBytes(preview)) {
        preview = null; previewExt = null;
        previewError = 'The preview file is not a valid WebP image.';
      }
    } else if (otherImage) {
      previewError = 'The preview must be a WebP image (.webp). PNG/JPG previews are not accepted.';
    }
    if (!modZip) throw new Error('Archive must contain a .zip file with the mod inside it.');

    const hashEntryName = names.find(n => n.toLowerCase().split('/').pop() === 'hash.json');
    if (!hashEntryName) throw new Error('Archive is missing hashes');
    let hashData;
    try { hashData = JSON.parse(new TextDecoder('utf-8').decode(entries[hashEntryName])); }
    catch { throw new Error('hash.json is not valid JSON.'); }
    const expectedZip = String(hashData.vpk_zip_hash || '').toLowerCase().trim();
    const expectedVpk = String(hashData.vpk_hash || '').toLowerCase().trim();
    if (!/^[a-f0-9]{64}$/.test(expectedZip) || !/^[a-f0-9]{64}$/.test(expectedVpk)) {
      throw new Error('hash.json does not contain valid vpk_hash/vpk_zip_hash values (expected sha256 hex digests).');
    }

    report('Verifying integrity…');
    if ((await sha256Hex(modZip)) !== expectedZip) {
      throw new Error('Integrity check failed: the mod archive does not match. The file may be corrupted or was tampered with.');
    }
    let inner;
    try { inner = fflate.unzipSync(modZip); } catch { throw new Error('The inner mod archive is not a valid ZIP file.'); }
    const innerFiles = Object.keys(inner).filter(n => !n.endsWith('/'));
    const unexpected = innerFiles.find(n => !n.toLowerCase().endsWith('.vpk'));
    if (unexpected) throw new Error(`The mod archive must contain only a .vpk file. Unexpected file: ${unexpected}`);
    if (innerFiles.length === 0) throw new Error('The inner mod archive does not contain a .vpk file.');
    if (innerFiles.length > 1) throw new Error(`The mod archive must contain exactly one .vpk file (found ${innerFiles.length}).`);
    const vpk = inner[innerFiles[0]];
    if (!(vpk instanceof Uint8Array) || vpk.length > MAX_ENTRY_BYTES) throw new Error('The .vpk file inside the mod archive is too large or unreadable.');
    if ((await sha256Hex(vpk)) !== expectedVpk) {
      throw new Error('Integrity check failed: the .vpk file does not match. The file may be corrupted or was tampered with.');
    }
    return { modZip, preview, previewExt, previewError, folderName, zipHash: expectedZip };
  }

  function slotState(slot) { return slot ? S.slot2 : S; }
  function slotSfx(slot) { return slot ? '2' : ''; }
  function anyReading() { return S.reading || (S.styled && S.slot2.reading); }

  function setChecks(items, slot = 0) {
    const ul = $('upChecks' + slotSfx(slot));
    ul.textContent = '';
    for (const it of items) {
      const li = el('li', it.state);
      li.append(icon(it.state === 'ok' ? 'check_circle' : it.state === 'err' ? 'error' : 'progress_activity'), el('span', '', it.text));
      ul.appendChild(li);
    }
  }

  function resetArchiveUi(slot = 0) {
    const sfx = slotSfx(slot), st = slotState(slot);
    st.archive = null;
    st.archiveFile = null;
    st.reading = false;
    $('upDrop' + sfx).classList.remove('has-file', 'is-error');
    $('upArchiveLabel' + sfx).textContent = 'Drop archive here or click to browse';
    $('upArchiveSub' + sfx).textContent = 'ZIP made with PreMod · up to 100 MB';
    $('upChecks' + sfx).textContent = '';
  }

  async function handleArchiveFile(file, slot = 0) {
    const sfx = slotSfx(slot), st = slotState(slot);
    const who = S.styled ? `Style ${slot + 1}: ` : '';
    const drop = $('upDrop' + sfx);
    st.archive = null;
    st.archiveFile = null;
    drop.classList.remove('has-file', 'is-error');
    if (!file) { resetArchiveUi(slot); refreshAll(); return; }

    try { validateArchiveFile(file); }
    catch (err) {
      resetArchiveUi(slot);
      $('upArchive' + sfx).value = '';
      drop.classList.add('is-error');
      setChecks([{ state: 'err', text: err.message }], slot);
      refreshAll();
      return;
    }

    st.archiveFile = file;
    st.reading = true;
    drop.classList.add('has-file');
    $('upArchiveLabel' + sfx).textContent = file.name;
    $('upArchiveSub' + sfx).textContent = formatBytes(file.size);
    setChecks([{ state: 'busy', text: 'Checking your archive…' }], slot);
    setLogState('busy');
    const logRow = logLine(`${who}Reading archive…`, 'progress');
    refreshAll();

    try {
      await ensureFflate();
      const result = await extractArchive(file, msg => setChecks([{ state: 'busy', text: msg }], slot));
      if (st.archiveFile !== file) return;
      st.archive = result;

      if (slot === 0) {
        const baseName = stripExt(file.name);
        const hero = findHeroInText(baseName) || (result.folderName ? findHeroInText(result.folderName) : null);
        if (hero && HERO_AWARE_CATEGORIES.includes(categorySelect.value) && !heroHidden.value) selectHero(hero, { silent: true });
        const suggestion = suggestNameFromText(result.folderName || baseName);
        if (suggestion && (!nameInput.value.trim() || nameInput.value.trim() === S.autoFilledName)) {
          S.autoFilledName = setNameValue(suggestion);
        }
      }

      const checks = [
        { state: 'ok', text: 'Valid ZIP with an inner mod archive' },
        { state: 'ok', text: 'Integrity hashes match' },
        result.preview
          ? { state: 'ok', text: 'WebP preview image found' }
          : { state: 'err', text: result.previewError || 'No preview image found. A WebP preview is required.' }
      ];
      setChecks(checks, slot);
      if (result.preview) {
        updateLogLine(logRow, `${who}Archive OK`);
        logRow.className = 'up-log-entry success';
        logRow.querySelector('.material-symbols-rounded').textContent = 'check_circle';
        setLogState('idle');
      } else {
        drop.classList.add('is-error');
        logLine(who + (result.previewError || 'No preview image in the archive.'), 'error');
        setLogState('error');
      }
    } catch (err) {
      if (st.archiveFile !== file) return;
      drop.classList.add('is-error');
      setChecks([{ state: 'err', text: err.message }], slot);
      logLine(`${who}Archive error: ` + err.message, 'error');
      setLogState('error');
    } finally {
      if (st.archiveFile === file) {
        st.reading = false;
        detectUpdate();
        refreshAll();
      }
    }
  }

  function wireDropZone() {
    [0, 1].forEach(slot => {
      const sfx = slotSfx(slot);
      const drop = $('upDrop' + sfx);
      const input = $('upArchive' + sfx);
      input.addEventListener('change', () => handleArchiveFile(input.files[0], slot));
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
      drop.addEventListener('drop', e => {
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        try {
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
        } catch { }
        handleArchiveFile(file, slot);
      });
    });
  }

  function getStyleCfg(i) {
    return {
      label: $('upStyleLabel' + i).value.trim(),
      mode: getRadio('styleColorMode' + i) === 'two' ? 'two' : 'one',
      a: $('upStyleColorA' + i).value,
      b: $('upStyleColorB' + i).value
    };
  }
  function styleColors(i) {
    const c = getStyleCfg(i);
    return (c.mode === 'two' ? [c.a, c.b] : [c.a]).map(x => String(x).toLowerCase());
  }
  function colorsToCss(colors) {
    return colors.length > 1 ? `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` : colors[0];
  }
  function syncStyleCfgUi() {
    for (let i = 0; i < STYLE_COUNT; i++) show($('upStyleColorB' + i), getRadio('styleColorMode' + i) === 'two');
  }
  function applyStyledUi() {
    const on = S.styled;
    $('upStyledToggle').checked = on;
    show($('upArchiveDesc'), !on);
    show($('upArchiveDescStyled'), on);
    document.querySelectorAll('.up-style-cfg').forEach(n => show(n, on));
    if (!on) { S.sub = 0; S.activeStyle = 0; }
    syncStyleCfgUi();
    applySubUi();
  }
  function applySubUi() {
    const on = S.styled;
    const sub = on ? S.sub : 0;
    show($('upSlot0'), sub === 0);
    show($('upSlot1'), on && sub === 1);
    show($('upStyledToggle').closest('.up-switch'), !on || sub === 0);
    const titleEl = $('upArchiveTitle');
    const titleText = on ? `Style ${sub + 1} of ${STYLE_COUNT}` : 'Choose your archive';
    if (titleEl.textContent !== titleText) {
      titleEl.textContent = titleText;
      titleEl.classList.remove('up-swap');
      void titleEl.offsetWidth;
      titleEl.classList.add('up-swap');
    }
    const sec = document.querySelector('.up-step[data-step="0"]');
    if (sec) sec.classList.toggle('is-styled', on);

    show($('upStepperExtra'), on);
    let num = 1;
    document.querySelectorAll('#upStepper li').forEach(li => {
      if (li.hidden) return;
      li.querySelector('.up-step-dot').textContent = String(num++);
    });
    const first = document.querySelector('#upStepper li[data-step="0"] .up-step-label');
    if (first) first.textContent = on ? 'Style 1' : 'Archive';
  }
  function setSub(sub) {
    S.sub = sub;
    S.activeStyle = sub;
    updatePreviewCard();
  }
  function stepPos() { return S.step === 0 ? (S.styled ? S.sub * 0.5 : 0) : S.step; }
  function validateStyleCfg(count = STYLE_COUNT) {
    const seen = new Set();
    for (let i = 0; i < count; i++) {
      const c = getStyleCfg(i);
      if (!c.label) return `Style ${i + 1}: enter a style name.`;
      if (c.label.length > MAX_STYLE_LABEL || !STYLE_LABEL_RE.test(c.label)) {
        return `Style ${i + 1}: the name may contain English letters, digits, spaces and . _ - ! only (max ${MAX_STYLE_LABEL}).`;
      }
      const key = c.label.toLowerCase();
      if (seen.has(key)) return 'The two styles must have different names.';
      seen.add(key);
      if (!styleColors(i).every(h => HEX_RE.test(h))) return `Style ${i + 1}: invalid color.`;
    }
    return null;
  }
  function blockedMessage(mod) {
    if (S.styled) return `"${mod.name}" already exists in the catalog. A mod with styles can only be added as a new entry — choose a different name.`;
    if (Array.isArray(mod.styles) && mod.styles.length) return `"${mod.name}" has several styles, and updating mods with styles isn't supported here yet. Choose a different name or contact the moderators.`;
    return `"${mod.name}" is hosted outside the catalog, so its files can't be replaced from here. Choose a different name or contact the moderators.`;
  }

  function findHeroInText(text) {
    const norm = s => String(s || '').toLowerCase().replace(/[_\-.]+/g, ' ');
    const hay = norm(text);
    if (!hay) return null;
    let best = null;
    for (const hero of S.allHeroes) {
      const needle = norm(hero);
      if (needle && hay.includes(needle) && (!best || needle.length > norm(best).length)) best = hero;
    }
    return best;
  }
  function suggestNameFromText(raw) {
    const titled = toTitleCase(raw);
    const hero = findHeroInText(raw);
    if (!hero || hero === toTitleCase(hero)) return titled;
    const mangled = toTitleCase(hero);
    return titled.includes(mangled) ? titled.split(mangled).join(hero) : titled;
  }

  function currentMaxNameLength() { return getMaxNameLength(heroHidden.value); }

  function showNameTrim(badChars, overflow, max) {
    const box = $('upNameTrim');
    if (!badChars && !overflow) return;
    box.textContent = '';
    const add = (label, chars) => {
      if (!chars) return;
      const wrap = el('span', '', label + ' ');
      wrap.appendChild(el('mark', '', chars));
      wrap.append(' ');
      box.appendChild(wrap);
    };
    add('Removed (not allowed):', badChars);
    add(`Removed (over ${max} characters):`, overflow);
    box.hidden = false;
    clearTimeout(showNameTrim.timer);
    showNameTrim.timer = setTimeout(() => { box.hidden = true; }, 6000);
    nameInput.classList.remove('flash');
    void nameInput.offsetWidth;
    nameInput.classList.add('flash');
  }

  function syncNameField({ trimEdges = false } = {}) {
    const max = currentMaxNameLength();
    const raw = nameInput.value;
    const caret = nameInput.selectionStart == null ? raw.length : nameInput.selectionStart;
    const { kept: keptRaw, badChars, overflow } = cleanNameValue(raw, max);
    const kept = trimEdges ? keptRaw.trim() : keptRaw;
    if (kept !== raw) {
      nameInput.value = kept;
      if (document.activeElement === nameInput) {
        const pos = Math.min(cleanNameValue(raw.slice(0, caret), max).kept.length, kept.length);
        nameInput.setSelectionRange(pos, pos);
      }
    }
    $('upNameCount').textContent = String(kept.length);
    $('upNameMax').textContent = String(max);
    showNameTrim(badChars, overflow, max);
    return kept;
  }
  function setNameValue(v) { nameInput.value = v; return syncNameField({ trimEdges: true }); }

  function ensureHeroInName(hero) {
    if (!hero || S.update) return;
    const current = nameInput.value.trim();
    if (!current) { S.autoFilledName = setNameValue(hero); return; }
    if (current.toLowerCase().includes(hero.toLowerCase())) return;
    const combined = `${hero} ${current}`;
    if (combined.length <= getMaxNameLength(hero)) setNameValue(combined);
  }

  function buildHeroList(filter) {
    const q = (filter || '').toLowerCase().trim();
    heroList.textContent = '';
    const visible = q ? S.allHeroes.filter(h => h.toLowerCase().includes(q)) : S.allHeroes;
    if (!visible.length) { heroList.appendChild(el('div', 'up-combo-item muted', 'No heroes found')); return; }
    for (const h of visible) {
      const opt = el('div', 'up-combo-item', h);
      opt.setAttribute('role', 'option');
      opt.addEventListener('mousedown', ev => { ev.preventDefault(); selectHero(h); });
      heroList.appendChild(opt);
    }
  }

  function swapHeroInName(prev, next) {
    if (!prev || !next || S.update) return false;
    const cur = nameInput.value;
    const i = cur.toLowerCase().indexOf(prev.toLowerCase());
    if (i < 0 || prev.toLowerCase() === next.toLowerCase()) return false;
    const swapped = (cur.slice(0, i) + next + cur.slice(i + prev.length)).replace(/\s+/g, ' ').trim();
    if (swapped.length > getMaxNameLength(next)) return false;
    setNameValue(swapped);
    return true;
  }

  function selectHero(hero, { silent = false } = {}) {
    const prev = S.lastHero;
    heroHidden.value = hero;
    heroSearch.value = hero;
    heroList.classList.remove('open');
    syncNameField();
    if (!silent && !swapHeroInName(prev, hero)) ensureHeroInName(hero);
    S.lastHero = hero;
    onNameOrHeroChanged();
  }

  function renderCategorySelect() {
    categorySelect.textContent = '';
    const ph = el('option', '', 'Select category…');
    ph.value = '';
    categorySelect.appendChild(ph);
    for (const c of (window.categories || []).filter(c => !BLACKLISTED_CATEGORIES.includes(c.id))) {
      const o = el('option', '', tr(c.key, c.id));
      o.value = c.id;
      categorySelect.appendChild(o);
    }
    refreshSelect(categorySelect);
  }

  function renderNameSuggestions() {
    const list = nameSuggest;
    const cat = categorySelect.value;
    list.textContent = '';
    const q = nameInput.value.trim().toLowerCase();
    if (!cat || document.activeElement !== nameInput || q.length < 4) { list.classList.remove('open'); return; }
    const hero = heroHidden.value.toLowerCase();
    const matches = listCategoryMods(cat)
      .filter(x => x.mod && String(x.mod.name).toLowerCase().includes(q) && (!hero || !HERO_AWARE_CATEGORIES.includes(cat) || String(x.mod.name).toLowerCase().includes(hero)))
      .slice(0, 8);
    if (!matches.length) { list.classList.remove('open'); return; }
    list.appendChild(el('div', 'up-combo-item muted', 'Already in the catalog - pick one to update it'));
    for (const { mod } of matches) {
      const row = el('div', 'up-combo-item');
      row.setAttribute('role', 'option');
      row.append(el('span', '', mod.name), el('small', '', 'update'));
      row.addEventListener('mousedown', ev => {
        ev.preventDefault();
        nameInput.value = mod.name;
        syncNameField();
        list.classList.remove('open');
        onNameOrHeroChanged();
      });
      list.appendChild(row);
    }
    list.classList.add('open');
  }

  function onNameOrHeroChanged() {
    detectUpdate();
    updateNameHints();
    refreshAll();
  }

  function updateNameHints() {
    const hint = $('upNameHint');
    const max = currentMaxNameLength();
    $('upNameCount').textContent = String(nameInput.value.length);
    $('upNameMax').textContent = String(max);
    hint.classList.remove('up-hint-warn');
  }

  function detectUpdate() {
    const category = categorySelect.value;
    const name = nameInput.value.trim();
    const found = BLACKLISTED_CATEGORIES.includes(category) ? null : findExistingMod(category, name);
    const prevKey = S.prefillKey;
    const newKey = found ? `${category}::${normalizeModName(found.mod.name)}` : '';

    S.update = found;
    const banner = $('upUpdateBanner');
    const blocked = $('upBlockedBanner');
    show(banner, !!found && modIsReplaceable(found.mod));
    show(blocked, !!found && !modIsReplaceable(found.mod));
    if (found) {
      if (modIsReplaceable(found.mod)) {
        $('upUpdateBannerText').textContent =
          `"${found.mod.name}" is already in the catalog. Your archive replaces its files via a GitHub pull request; the author stays unchanged.`;
      } else {
        $('upBlockedBannerText').textContent = blockedMessage(found.mod);
      }
      if (HERO_AWARE_CATEGORIES.includes(category) && found.group && S.allHeroes.includes(found.group) && heroHidden.value !== found.group) {
        heroHidden.value = found.group;
        heroSearch.value = found.group;
        S.lastHero = found.group;
      }
    }

    if (newKey !== prevKey) {
      S.prefillKey = newKey;
      if (found) prefillFromExisting(found.mod);
      else resetDetails();
      applyUpdateModeUi();
    } else {
      applyUpdateModeUi();
    }
    syncPageTitle();
  }

  function syncPageTitle() {
    document.title = S.update ? 'Update mod — Dota2PornFx' : 'Upload mod — Dota2PornFx';
  }

  function resetDetails() {
    slotTagsWrap.querySelectorAll('input').forEach(i => { i.checked = false; });
    effectsTagsWrap.querySelectorAll('input').forEach(i => { i.checked = false; });
    genericTagsWrap.querySelectorAll('input').forEach(i => { i.checked = false; });
    $('upVideo').value = '';
    setRadio('extraMode', 'none');
    $('upExtraName').value = '';
    $('upExtraUrl').value = '';
    syncExtraUi();
    applyAuthorPref();
  }

  function prefillFromExisting(mod) {
    const tags = mod.tags && typeof mod.tags === 'object' ? mod.tags : {};
    for (const wrap of [slotTagsWrap, effectsTagsWrap, genericTagsWrap]) {
      wrap.querySelectorAll('input').forEach(i => { i.checked = tags[i.value] === true; });
    }
    const links = Array.isArray(mod.links) ? mod.links : [];
    const video = links.find(l => l && l.type === 'preview' && typeof l.url === 'string');
    $('upVideo').value = video ? video.url : '';
    const extra = links.find(l => l && (l.type === 'source' || l.type === 'modded') && typeof l.url === 'string');
    if (extra) {
      setRadio('extraMode', extra.type);
      setRadio('extraOriginMode', 'existing');
      syncExtraUi();
      const sel = $('upExtraExisting');
      if (Array.from(sel.options).some(o => o.value === extra.url)) setSelectValue(sel, extra.url);
    } else {
      setRadio('extraMode', 'none');
      syncExtraUi();
    }
  }

  function lockedAuthorLinks(mod) {
    return (Array.isArray(mod.links) ? mod.links : []).filter(l => l && (
      (l.type === 'author' && l.url) || (l.type === 'sender' && (l.url || l.name))
    ));
  }

  function applyUpdateModeUi() {
    const upd = S.update && modIsReplaceable(S.update.mod) ? S.update : null;
    const authorGroup = $('upAuthorExisting').closest('.up-field-group');
    show($('upAuthorLocked'), !!upd);
    show(authorGroup, !upd);

    const coAuthorLabel = form.querySelector('input[name="extraMode"][value="author"]').closest('label');
    show(coAuthorLabel, !upd);
    if (upd && getRadio('extraMode') === 'author') { setRadio('extraMode', 'none'); syncExtraUi(); }

    if (upd) {
      const names = $('upAuthorLockedNames');
      names.textContent = '';
      const locked = lockedAuthorLinks(upd.mod);
      if (!locked.length) names.appendChild(el('span', '', 'No author listed'));
      for (const l of locked) names.appendChild(el('span', '', l.type === 'sender' && l.name ? l.name : l.url));
      $('upCreditsDesc').textContent = 'The author is fixed for updates. You can add or change a source / "modded by" link and the video below.';
      $('upReviewDesc').textContent = 'This will open a pull request that replaces the existing files of this mod once approved.';
      $('upSubmitText').textContent = S.busy ? 'Uploading…' : 'Submit update';
    } else {
      $('upCreditsDesc').textContent = 'Who made this mod?';
      $('upReviewDesc').textContent = 'Check everything below, then send it for moderation.';
      $('upSubmitText').textContent = S.busy ? 'Uploading…' : 'Submit for review';
    }
    $('upNext').parentElement;
  }

  function renderTags(categoryId) {
    slotTagsWrap.textContent = '';
    effectsTagsWrap.textContent = '';
    genericTagsWrap.textContent = '';
    show($('upSlotGroup'), false);
    show($('upEffectsGroup'), false);
    show($('upGenericGroup'), false);

    const cfg = (window.TAG_CONFIGS || {})[categoryId];
    const hasTags = !!(cfg && cfg.map && Object.keys(cfg.map).length);
    show($('upTagsGroup'), hasTags);
    show($('upNoTags'), !!categoryId && !hasTags);
    if (!hasTags) return;

    const slotTags = categoryId === 'hero-items' ? getSlotTags(categoryId) : [];
    let hasSlot = false, hasEffects = false, hasGeneric = false;
    const chip = (type, key, label, wrap, extraClass = '') => {
      const l = el('label', 'up-chip' + extraClass);
      if (TAG_DESCRIPTIONS[key]) l.title = TAG_DESCRIPTIONS[key];
      const input = document.createElement('input');
      input.type = type;
      input.value = key;
      if (type === 'radio') input.name = 'slotTag';
      input.addEventListener('change', () => { refreshAll(); });
      l.append(input, ' ' + label);
      wrap.appendChild(l);
    };
    const hiddenTags = UPLOAD_HIDDEN_TAGS[categoryId] || [];
    for (const [key, label] of Object.entries(cfg.map)) {
      if (hiddenTags.includes(key)) continue;
      if (slotTags.includes(key)) { chip('radio', key, label, slotTagsWrap, ' up-chip-slot'); hasSlot = true; }
      else if (categoryId === 'hero-items' && (key === 'effects' || key === 'icons')) { chip('checkbox', key, label, effectsTagsWrap); hasEffects = true; }
      else { chip('checkbox', key, label, genericTagsWrap); hasGeneric = true; }
    }
    show($('upSlotGroup'), hasSlot);
    show($('upEffectsGroup'), hasEffects);
    show($('upGenericGroup'), hasGeneric);
  }

  function selectedTags() {
    const tags = {};
    const slot = slotTagsWrap.querySelector('input:checked');
    if (slot) tags[slot.value] = true;
    effectsTagsWrap.querySelectorAll('input:checked').forEach(i => { tags[i.value] = true; });
    genericTagsWrap.querySelectorAll('input:checked').forEach(i => { tags[i.value] = true; });
    return tags;
  }

  function getRadio(name) { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : null; }
  function setRadio(name, value) {
    const r = form.querySelector(`input[name="${name}"][value="${value}"]`);
    if (r) r.checked = true;
  }
  function fillSelect(select, values, placeholder) {
    select.textContent = '';
    const ph = el('option', '', placeholder);
    ph.value = '';
    select.appendChild(ph);
    for (const v of values) { const o = el('option', '', v); o.value = v; select.appendChild(o); }
    refreshSelect(select);
  }

  function syncAuthorUi() {
    const mode = getRadio('authorMode');
    showSelect($('upAuthorExisting'), mode === 'existing');
    show($('upAuthorNew'), mode === 'new');
    checkAuthorDuplicate();
  }
  function syncExtraUi() {
    const mode = getRadio('extraMode');
    show($('upExtraFields'), mode !== 'none');
    if (mode === 'none') {
      $('upExtraName').value = '';
      $('upExtraUrl').value = '';
      return;
    }
    const registry = mode === 'source' ? window.MOD_SOURCES : window.MOD_AUTHOR;
    const current = $('upExtraExisting').value;
    fillSelect($('upExtraExisting'), Object.keys(registry || {}).sort(), mode === 'source' ? 'Select source…' : 'Select author…');
    if (current && registry && Object.prototype.hasOwnProperty.call(registry, current)) setSelectValue($('upExtraExisting'), current);
    const origin = getRadio('extraOriginMode');
    showSelect($('upExtraExisting'), origin === 'existing');
    show($('upExtraNew'), origin === 'new');
    checkExtraDuplicate();
  }

  function checkAuthorDuplicate() {
    const hint = $('upAuthorDup');
    const nick = $('upAuthorName').value.trim();
    if (getRadio('authorMode') !== 'new' || !nick) { show(hint, false); return false; }
    const match = Object.keys(window.MOD_AUTHOR || {}).find(a => normalizeModName(a) === normalizeModName(nick));
    if (match) hint.textContent = `An author named "${match}" already exists — choose "Existing" instead.`;
    show(hint, !!match);
    return !!match;
  }
  function checkExtraDuplicate() {
    const hint = $('upExtraDup');
    const mode = getRadio('extraMode');
    const value = $('upExtraName').value.trim();
    if (mode === 'none' || getRadio('extraOriginMode') !== 'new' || !value) { show(hint, false); return false; }
    const registry = mode === 'source' ? window.MOD_SOURCES : window.MOD_AUTHOR;
    const match = Object.keys(registry || {}).find(a => normalizeModName(a) === normalizeModName(value));
    if (match) hint.textContent = `A ${mode === 'source' ? 'source' : 'author'} named "${match}" already exists — choose "Existing" instead.`;
    show(hint, !!match);
    return !!match;
  }

  function applyAuthorPref() {
    if (S.update) return;
    const pref = loadAuthorPref();
    if (!pref) return;
    const authors = window.MOD_AUTHOR || {};
    let mode = pref.mode;
    let name = String(pref.name || '');
    if (mode === 'new' && name) {
      const match = Object.keys(authors).find(a => normalizeModName(a) === normalizeModName(name));
      if (match) { mode = 'existing'; name = match; }
    }
    if (mode === 'existing' && !Object.prototype.hasOwnProperty.call(authors, name)) return;
    if (mode === 'new' && !name) return;
    if (!['existing', 'new', 'skip'].includes(mode)) return;
    setRadio('authorMode', mode);
    if (mode === 'existing') setSelectValue($('upAuthorExisting'), name);
    if (mode === 'new') { $('upAuthorName').value = name; $('upAuthorUrl').value = pref.url || ''; }
    syncAuthorUi();
  }
  function persistAuthorPref() {
    const mode = getRadio('authorMode');
    if (mode === 'existing') { if ($('upAuthorExisting').value) saveAuthorPref({ mode, name: $('upAuthorExisting').value }); }
    else if (mode === 'new') {
      const name = $('upAuthorName').value.trim();
      if (name) saveAuthorPref({ mode, name, url: $('upAuthorUrl').value.trim() });
    } else if (mode === 'skip') saveAuthorPref({ mode });
  }

  function previewLinkButton(type, text) {
    const b = el('span', 'link-button');
    if (type !== 'author') b.setAttribute('data-custom-name', 'false');
    else b.setAttribute('data-custom-name', 'true');
    b.append(icon((window.LINK_ICONS || {})[type] || 'link'), text);
    return b;
  }

  function currentCredits() {
    const out = { author: null, authors: [], extra: null, video: null };
    if (S.update && modIsReplaceable(S.update.mod)) {
      const locked = lockedAuthorLinks(S.update.mod);
      out.authors = locked.map(l => (l.type === 'sender' && l.name ? l.name : l.url))
        .flatMap(n => String(n).split(/\s*,\s*/)).filter(Boolean);
      out.author = out.authors.join(', ') || null;
    } else {
      const mode = getRadio('authorMode');
      if (mode === 'existing') out.author = $('upAuthorExisting').value || null;
      else if (mode === 'new') out.author = $('upAuthorName').value.trim() || null;
      if (out.author) out.authors = [out.author];
    }
    const extraMode = getRadio('extraMode');
    if (extraMode && extraMode !== 'none') {
      const value = getRadio('extraOriginMode') === 'existing' ? $('upExtraExisting').value : $('upExtraName').value.trim();
      if (value) out.extra = { type: extraMode, value };
    }
    const v = $('upVideo').value.trim();
    if (v && isYouTubeUrl(v) && getPreviewVideoCategories().includes(categorySelect.value)) out.video = v;
    return out;
  }

  function updatePreviewCard() {
    const name = (S.update && modIsReplaceable(S.update.mod)) ? S.update.mod.name : nameInput.value.trim();
    $('upPreviewTitle').textContent = name || 'Mod name';
    const catOpt = categorySelect.selectedOptions[0];
    $('upPreviewSubtitle').textContent = catOpt && catOpt.value ? catOpt.textContent : 'Category';

    const buttons = $('upPreviewButtons');
    buttons.textContent = '';
    const c = currentCredits();
    for (const a of c.authors) buttons.appendChild(previewLinkButton('author', a));
    if (c.extra) buttons.appendChild(previewLinkButton(c.extra.type, c.extra.value));
    if (c.video) buttons.appendChild(previewLinkButton('preview', tr('preview', 'Preview')));

    const media = $('upPreviewMedia');
    const shownSt = S.styled && S.activeStyle === 1 ? S.slot2 : S;
    const previewData = shownSt.archive && shownSt.archive.preview ? shownSt.archive.preview : null;
    if (S.previewShown !== previewData || !media.firstElementChild) {
      media.textContent = '';
      if (S.previewUrl) { URL.revokeObjectURL(S.previewUrl); S.previewUrl = null; }
      if (previewData) {
        S.previewUrl = URL.createObjectURL(new Blob([previewData], { type: 'image/webp' }));
        const img = document.createElement('img');
        img.src = S.previewUrl;
        media.appendChild(img);
      } else {
        media.appendChild(el('span', 'up-preview-placeholder', '\u{1F9E9}'));
      }
      S.previewShown = previewData;
    }
    const shownImg = media.querySelector('img');
    if (shownImg) shownImg.alt = name;
    media.querySelectorAll('.mod-tags, .style-circles').forEach(n => n.remove());

    const catId = categorySelect.value;
    const tagMap = ((window.TAG_CONFIGS || {})[catId] || {}).map || {};
    const slotTags = getSlotTags(catId);
    const tags = Object.keys(selectedTags());
    if (tags.length) {
      const wrap = el('div', 'mod-tags');
      for (const k of tags) {
        const t = el('span', 'mod-tag' + (slotTags.includes(k) ? ' mod-tag--slot' : ''), tagMap[k] || k);
        if (TAG_DESCRIPTIONS[k]) t.title = TAG_DESCRIPTIONS[k];
        wrap.appendChild(t);
      }
      media.appendChild(wrap);
    }

    if (S.styled) {
      const circles = el('div', 'style-circles');
      for (let i = 0; i < STYLE_COUNT; i++) {
        const c = el('span', 'style-circle' + (i === S.activeStyle ? ' active' : ''));
        c.dataset.styleIndex = String(i);
        c.style.background = colorsToCss(styleColors(i));
        c.title = getStyleCfg(i).label;
        c.addEventListener('click', e => {
          e.stopPropagation();
          S.activeStyle = i;
          updatePreviewCard();
        });
        circles.appendChild(c);
      }
      media.appendChild(circles);
    }
  }

  function validateStep(step, full = false) {
    const category = categorySelect.value;
    const upd = S.update && modIsReplaceable(S.update.mod) ? S.update : null;

    if (step === 0) {
      if (anyReading()) return 'Still checking your archive — one moment.';
      const allSlots = S.styled ? [S, S.slot2] : [S];
      const upTo = !full && S.styled && S.step === 0 ? S.sub + 1 : allSlots.length;
      const slots = allSlots.slice(0, upTo);
      for (let i = 0; i < slots.length; i++) {
        const st = slots[i];
        const who = S.styled ? `Style ${i + 1}: ` : '';
        if (!st.archiveFile) return `${who}Choose the archive made with PreMod first.`;
        if (!st.archive) return `${who}The archive could not be read. Check the messages above or choose another file.`;
        if (!st.archive.preview) return who + (st.archive.previewError || 'This archive has no preview image. A mod preview is required.');
      }
      if (S.styled) {
        const cfgErr = validateStyleCfg(upTo);
        if (cfgErr) return cfgErr;
      }
      if (S.styled && upTo === STYLE_COUNT) {
        if (S.archive.zipHash === S.slot2.archive.zipHash) return 'Both styles contain the same mod file. Each style needs its own archive.';
        const total = S.archive.modZip.length + S.slot2.archive.modZip.length;
        if (total > MAX_STYLED_TOTAL_BYTES) {
          return `The two mod files together are ${formatBytes(total)}. The limit for a mod with styles is ${Math.floor(MAX_STYLED_TOTAL_BYTES / 1024 / 1024)} MB in total.`;
        }
      }
    }

    if (step === 1) {
      if (!category) return 'Select a category.';
      if (BLACKLISTED_CATEGORIES.includes(category) || !(window.categories || []).some(c => c.id === category)) {
        return 'This category is temporarily unavailable for new submissions.';
      }
      const hero = heroHidden.value.trim();
      if (HERO_AWARE_CATEGORIES.includes(category)) {
        if (!hero) return 'Select a hero for this category.';
        if (!(window.HEROES_LIST || []).includes(hero)) return 'Invalid hero.';
      }
      const name = nameInput.value.trim();
      if (!name) return 'Enter a mod name.';
      if (S.update && !modIsReplaceable(S.update.mod)) return blockedMessage(S.update.mod);
      if (!upd) {
        const max = getMaxNameLength(hero);
        if (name.length > max || !MOD_NAME_RE.test(name)) return `Invalid mod name (max ${max} characters, English letters/numbers only).`;
        if (MISPLACED_HYPHEN_RE.test(name)) return 'A hyphen is allowed only inside a word (e.g. "big-cat"), not with spaces around it ("big - cat").';
        if (HERO_AWARE_CATEGORIES.includes(category) && hero) {
          const lower = name.toLowerCase();
          if (!lower.includes(hero.toLowerCase())) return `The mod name must include the hero name "${hero}".`;
          const rest = lower.split(hero.toLowerCase()).join(' ').replace(/[^a-z0-9]/g, '');
          if (!rest) return `Add a title after the hero name (e.g. "${hero} Origin"). The name can't be just "${hero}".`;
        }
      }
    }

    if (step === 2) {
      if (category === 'hero-items' && slotTagsWrap.querySelector('input') && !slotTagsWrap.querySelector('input:checked')) {
        return 'Select a slot for the hero item.';
      }
      const v = $('upVideo').value.trim();
      if (v && !getPreviewVideoCategories().includes(category)) return 'This category does not accept a preview video.';
      if (v && !isYouTubeUrl(v)) return 'Preview video must be a youtube.com / youtu.be link.';
    }

    if (step === 3) {
      if (!upd) {
        const mode = getRadio('authorMode');
        if (mode === 'existing') {
          const v = $('upAuthorExisting').value;
          if (!v) return 'Select an author, or choose "New" / "None".';
          if (!SAFE_TEXT_RE.test(v)) return `Author name: ${NICK_HINT}.`;
        } else if (mode === 'new') {
          const nick = $('upAuthorName').value.trim();
          if (!nick) return 'Enter the author nickname.';
          if (nick.length > 150 || !NICK_RE.test(nick)) return `Author name: ${NICK_HINT}.`;
          const url = $('upAuthorUrl').value.trim();
          if (url && !isAllowedHttpUrl(url)) return 'Author profile link is invalid.';
          if (checkAuthorDuplicate()) return 'That author already exists — choose "Existing" instead.';
        }
      }
      const extraMode = getRadio('extraMode');
      if (extraMode && extraMode !== 'none') {
        const label = extraMode === 'source' ? 'source' : extraMode === 'modded' ? '"modded by" author' : 'co-author';
        if (getRadio('extraOriginMode') === 'existing') {
          const v = $('upExtraExisting').value;
          if (!v) return `Select a ${label}, or switch to "New".`;
          if (!SAFE_TEXT_RE.test(v)) return `Additional link: ${NICK_HINT}.`;
        } else {
          const v = $('upExtraName').value.trim();
          if (!v) return `Enter the ${label} name.`;
          if (v.length > 150 || !NICK_RE.test(v)) return `Additional link: ${NICK_HINT}.`;
          const url = $('upExtraUrl').value.trim();
          if (url && !isAllowedHttpUrl(url)) return 'Additional link URL is invalid.';
          if (checkExtraDuplicate()) return 'That name already exists — choose "Existing" instead.';
        }
      }
    }
    return null;
  }

  function showStepError(msg) {
    if (msg && S.cooldown > 0 && /too many|rate.?limit/i.test(String(msg))) msg = '';
    const box = $('upStepError');
    box.textContent = msg || '';
    box.hidden = !msg;
  }

  function refreshAll() {
    if (!$('upStepError').hidden && !S.busy && S.step < STEP_COUNT - 1) showStepError(validateStep(S.step) || '');
    updatePreviewCard();
    updateNav();
  }

  function updateNav() {
    const last = S.step === STEP_COUNT - 1;
    $('upPrev').style.visibility = (S.step === 0 && (!S.styled || S.sub === 0)) || S.busy ? 'hidden' : 'visible';
    show($('upNext'), !last);
    show($('upSubmit'), last);
    $('upNext').disabled = anyReading();
    $('upSubmit').disabled = S.busy || S.cooldown > 0;
    $('upSubmitIcon').textContent = S.busy ? 'progress_activity' : 'send';
    $('upSubmitIcon').classList.toggle('is-busy', S.busy);

    applySubUi();
    show($('upCooldown'), S.cooldown > 0 && S.step === STEP_COUNT - 1);
    const pos = stepPos();
    document.querySelectorAll('#upStepper li').forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('active', n === pos);
      li.classList.toggle('done', n < pos);
      li.style.cursor = n < pos && !S.busy && !stepSkipped(Math.ceil(n)) ? 'pointer' : '';
    });
    document.querySelectorAll('.up-step').forEach(sec => { sec.hidden = Number(sec.dataset.step) !== S.step; });
  }

  function stepSkipped(n) {
    if (n !== 2) return false;
    const cat = categorySelect.value;
    const cfg = (window.TAG_CONFIGS || {})[cat];
    const hasTags = !!(cfg && cfg.map && Object.keys(cfg.map).length);
    return !hasTags && !getPreviewVideoCategories().includes(cat);
  }
  function neighbourStep(from, dir) {
    let n = from + dir;
    while (n > 0 && n < STEP_COUNT - 1 && stepSkipped(n)) n += dir;
    return n;
  }

  function goToStep(n) {
    S.step = Math.max(0, Math.min(STEP_COUNT - 1, n));
    S.maxStep = Math.max(S.maxStep, S.step);
    showStepError('');
    if (S.step === 4) enterReviewStep();
    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function tryNext() {
    if (S.busy) return;
    if (S.step === 0 && S.styled && S.sub < STYLE_COUNT - 1) {
      const subErr = validateStep(0);
      if (subErr) { showStepError(subErr); return; }
      showStepError('');
      setSub(S.sub + 1);
      updateNav();
      return;
    }
    if (S.step === 1) {
      if (S.update && modIsReplaceable(S.update.mod)) setNameValue(S.update.mod.name);
      else setNameValue(titleCaseWords(nameInput.value));
      ensureHeroInName(heroHidden.value);
      detectUpdate();
    }
    const err = validateStep(S.step);
    if (err) { showStepError(err); return; }
    goToStep(neighbourStep(S.step, 1));
  }

  function row(dl, label, value) {
    dl.append(el('dt', '', label), el('dd', '', value));
  }

  function enterReviewStep() {
    const dl = $('upSummary');
    dl.textContent = '';
    const upd = S.update && modIsReplaceable(S.update.mod) ? S.update : null;
    const category = categorySelect.value;
    const tagMap = ((window.TAG_CONFIGS || {})[category] || {}).map || {};
    const tags = Object.keys(selectedTags()).map(k => tagMap[k] || k);
    const credits = currentCredits();

    row(dl, 'Action', upd ? 'Update an existing mod (replaces its files)' : (S.styled ? 'New mod with 2 styles' : 'New mod'));
    row(dl, 'Name', upd ? upd.mod.name : nameInput.value.trim());
    row(dl, 'Category', categorySelect.selectedOptions[0] ? categorySelect.selectedOptions[0].textContent : category);
    if (HERO_AWARE_CATEGORIES.includes(category)) row(dl, 'Hero', heroHidden.value || '—');
    if (S.styled) {
      for (let i = 0; i < STYLE_COUNT; i++) {
        const st = slotState(i);
        const dd = el('dd');
        const sw = el('span', 'up-swatch');
        sw.style.background = colorsToCss(styleColors(i));
        dd.append(sw, `${getStyleCfg(i).label} · ${st.archiveFile ? `${st.archiveFile.name} (${formatBytes(st.archiveFile.size)})` : '—'}`);
        dl.append(el('dt', '', `Style ${i + 1}`), dd);
      }
    } else {
      row(dl, 'Archive', S.archiveFile ? `${S.archiveFile.name} (${formatBytes(S.archiveFile.size)})` : '—');
    }
    row(dl, 'Tags', tags.length ? tags.join(', ') : '—');
    row(dl, upd ? 'Author (locked)' : 'Author', credits.author || '—');
    if (credits.extra) row(dl, { source: 'Source', modded: 'Modded by', author: 'Co-author' }[credits.extra.type] || 'Link', credits.extra.value);
    if (credits.video) row(dl, 'Preview video', credits.video);

    initTurnstile();
    refreshCooldownFromServer();
  }

  async function initTurnstile({ quiet = false } = {}) {
    const box = $('upTurnstile');
    try {
      await ensureTurnstile();
    } catch {
      if (!quiet) showStepError('Could not load the captcha. Check your connection (or an ad-blocker) and reload.');
      return;
    }
    if (S.turnstileId !== null || S.turnstileRendering) return;
    S.turnstileRendering = true;
    S.turnstileId = turnstile.render(box, {
      sitekey: box.dataset.sitekey,
      theme: 'auto',
      appearance: 'interaction-only',
      action: 'submit_mod'
    });
    S.turnstileRendering = false;
  }
  function resetTurnstile() { if (S.turnstileId !== null) { try { turnstile.reset(S.turnstileId); } catch { } } }

  function renderCooldown() {
    $('upCooldownText').textContent = `Next mod in ${formatCooldown(S.cooldown)}`;
    updateNav();
  }
  function clearCooldown() {
    clearInterval(S.cooldownTimer);
    S.cooldownTimer = null;
    S.cooldown = 0;
    updateNav();
  }
  function startCooldown(seconds) {
    clearInterval(S.cooldownTimer);
    S.cooldownTimer = null;
    S.cooldown = Math.ceil(Number(seconds) || 0);
    if (S.cooldown <= 0) { clearCooldown(); return; }
    renderCooldown();
    S.cooldownTimer = setInterval(() => {
      S.cooldown -= 1;
      if (S.cooldown <= 0) clearCooldown(); else renderCooldown();
    }, 1000);
  }
  async function refreshCooldownFromServer() {
    try {
      const res = await fetch(`${WORKER_BASE_URL}/api/status`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.nextSubmitInSeconds > 0) startCooldown(data.nextSubmitInSeconds); else clearCooldown();
    } catch { }
  }

  let progressFrame = null, trickleTimer = null, shownPct = 0;
  function renderProgress(pct) {
    const v = Math.min(100, Math.max(0, pct));
    $('upProgressBar').value = v;
    $('upProgressPct').textContent = Math.round(v) + '%';
    shownPct = v;
  }
  function animateProgressTo(target, duration = 300) {
    target = Math.min(100, Math.max(0, target));
    if (progressFrame) cancelAnimationFrame(progressFrame);
    const start = shownPct, delta = target - start;
    if (Math.abs(delta) < 0.05 || duration <= 0) { renderProgress(target); return; }
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / duration);
      renderProgress(start + delta * (1 - Math.pow(1 - t, 3)));
      progressFrame = t < 1 ? requestAnimationFrame(step) : null;
    };
    progressFrame = requestAnimationFrame(step);
  }
  function startTrickle() {
    stopTrickle();
    trickleTimer = setInterval(() => animateProgressTo(shownPct + (96 - shownPct) * 0.12, 650), 650);
  }
  function stopTrickle() { clearInterval(trickleTimer); trickleTimer = null; }
  function showProgress() { show($('upProgressWrap'), true); renderProgress(0); }
  function hideProgress() {
    stopTrickle();
    if (progressFrame) { cancelAnimationFrame(progressFrame); progressFrame = null; }
    show($('upProgressWrap'), false);
    renderProgress(0);
  }

  function xhrUpload(fd, onProgress, onSent) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${WORKER_BASE_URL}/api/submit`);
      let sent = false;
      xhr.upload.addEventListener('progress', ev => {
        if (!ev.lengthComputable) return;
        const pct = (ev.loaded / ev.total) * 100;
        onProgress(pct);
        if (pct >= 99.9 && !sent) { sent = true; onSent(); }
      });
      xhr.addEventListener('load', () => {
        if (!sent) onSent();
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status < 200 || xhr.status >= 300 || data.error) {
            reject(Object.assign(new Error(data.message || data.error || `HTTP ${xhr.status}`), { data }));
          } else resolve(data);
        } catch { reject(new Error('Invalid server response')); }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('timeout', () => reject(new Error('Request timed out')));
      xhr.send(fd);
    });
  }

  function buildFormData() {
    if (S.turnstileId === null) throw new Error('Captcha is not ready. Please wait a moment and try again.');
    const token = turnstile.getResponse(S.turnstileId);
    if (!token) throw new Error('Please complete the captcha.');

    const upd = S.update && modIsReplaceable(S.update.mod) ? S.update : null;
    const category = categorySelect.value;
    const name = upd ? upd.mod.name : nameInput.value.trim();

    const fd = new FormData();
    fd.set('cf-turnstile-response', token);
    fd.set('mode', upd ? 'update' : 'new');
    if (upd) fd.set('existingName', upd.mod.name);
    fd.set('name', name);
    fd.set('category', category);
    fd.set('hero', HERO_AWARE_CATEGORIES.includes(category) ? (heroHidden.value || '') : '');
    fd.set('tags', JSON.stringify(selectedTags()));

    if (!upd) {
      const authorMode = getRadio('authorMode');
      fd.set('authorMode', authorMode);
      if (authorMode === 'existing') fd.set('authorName', $('upAuthorExisting').value);
      else if (authorMode === 'new') {
        fd.set('authorName', $('upAuthorName').value.trim());
        fd.set('authorUrl', $('upAuthorUrl').value.trim());
      }
    }
    const extraMode = getRadio('extraMode') || 'none';
    fd.set('extraMode', extraMode);
    if (extraMode !== 'none') {
      if (getRadio('extraOriginMode') === 'existing') fd.set('extraExistingName', $('upExtraExisting').value);
      else {
        fd.set('extraName', $('upExtraName').value.trim());
        fd.set('extraUrl', $('upExtraUrl').value.trim());
      }
    }
    const video = $('upVideo').value.trim();
    if (video && getPreviewVideoCategories().includes(category)) fd.set('previewVideo', video);

    fd.set('modZip', new Blob([S.archive.modZip]), `${name}.zip`);
    fd.set('preview', new Blob([S.archive.preview]), `${name}.${S.archive.previewExt}`);

    if (S.styled) {
      fd.set('styled', '1');
      fd.set('styles', JSON.stringify([0, 1].map(i => ({ label: getStyleCfg(i).label, colors: styleColors(i) }))));
      fd.set('modZip2', new Blob([S.slot2.archive.modZip]), `${name} Style 2.zip`);
      fd.set('preview2', new Blob([S.slot2.archive.preview]), `${name} Style 2.${S.slot2.archive.previewExt}`);
    }
    return fd;
  }

  function setBusy(busy) {
    S.busy = busy;
    $('upSubmitText').textContent = busy ? 'Uploading…' : (S.update ? 'Submit update' : 'Submit for review');
    form.querySelectorAll('input, select, button').forEach(c => {
      if (c.id === 'upSubmit') return;
      if (busy) { c.dataset.wasDisabled = c.disabled ? '1' : ''; c.disabled = true; }
      else if (c.dataset.wasDisabled !== undefined) { c.disabled = c.dataset.wasDisabled === '1'; delete c.dataset.wasDisabled; }
    });
    updateNav();
  }

  function showDone(data, wasUpdate) {
    const modName = (S.update && modIsReplaceable(S.update.mod)) ? S.update.mod.name : nameInput.value.trim();
    const catOpt = categorySelect.selectedOptions[0];
    const catName = catOpt && catOpt.value ? catOpt.textContent : '';

    form.hidden = true;
    $('upStepper').hidden = true;
    const old = $('upDone');
    if (old) old.remove();

    const box = el('div', 'up-done');
    box.id = 'upDone';
    box.setAttribute('role', 'status');

    const badge = el('div', 'up-done-badge');
    badge.appendChild(icon('check'));
    box.appendChild(badge);

    box.appendChild(el('h2', 'up-done-title', wasUpdate ? 'Update submitted' : 'Mod submitted'));
    box.appendChild(el('p', 'up-done-text', wasUpdate
      ? 'Your update is awaiting moderation as a pull request. Once approved, it replaces the existing files.'
      : 'Your mod is awaiting moderation. Once approved it will appear in the catalog.'));

    if (modName) {
      const meta = el('div', 'up-done-meta');
      meta.append(icon(wasUpdate ? 'sync_alt' : 'extension'), el('span', 'up-done-meta-name', modName));
      if (catName) meta.appendChild(el('span', 'up-done-meta-cat', catName));
      box.appendChild(meta);
    }

    const steps = el('ol', 'up-done-steps');
    [
      ['Submitted', 'done'],
      ['On moderation', 'active'],
      [wasUpdate ? 'Files replaced' : 'Published', '']
    ].forEach(([label, state]) => {
      const li = el('li', state);
      li.append(el('span', 'up-done-dot'), el('span', '', label));
      steps.appendChild(li);
    });
    box.appendChild(steps);

    const href = safeGithubUrl(data && data.prUrl);
    const actions = el('div', 'up-done-actions');
    const again = el('button', 'up-btn up-btn-primary', '');
    again.type = 'button';
    again.append(icon('add'), el('span', '', 'Submit another'));
    again.addEventListener('click', () => { box.remove(); form.hidden = false; $('upStepper').hidden = false; resetWizard(); });
    actions.appendChild(again);
    if (href) {
      const a = el('a', 'up-btn up-btn-outline', '');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.append(icon('open_in_new'), el('span', '', 'View pull request'));
      actions.appendChild(a);
    }
    box.appendChild(actions);

    form.parentNode.insertBefore(box, form);
    again.focus({ preventScroll: true });
  }

  async function submit() {
    if (S.busy) return;
    if (S.update && modIsReplaceable(S.update.mod)) setNameValue(S.update.mod.name);
    for (let i = 0; i < STEP_COUNT - 1; i++) {
      const err = validateStep(i, true);
      if (err) {
        if (i === 0 && S.styled) setSub(/^Style 1/.test(err) ? 0 : STYLE_COUNT - 1);
        goToStep(i);
        showStepError(err);
        return;
      }
    }
    let fd;
    try { fd = buildFormData(); }
    catch (err) { showStepError(err.message); return; }

    const upd = S.update && modIsReplaceable(S.update.mod);
    const label = upd ? S.update.mod.name : nameInput.value.trim();
    showStepError('');
    persistAuthorPref();
    setBusy(true);
    showProgress();
    setLogState('busy');
    logLine(`${upd ? 'Updating' : 'Preparing'} "${label}"…`, 'info');
    const uploadRow = logLine('Uploading to server… 0%', 'progress');
    const guard = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', guard);

    try {
      const data = await xhrUpload(
        fd,
        pct => { animateProgressTo(pct * 0.9, 220); updateLogLine(uploadRow, `Uploading to server… ${Math.round(pct)}%`); },
        () => { updateLogLine(uploadRow, 'Uploaded — waiting for the server…'); startTrickle(); }
      );
      stopTrickle();
      animateProgressTo(100, 350);
      updateLogLine(uploadRow, 'Upload confirmed by server');
      logLine('Submitted successfully — awaiting review', 'success');
      setLogState('success');
      resetTurnstile();
      refreshCooldownFromServer();
      setTimeout(hideProgress, 500);
      setBusy(false);
      showDone(data, !!upd);
    } catch (err) {
      stopTrickle();
      resetTurnstile();
      hideProgress();
      logLine('Error: ' + err.message, 'error');
      setLogState('error');
      const rateLimited = (err.data && (err.data.error === 'rate_limited' || err.data.nextSubmitInSeconds > 0)) || /too many|rate.?limit/i.test(err.message || '');
      if (rateLimited) {
        showStepError('');
        if (err.data && err.data.nextSubmitInSeconds > 0) startCooldown(err.data.nextSubmitInSeconds);
        else refreshCooldownFromServer();
      } else {
        showStepError(err.message);
      }
      setBusy(false);
    } finally {
      window.removeEventListener('beforeunload', guard);
    }
  }

  function resetWizard() {
    form.reset();
    [categorySelect, $('upAuthorExisting'), $('upExtraExisting')].forEach(refreshSelect);
    $('upArchive').value = '';
    $('upArchive2').value = '';
    resetArchiveUi(0);
    resetArchiveUi(1);
    S.styled = false;
    S.sub = 0;
    S.activeStyle = 0;
    applyStyledUi();
    S.update = null;
    S.prefillKey = '';
    S.autoFilledName = '';
    S.step = 0;
    S.maxStep = 0;
    heroHidden.value = '';
    heroSearch.value = '';
    S.lastHero = '';
    show(heroGroup, false);
    show($('upVideoGroup'), false);
    renderTags('');
    show($('upUpdateBanner'), false);
    show($('upBlockedBanner'), false);
    syncNameField();
    syncAuthorUi();
    syncExtraUi();
    applyAuthorPref();
    applyUpdateModeUi();
    syncPageTitle();
    clearLog();
    refreshAll();
    goToStep(0);
  }

  const HISTORY_STATUS = {
    moderation: { label: 'On moderation', icon: 'hourglass_top' },
    accepted: { label: 'Accepted', icon: 'check_circle' },
    rejected: { label: 'Rejected', icon: 'cancel' }
  };
  let historyLoading = false;

  function historyMessage(text, iconName) {
    const list = $('upHistoryList');
    list.textContent = '';
    const box = el('div', 'up-history-empty');
    const ic = icon(iconName);
    if (iconName === 'progress_activity') ic.classList.add('is-busy');
    box.append(ic, el('span', '', text));
    list.appendChild(box);
  }
  function renderHistory(items) {
    const list = $('upHistoryList');
    list.textContent = '';
    if (!items.length) { historyMessage('No submissions from this network yet.', 'inbox'); return; }
    for (const item of items) {
      const status = HISTORY_STATUS[item.status] ? item.status : 'moderation';
      const st = HISTORY_STATUS[status];
      const href = safeGithubUrl(item.url);
      const rowEl = el(href ? 'a' : 'div', `up-history-item ${status}`);
      if (href) { rowEl.href = href; rowEl.target = '_blank'; rowEl.rel = 'noopener noreferrer'; }
      const top = el('div', 'up-history-top');
      const badge = el('span', 'up-history-badge');
      badge.append(icon(st.icon), el('span', '', st.label));
      top.append(el('span', 'up-history-name', item.name || 'Untitled'), badge);
      rowEl.appendChild(top);
      if (item.kind === 'update') rowEl.appendChild(el('div', 'up-history-kind', 'Update'));
      if (item.createdAt) {
        const d = new Date(item.createdAt);
        if (!isNaN(d)) rowEl.appendChild(el('div', 'up-history-date', d.toLocaleString()));
      }
      if (status === 'rejected' && item.reason) rowEl.appendChild(el('div', 'up-history-reason', item.reason));
      list.appendChild(rowEl);
    }
  }
  async function loadHistory() {
    if (historyLoading) return;
    historyLoading = true;
    $('upHistoryRefresh').classList.add('is-loading');
    historyMessage('Loading…', 'progress_activity');
    try {
      const res = await fetch(`${WORKER_BASE_URL}/api/history`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      renderHistory(Array.isArray(data.items) ? data.items : []);
    } catch { historyMessage('Could not load history. Try again later.', 'error'); }
    finally { historyLoading = false; $('upHistoryRefresh').classList.remove('is-loading'); }
  }
  function showHistory(visible) {
    show($('upHistory'), visible);
    show($('upScrim'), visible);
    if (visible) { loadHistory(); $('upHistoryClose').focus(); }
    else $('upHistoryBtn').focus();
  }

  function wireEvents() {
    wireDropZone();

    $('upStyledToggle').addEventListener('change', () => {
      S.styled = $('upStyledToggle').checked;
      applyStyledUi();
      detectUpdate();
      refreshAll();
    });
    for (let i = 0; i < STYLE_COUNT; i++) {
      $('upStyleLabel' + i).addEventListener('input', refreshAll);
      form.querySelectorAll(`input[name="styleColorMode${i}"]`).forEach(r => r.addEventListener('change', () => { syncStyleCfgUi(); refreshAll(); }));
      $('upStyleColorA' + i).addEventListener('input', refreshAll);
      $('upStyleColorB' + i).addEventListener('input', refreshAll);
    }

    categorySelect.addEventListener('change', () => {
      const cat = categorySelect.value;
      const heroAware = HERO_AWARE_CATEGORIES.includes(cat);
      show(heroGroup, heroAware);
      if (!heroAware) { heroHidden.value = ''; heroSearch.value = ''; S.lastHero = ''; }
      const showsVideo = getPreviewVideoCategories().includes(cat);
      show($('upVideoGroup'), showsVideo);
      if (!showsVideo) $('upVideo').value = '';
      S.prefillKey = '__category_changed__';
      renderTags(cat);
      syncNameField();
      onNameOrHeroChanged();
    });

    heroSearch.addEventListener('focus', () => { buildHeroList(heroSearch.value); heroList.classList.add('open'); });
    heroSearch.addEventListener('input', () => {
      heroHidden.value = '';
      buildHeroList(heroSearch.value);
      heroList.classList.add('open');
      syncNameField();
      onNameOrHeroChanged();
    });
    heroSearch.addEventListener('blur', () => {
      setTimeout(() => {
        heroList.classList.remove('open');
        const typed = heroSearch.value.trim();
        const match = S.allHeroes.find(h => h.toLowerCase() === typed.toLowerCase());
        if (match) selectHero(match);
        else if (!heroHidden.value) heroSearch.value = '';
      }, 150);
    });

    nameInput.addEventListener('input', () => { syncNameField(); renderNameSuggestions(); onNameOrHeroChanged(); });
    nameInput.addEventListener('focus', renderNameSuggestions);
    nameInput.addEventListener('blur', () => {
      setTimeout(() => nameSuggest.classList.remove('open'), 150);
      if (S.update && modIsReplaceable(S.update.mod)) return;
      const titled = titleCaseWords(nameInput.value);
      if (titled !== nameInput.value) setNameValue(titled);
      if (HERO_AWARE_CATEGORIES.includes(categorySelect.value)) ensureHeroInName(heroHidden.value);
      onNameOrHeroChanged();
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.up-combo')) { heroList.classList.remove('open'); nameSuggest.classList.remove('open'); }
    });

    $('upVideo').addEventListener('input', () => {
      const v = $('upVideo').value.trim();
      show($('upVideoHint'), !!v && !isYouTubeUrl(v));
      refreshAll();
    });

    form.querySelectorAll('input[name="authorMode"]').forEach(r => r.addEventListener('change', () => { syncAuthorUi(); refreshAll(); }));
    $('upAuthorExisting').addEventListener('change', refreshAll);
    $('upAuthorName').addEventListener('input', () => { checkAuthorDuplicate(); refreshAll(); });

    form.querySelectorAll('input[name="extraMode"]').forEach(r => r.addEventListener('change', () => {
      if (getRadio('extraMode') !== 'none') setRadio('extraOriginMode', 'existing');
      syncExtraUi();
      refreshAll();
    }));
    form.querySelectorAll('input[name="extraOriginMode"]').forEach(r => r.addEventListener('change', () => { syncExtraUi(); refreshAll(); }));
    $('upExtraExisting').addEventListener('change', refreshAll);
    $('upExtraName').addEventListener('input', () => { checkExtraDuplicate(); refreshAll(); });

    $('upPrev').addEventListener('click', () => {
      if (S.busy) return;
      if (S.step === 0 && S.styled && S.sub > 0) { showStepError(''); setSub(S.sub - 1); updateNav(); return; }
      const target = neighbourStep(S.step, -1);
      if (target === 0 && S.styled) setSub(STYLE_COUNT - 1);
      goToStep(target);
    });
    $('upNext').addEventListener('click', tryNext);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (S.step < STEP_COUNT - 1) tryNext(); else submit();
    });

    document.querySelectorAll('#upStepper li').forEach(li => li.addEventListener('click', () => {
      const n = Number(li.dataset.step);
      if (n >= stepPos() || S.busy || stepSkipped(Math.ceil(n))) return;
      if (n === 0 || n === 0.5) { setSub(n === 0 ? 0 : 1); goToStep(0); } else goToStep(n);
    }));

    $('upHistoryBtn').addEventListener('click', () => showHistory(true));
    $('upHistoryClose').addEventListener('click', () => showHistory(false));
    $('upScrim').addEventListener('click', () => showHistory(false));
    $('upHistoryRefresh').addEventListener('click', loadHistory);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('upHistory').hidden) showHistory(false); });
  }

  function setupUi() {
    form = $('upForm');
    categorySelect = $('upCategory');
    heroGroup = $('upHeroGroup');
    heroSearch = $('upHeroSearch');
    heroHidden = $('upHero');
    heroList = $('upHeroList');
    nameInput = $('upName');
    nameSuggest = $('upNameSuggest');
    slotTagsWrap = $('upSlotTags');
    effectsTagsWrap = $('upEffectsTags');
    genericTagsWrap = $('upGenericTags');

    S.allHeroes = (window.HEROES_LIST || []).slice().sort((a, b) => a.localeCompare(b));
    renderCategorySelect();
    buildHeroList('');
    fillSelect($('upAuthorExisting'), Object.keys(window.MOD_AUTHOR || {}).sort(), 'Select author…');
    syncNameField();
    syncAuthorUi();
    syncExtraUi();
    applyAuthorPref();
    wireEvents();
    clearLog();
    applyUpdateModeUi();
    applyStyledUi();
    refreshAll();
    goToStep(0);
    ensureFflate().catch(() => { });
    initTurnstile({ quiet: true });
  }

  async function boot() {
    show($('upLoading'), true);
    show($('upLoadError'), false);
    show($('upLayout'), false);
    try {
      await loadCatalog();
    } catch (err) {
      console.error('[upload] catalog failed', err);
      show($('upLoading'), false);
      show($('upLoadError'), true);
      return;
    }
    show($('upLoading'), false);
    show($('upLayout'), true);
    if (!boot.done) { boot.done = true; setupUi(); }
  }

  $('upRetry').addEventListener('click', boot);
  boot();
})();