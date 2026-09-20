const WORKER_BASE_URL = 'https://uploader.hrdq.workers.dev';

const MAX_OUTER_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 1000;
const MAX_EXTRACTED_BYTES = 250 * 1024 * 1024;
const MAX_ENTRY_BYTES = 100 * 1024 * 1024;
const MAX_NAME_LENGTH = 100;
const MAX_URL_LENGTH = 2048;
const HERO_AWARE_CATEGORIES = ['heroes', 'hero-items', 'herofx', 'hero-sounds'];

const BLACKLISTED_CATEGORIES = ['packs', 'hero-items', 'cursors', 'tools', 'news', 'guides', 'sites', 'fonts', 'creeps', 'backgrounds', 'sounds', 'hero-sounds', 'huds'];

const SLOT_TAGS = ['base', 'totem', 'weapon', 'tail', 'off-hand', 'cart', 'mount', 'head', 'arm', 'arms', 'armor', 'shoulders', 'back', 'shield', 'hair', 'neck', 'rocket'];

function waitForAppData() {
  return new Promise(resolve => {
    if (window.categories && window.translations) return resolve();
    const iv = setInterval(() => {
      if (window.categories && window.translations) {
        clearInterval(iv);
        resolve();
      }
    }, 150);
  });
}

function waitForTurnstile() {
  return new Promise(resolve => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const iv = setInterval(() => {
      if (window.turnstile) {
        clearInterval(iv);
        resolve();
      }
    }, 100);
  });
}

function tr(key, fallback) {
  return (window.translations && window.translations[key]) || fallback || key;
}

function populateSelect(select, items, { placeholder } = {}) {
  select.innerHTML = '';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  for (const item of items) {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.label;
    if (item.disabled) opt.disabled = true;
    select.appendChild(opt);
  }
}

function toTitleCase(str) {
  return String(str || '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function stripArchiveExtension(fileName) {
  return String(fileName || '').replace(/\.[^./\\]+$/, '');
}

function normalizeModName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getModsForCategory(category) {
  const data = window.modsData && window.modsData[category];
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.groups)) {
    return data.groups.flatMap(g => Array.isArray(g.mods) ? g.mods : []);
  }
  return [];
}

function setupUploadModal() {
  const overlay = document.getElementById('uploadModOverlay');
  const modal = document.getElementById('uploadModModal');
  const openBtns = [
    document.getElementById('uploadModButton'),
    document.getElementById('mobileUploadModButton'),
    document.getElementById('uploadModAboutLink')
  ];
  const closeBtn = document.getElementById('closeUploadModModal');
  const form = document.getElementById('uploadModForm');
  const statusEl = document.getElementById('umStatus');
  const submitBtn = document.getElementById('umSubmitBtn');
  const submitText = submitBtn.querySelector('.upload-submit-text');
  const submitIcon = submitBtn.querySelector('.upload-submit-icon');

  const categorySelect = document.getElementById('umCategory');
  const heroGroup = document.getElementById('umHeroGroup');
  const heroSearch = document.getElementById('umHeroSearch');
  const heroHidden = document.getElementById('umHero');
  const heroDropdown = document.getElementById('umHeroDropdown');
  const tagsGroup = document.getElementById('umTagsGroup');
  const nameInput = document.getElementById('umName');
  const archiveInput = document.getElementById('umArchive');

  const slotGroup = document.getElementById('umSlotGroup');
  const slotTagsWrap = document.getElementById('umSlotTags');
  const effectsGroup = document.getElementById('umEffectsGroup');
  const effectsTagsWrap = document.getElementById('umEffectsTags');
  const genericGroup = document.getElementById('umGenericTagsGroup');
  const genericTagsWrap = document.getElementById('umGenericTags');

  const authorExistingSelect = document.getElementById('umAuthorExisting');
  const authorNewFields = document.getElementById('umAuthorNewFields');

  const extraFields = document.getElementById('umExtraFields');
  const extraExistingSelect = document.getElementById('umExtraExisting');
  const extraNewFields = document.getElementById('umExtraNewFields');

  const progressWrap = document.getElementById('umProgressWrap');
  const progressBar = document.getElementById('umProgressBar');
  const progressPct = document.getElementById('umProgressPct');

  const previewMedia = document.getElementById('umPreviewMedia');
  const previewTitle = document.getElementById('umPreviewTitle');
  const previewSubtitle = document.getElementById('umPreviewSubtitle');
  const previewButtonsGroup = document.getElementById('umPreviewButtonsGroup');
  const previewLogBody = document.getElementById('umPreviewLogBody');
  const previewLogIcon = document.getElementById('umPreviewLogIcon');
  const turnstileContainer = document.getElementById('uploadTurnstile');
  let previewObjectUrl = null;
  let turnstileWidgetId = null;

  const cooldownHint = document.getElementById('umCooldownHint');
  const cooldownHintText = document.getElementById('umCooldownHintText');
  let cooldownInterval = null;
  let cooldownRemaining = 0;
  let isUploadBusy = false;

  function formatCooldown(totalSeconds) {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
  }

  function updateSubmitDisabledState() {
    submitBtn.disabled = isUploadBusy || cooldownRemaining > 0;
  }

  function renderCooldown() {
    cooldownHintText.textContent =
      `You can submit your next mod in ${formatCooldown(cooldownRemaining)}.`;
    cooldownHint.style.display = '';
    updateSubmitDisabledState();
  }

  function clearCooldown() {
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
    cooldownRemaining = 0;
    cooldownHint.style.display = 'none';
    updateSubmitDisabledState();
  }

  function startCooldown(seconds) {
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
    cooldownRemaining = Math.ceil(Number(seconds) || 0);
    if (cooldownRemaining <= 0) {
      clearCooldown();
      return;
    }
    renderCooldown();
    cooldownInterval = setInterval(() => {
      cooldownRemaining -= 1;
      if (cooldownRemaining <= 0) {
        clearCooldown();
      } else {
        renderCooldown();
      }
    }, 1000);
  }

  async function refreshCooldownFromServer() {
    try {
      const res = await fetch(`${WORKER_BASE_URL}/api/status`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.nextSubmitInSeconds > 0) {
        startCooldown(data.nextSubmitInSeconds);
      } else {
        clearCooldown();
      }
    } catch {
    }
  }

  const duplicateHint = document.getElementById('umDuplicateHint');
  const duplicateHintText = document.getElementById('umDuplicateHintText');
  let isDuplicateName = false;
  let autoFilledName = '';

  function buildInlineDuplicateHint(id) {
    const p = document.createElement('p');
    p.className = 'upload-form-hint upload-duplicate-hint';
    p.id = id;
    p.style.display = 'none';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-rounded';
    icon.textContent = 'warning';
    const text = document.createElement('span');
    text.id = id + 'Text';
    p.appendChild(icon);
    p.appendChild(text);
    return { hint: p, text };
  }

  const { hint: authorDuplicateHint, text: authorDuplicateHintText } = buildInlineDuplicateHint('umAuthorDuplicateHint');
  authorNewFields.appendChild(authorDuplicateHint);
  let isDuplicateAuthor = false;

  const { hint: extraDuplicateHint, text: extraDuplicateHintText } = buildInlineDuplicateHint('umExtraDuplicateHint');
  extraNewFields.appendChild(extraDuplicateHint);
  let isDuplicateExtra = false;

  const LOG_ICONS = {
    muted: 'info',
    info: 'info',
    progress: 'sync',
    success: 'check_circle',
    error: 'error',
  };

  function setLogIconState(state) {
    if (!previewLogIcon) return;
    previewLogIcon.classList.remove('is-busy', 'is-success', 'is-error');
    if (state === 'busy') {
      previewLogIcon.textContent = 'progress_activity';
      previewLogIcon.classList.add('is-busy');
    } else if (state === 'success') {
      previewLogIcon.textContent = 'check_circle';
      previewLogIcon.classList.add('is-success');
    } else if (state === 'error') {
      previewLogIcon.textContent = 'error';
      previewLogIcon.classList.add('is-error');
    } else {
      previewLogIcon.textContent = 'terminal';
    }
  }

  function clearActivityLog(placeholder = 'Waiting for submit…') {
    if (!previewLogBody) return;
    previewLogBody.innerHTML = '';
    appendActivityLog(placeholder, 'muted');
    setLogIconState('idle');
  }

  function appendActivityLog(message, type = 'info') {
    if (!previewLogBody) return null;
    if (type !== 'muted') {
      const onlyMuted = previewLogBody.querySelectorAll('.upload-preview-log-entry.muted');
      if (onlyMuted.length && previewLogBody.children.length === onlyMuted.length) {
        previewLogBody.innerHTML = '';
      }
    }
    const row = document.createElement('div');
    row.className = `upload-preview-log-entry ${type}`;
    const icon = document.createElement('span');
    icon.className = 'material-symbols-rounded';
    icon.textContent = LOG_ICONS[type] || 'info';
    const text = document.createElement('span');
    text.textContent = message;
    row.appendChild(icon);
    row.appendChild(text);
    previewLogBody.appendChild(row);
    previewLogBody.scrollTop = previewLogBody.scrollHeight;
    return row;
  }

  function updateActivityLog(row, message) {
    if (!row) return;
    const text = row.querySelector('span:last-child');
    if (text) text.textContent = message;
    if (previewLogBody) previewLogBody.scrollTop = previewLogBody.scrollHeight;
  }

  function initTurnstile() {
    if (!turnstileContainer || typeof turnstile === 'undefined') return;

    if (turnstileWidgetId !== null) {
      try {
        turnstile.reset(turnstileWidgetId);
      } catch { }
      return;
    }

    turnstileWidgetId = turnstile.render(turnstileContainer, {
      sitekey: turnstileContainer.dataset.sitekey,
      theme: 'auto',
      appearance: 'interaction-only',
      action: 'submit_mod',
    });
  }

  function checkDuplicate() {
    const name = nameInput.value.trim();
    const category = categorySelect.value;

    if (!name || !category || BLACKLISTED_CATEGORIES.includes(category)) {
      isDuplicateName = false;
      duplicateHint.style.display = 'none';
      return;
    }

    const target = normalizeModName(name);
    const dup = getModsForCategory(category).some(m => normalizeModName(m.name) === target);

    isDuplicateName = dup;
    if (dup) {
      duplicateHintText.textContent = `A mod named "${name}" already exists in this category.`;
      duplicateHint.style.display = '';
    } else {
      duplicateHint.style.display = 'none';
    }
  }

  function checkAuthorDuplicate() {
    const mode = form.querySelector('input[name="authorMode"]:checked')?.value;
    const nick = document.getElementById('umAuthorName')?.value.trim() || '';

    if (mode !== 'new' || !nick) {
      isDuplicateAuthor = false;
      authorDuplicateHint.style.display = 'none';
      return;
    }

    const target = normalizeModName(nick);
    const match = Object.keys(window.MOD_AUTHOR || {}).find(a => normalizeModName(a) === target);

    isDuplicateAuthor = !!match;
    if (match) {
      authorDuplicateHintText.textContent = `An author named "${match}" already exists — select "Existing" instead.`;
      authorDuplicateHint.style.display = '';
    } else {
      authorDuplicateHint.style.display = 'none';
    }
  }

  function checkExtraDuplicate() {
    const extraMode = form.querySelector('input[name="extraMode"]:checked')?.value;
    const originMode = form.querySelector('input[name="extraOriginMode"]:checked')?.value;
    const value = document.getElementById('umExtraName')?.value.trim() || '';

    if (extraMode === 'none' || originMode !== 'new' || !value) {
      isDuplicateExtra = false;
      extraDuplicateHint.style.display = 'none';
      return;
    }

    const target = normalizeModName(value);
    const registry = extraMode === 'source' ? window.MOD_SOURCES : window.MOD_AUTHOR;
    const match = Object.keys(registry || {}).find(a => normalizeModName(a) === target);

    isDuplicateExtra = !!match;
    if (match) {
      const label = extraMode === 'source' ? 'source' : 'author';
      extraDuplicateHintText.textContent = `A ${label} named "${match}" already exists — select "Existing" instead.`;
      extraDuplicateHint.style.display = '';
    } else {
      extraDuplicateHint.style.display = 'none';
    }
  }

  function updatePreview() {
    const name = nameInput.value.trim();
    previewTitle.textContent = name || 'Mod name';

    const catOpt = categorySelect.selectedOptions[0];
    const catLabel = catOpt && catOpt.value ? catOpt.textContent : 'Category';
    previewSubtitle.textContent = catLabel;

    previewButtonsGroup.innerHTML = buildPreviewLinkButtonsHtml();

    previewMedia.innerHTML = '';
    if (extractedArchive && extractedArchive.preview) {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      const blob = new Blob([extractedArchive.preview]);
      previewObjectUrl = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = previewObjectUrl;
      img.alt = name;
      previewMedia.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.style.fontSize = '40px';
      span.style.opacity = '0.5';
      span.textContent = '\u{1F9E9}';
      previewMedia.appendChild(span);
    }

    const catId = categorySelect.value;
    const cfg = (window.TAG_CONFIGS || {})[catId];
    const tagMap = cfg?.map || {};

    const slotRadio = slotTagsWrap.querySelector('input[type="radio"]:checked');
    const checkedEffects = Array.from(effectsTagsWrap.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const checkedGeneric = Array.from(genericTagsWrap.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

    const tagsEl = document.createElement('div');
    tagsEl.className = 'mod-tags';

    function addTag(key, isSlot) {
      const label = tagMap[key] || key;
      const span = document.createElement('span');
      span.className = 'mod-tag' + (isSlot ? ' mod-tag--slot' : '');
      span.textContent = label;
      tagsEl.appendChild(span);
    }

    if (slotRadio) addTag(slotRadio.value, true);
    for (const k of checkedEffects) addTag(k, false);
    for (const k of checkedGeneric) addTag(k, SLOT_TAGS.includes(k));

    if (tagsEl.children.length) previewMedia.appendChild(tagsEl);
  }

  function buildPreviewLinkButtonsHtml() {
    if (typeof generateLinkButtonsHtml !== 'function') return '';

    const links = [];

    const authorMode = form.querySelector('input[name="authorMode"]:checked')?.value;
    if (authorMode === 'existing' && authorExistingSelect.value) {
      links.push({ type: 'author', url: authorExistingSelect.value });
    } else if (authorMode === 'new') {
      const nick = document.getElementById('umAuthorName')?.value.trim();
      if (nick) links.push({ type: 'author', url: nick });
    }

    const extraMode = form.querySelector('input[name="extraMode"]:checked')?.value;
    if (extraMode === 'source' || extraMode === 'modded') {
      const originMode = form.querySelector('input[name="extraOriginMode"]:checked')?.value;
      const value = originMode === 'existing'
        ? extraExistingSelect.value
        : document.getElementById('umExtraName')?.value.trim();
      if (value) links.push({ type: extraMode, url: value });
    }

    if (!links.length) return '';
    return generateLinkButtonsHtml({ links }, categorySelect.value);
  }

  function wireSegmented(container) {
    if (!container) return;
    const radios = container.querySelectorAll('input[type="radio"]');
    function refresh() {
      radios.forEach(r => r.closest('label').classList.toggle('selected', r.checked));
    }
    radios.forEach(r => r.addEventListener('change', refresh));
    refresh();
  }
  wireSegmented(document.getElementById('umAuthorSegmented'));
  wireSegmented(document.getElementById('umExtraSegmented'));
  wireSegmented(document.getElementById('umExtraOriginSegmented'));

  function openModal() {
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    refreshCooldownFromServer();
    clearActivityLog();
  }
  function closeModal() {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    heroDropdown.classList.remove('open');
  }

  openBtns.forEach(btn => btn && btn.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.remove('active');
    openModal();
  }));
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  const categoryItems = (window.categories || [])
    .filter(c => !BLACKLISTED_CATEGORIES.includes(c.id))
    .map(c => ({ value: c.id, label: tr(c.key, c.id) }));
  populateSelect(categorySelect, categoryItems, { placeholder: 'Select category\u2026' });

  function refreshAuthorSelect() {
    const authors = Object.keys(window.MOD_AUTHOR || {}).sort();
    populateSelect(authorExistingSelect, authors.map(a => ({ value: a, label: a })), { placeholder: 'Select author\u2026' });
  }
  refreshAuthorSelect();

  function refreshExtraExistingSelect(mode) {
    if (mode === 'source') {
      const items = Object.keys(window.MOD_SOURCES || {}).sort();
      populateSelect(extraExistingSelect, items.map(a => ({ value: a, label: a })), { placeholder: 'Select source\u2026' });
    } else if (mode === 'modded') {
      const items = Object.keys(window.MOD_AUTHOR || {}).sort();
      populateSelect(extraExistingSelect, items.map(a => ({ value: a, label: a })), { placeholder: 'Select original author\u2026' });
    }
  }

  let allHeroes = [];

  function buildHeroDropdown(filter) {
    const q = (filter || '').toLowerCase().trim();
    heroDropdown.innerHTML = '';
    const visible = q ? allHeroes.filter(h => h.toLowerCase().includes(q)) : allHeroes;
    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'um-hero-option um-hero-no-match';
      empty.textContent = 'No heroes found';
      heroDropdown.appendChild(empty);
      return;
    }
    for (const h of visible) {
      const opt = document.createElement('div');
      opt.className = 'um-hero-option';
      opt.setAttribute('role', 'option');
      opt.textContent = h;
      opt.addEventListener('mousedown', ev => {
        ev.preventDefault();
        selectHero(h);
      });
      heroDropdown.appendChild(opt);
    }
  }

  function selectHero(hero) {
    heroHidden.value = hero;
    heroSearch.value = hero;
    heroDropdown.classList.remove('open');
    if (hero && !nameInput.value.trim()) nameInput.value = hero;
    updatePreview();
  }

  function renderHeroCombo() {
    allHeroes = (window.HEROES_LIST || []).slice().sort((a, b) => a.localeCompare(b));
    heroSearch.value = '';
    heroHidden.value = '';
    buildHeroDropdown('');
  }
  renderHeroCombo();

  function findHeroInText(text) {
    const normalize = s => String(s || '').toLowerCase().replace(/[_\-.]+/g, ' ');
    const haystack = normalize(text);
    if (!haystack) return null;
    let best = null;
    for (const hero of allHeroes) {
      const needle = normalize(hero);
      if (needle && haystack.includes(needle)) {
        if (!best || needle.length > normalize(best).length) best = hero;
      }
    }
    return best;
  }

  function suggestNameFromText(rawText) {
    const titled = toTitleCase(rawText);
    const hero = findHeroInText(rawText);
    if (!hero || hero === toTitleCase(hero)) return titled;
    const mangledHero = toTitleCase(hero);
    return titled.includes(mangledHero) ? titled.split(mangledHero).join(hero) : titled;
  }

  heroSearch.addEventListener('focus', () => {
    buildHeroDropdown(heroSearch.value);
    heroDropdown.classList.add('open');
  });
  heroSearch.addEventListener('input', () => {
    heroHidden.value = '';
    buildHeroDropdown(heroSearch.value);
    heroDropdown.classList.add('open');
    updatePreview();
  });
  heroSearch.addEventListener('blur', () => {
    setTimeout(() => {
      heroDropdown.classList.remove('open');
      const typed = heroSearch.value.trim();
      const match = allHeroes.find(h => h.toLowerCase() === typed.toLowerCase());
      if (match) {
        selectHero(match);
      } else if (!heroHidden.value) {
        heroSearch.value = heroHidden.value;
      }
    }, 150);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.um-hero-combo')) heroDropdown.classList.remove('open');
  });

  function renderTags(categoryId) {
    slotTagsWrap.innerHTML = '';
    effectsTagsWrap.innerHTML = '';
    genericTagsWrap.innerHTML = '';
    slotGroup.style.display = 'none';
    effectsGroup.style.display = 'none';
    genericGroup.style.display = 'none';

    const cfg = (window.TAG_CONFIGS || {})[categoryId];
    if (!cfg || !cfg.map) {
      tagsGroup.style.display = 'none';
      return;
    }
    tagsGroup.style.display = '';

    if (categoryId === 'hero-items') {
      let hasSlot = false, hasEffects = false;
      for (const [key, label] of Object.entries(cfg.map)) {
        if (SLOT_TAGS.includes(key)) {
          const id = `umSlot_${key}`;
          const wrap = document.createElement('label');
          wrap.className = 'upload-tag-chip upload-slot-chip';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'slotTag';
          radio.id = id;
          radio.value = key;
          wrap.appendChild(radio);
          wrap.append(' ' + label);
          radio.addEventListener('change', () => {
            slotTagsWrap.querySelectorAll('label.upload-slot-chip').forEach(l =>
              l.classList.toggle('selected', l.querySelector('input')?.checked));
            updatePreview();
          });
          slotTagsWrap.appendChild(wrap);
          hasSlot = true;
        } else {
          const id = `umEffect_${key}`;
          const wrap = document.createElement('label');
          wrap.className = 'upload-tag-chip';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = id;
          cb.value = key;
          wrap.appendChild(cb);
          wrap.append(' ' + label);
          cb.addEventListener('change', updatePreview);
          effectsTagsWrap.appendChild(wrap);
          hasEffects = true;
        }
      }
      if (hasSlot) slotGroup.style.display = '';
      if (hasEffects) effectsGroup.style.display = '';
    } else {
      for (const [key, label] of Object.entries(cfg.map)) {
        const id = `umTag_${key}`;
        const wrap = document.createElement('label');
        wrap.className = 'upload-tag-chip';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = id;
        cb.value = key;
        wrap.appendChild(cb);
        wrap.append(' ' + label);
        cb.addEventListener('change', updatePreview);
        genericTagsWrap.appendChild(wrap);
      }
      genericGroup.style.display = '';
    }
  }

  categorySelect.addEventListener('change', () => {
    const cat = categorySelect.value;

    if (BLACKLISTED_CATEGORIES.includes(cat)) {
      categorySelect.value = '';
      statusEl.textContent = 'This category is temporarily unavailable for new submissions.';
      statusEl.className = 'upload-status upload-status-error';
      heroGroup.style.display = 'none';
      renderTags('');
      checkDuplicate();
      updatePreview();
      return;
    }

    heroGroup.style.display = HERO_AWARE_CATEGORIES.includes(cat) ? '' : 'none';
    renderTags(cat);
    checkDuplicate();
    updatePreview();
  });

  nameInput.addEventListener('input', () => {
    checkDuplicate();
    updatePreview();
  });

  form.querySelectorAll('input[name="authorMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = form.querySelector('input[name="authorMode"]:checked').value;
      authorExistingSelect.style.display = mode === 'existing' ? '' : 'none';
      authorNewFields.style.display = mode === 'new' ? '' : 'none';
      checkAuthorDuplicate();
      updatePreview();
    });
  });
  authorExistingSelect.addEventListener('change', updatePreview);
  document.getElementById('umAuthorName')?.addEventListener('input', () => {
    checkAuthorDuplicate();
    updatePreview();
  });

  form.querySelectorAll('input[name="extraMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = form.querySelector('input[name="extraMode"]:checked').value;
      extraFields.style.display = mode === 'none' ? 'none' : '';
      if (mode !== 'none') refreshExtraExistingSelect(mode);
      checkExtraDuplicate();
      updatePreview();
    });
  });

  form.querySelectorAll('input[name="extraOriginMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isNew = form.querySelector('input[name="extraOriginMode"]:checked').value === 'new';
      extraExistingSelect.style.display = isNew ? 'none' : '';
      extraNewFields.style.display = isNew ? '' : 'none';
      checkExtraDuplicate();
      updatePreview();
    });
  });
  extraExistingSelect.addEventListener('change', updatePreview);
  document.getElementById('umExtraName')?.addEventListener('input', () => {
    checkExtraDuplicate();
    updatePreview();
  });

  let extractedArchive = null;

  function isAllowedHttpUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return (url.protocol === 'https:' || url.protocol === 'http:')
        && url.username === ''
        && url.password === ''
        && url.href.length <= MAX_URL_LENGTH;
    } catch {
      return false;
    }
  }

  function validateArchiveFile(file) {
    if (!file) throw new Error('Please select an archive.');
    if (file.size > MAX_OUTER_ARCHIVE_BYTES) {
      throw new Error(`Archive is too large. Maximum size is ${Math.floor(MAX_OUTER_ARCHIVE_BYTES / 1024 / 1024)} MB.`);
    }
  }

  async function extractArchive(file) {
    validateArchiveFile(file);

    const buf = new Uint8Array(await file.arrayBuffer());
    let entries;
    try {
      entries = fflate.unzipSync(buf);
    } catch {
      throw new Error('The selected file is not a valid ZIP archive.');
    }

    const names = Object.keys(entries);
    if (names.length > MAX_ARCHIVE_ENTRIES) {
      throw new Error(`Archive contains too many files. Maximum is ${MAX_ARCHIVE_ENTRIES}.`);
    }

    let totalExtracted = 0;
    for (const name of names) {
      const data = entries[name];
      if (!(data instanceof Uint8Array)) continue;
      if (data.length > MAX_ENTRY_BYTES) {
        throw new Error('Archive contains a file that is too large.');
      }
      totalExtracted += data.length;
      if (totalExtracted > MAX_EXTRACTED_BYTES) {
        throw new Error('Archive expands to too much data.');
      }

      const normalized = name.replace(/\\/g, '/');
      if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
        throw new Error('Archive contains an unsafe file path.');
      }
    }

    let modZip = null, preview = null, previewExt = null, folderName = null;
    for (const name of Object.keys(entries)) {
      if (name.endsWith('/')) continue;
      const parts = name.split('/');
      if (parts.length > 1 && !folderName) folderName = parts[0];
      const lower = name.toLowerCase();
      if (lower.endsWith('.zip') && !modZip) {
        modZip = entries[name];
      } else if (/\.(webp|png|jpe?g)$/.test(lower) && !preview) {
        preview = entries[name];
        previewExt = lower.split('.').pop();
      }
    }
    if (!modZip) throw new Error('Archive must contain a .zip file with the mod inside it.');

    const hashEntryName = Object.keys(entries).find(n => n.toLowerCase().split('/').pop() === 'hash.json');
    if (!hashEntryName) {
      throw new Error('Archive is missing hashes');
    }
    let hashData;
    try {
      hashData = JSON.parse(new TextDecoder('utf-8').decode(entries[hashEntryName]));
    } catch {
      throw new Error('hash.json is not valid JSON.');
    }
    const expectedVpkZipHash = String(hashData.vpk_zip_hash || '').toLowerCase().trim();
    const expectedVpkHash = String(hashData.vpk_hash || '').toLowerCase().trim();
    if (!/^[a-f0-9]{64}$/.test(expectedVpkZipHash) || !/^[a-f0-9]{64}$/.test(expectedVpkHash)) {
      throw new Error('hash.json does not contain valid vpk_hash/vpk_zip_hash values (expected sha256 hex digests).');
    }

    const actualVpkZipHash = await sha256Hex(modZip);
    if (actualVpkZipHash !== expectedVpkZipHash) {
      appendActivityLog(`Hash mismatch: vpk_zip_hash expected ${expectedVpkZipHash.slice(0, 12)}…, got ${actualVpkZipHash.slice(0, 12)}…`, 'error');
      throw new Error('Integrity check failed: the mod archive does not match. The file may be corrupted or was tampered with.');
    }

    let innerEntries;
    try {
      innerEntries = fflate.unzipSync(modZip);
    } catch {
      throw new Error('The inner mod archive is not a valid ZIP file.');
    }
    const innerFiles = Object.keys(innerEntries).filter(n => !n.endsWith('/'));
    const unexpectedInner = innerFiles.find(n => !n.toLowerCase().endsWith('.vpk'));
    if (unexpectedInner) {
      throw new Error(`The mod archive must contain only a .vpk file. Unexpected file: ${unexpectedInner}`);
    }
    if (innerFiles.length === 0) {
      throw new Error('The inner mod archive does not contain a .vpk file.');
    }
    if (innerFiles.length > 1) {
      throw new Error(`The mod archive must contain exactly one .vpk file (found ${innerFiles.length}).`);
    }
    const vpkEntryName = innerFiles[0];
    const vpkBytes = innerEntries[vpkEntryName];
    if (!(vpkBytes instanceof Uint8Array) || vpkBytes.length > MAX_ENTRY_BYTES) {
      throw new Error('The .vpk file inside the mod archive is too large or unreadable.');
    }
    const actualVpkHash = await sha256Hex(vpkBytes);
    if (actualVpkHash !== expectedVpkHash) {
      appendActivityLog(`Hash mismatch: vpk_hash expected ${expectedVpkHash.slice(0, 12)}…, got ${actualVpkHash.slice(0, 12)}…`, 'error');
      throw new Error('Integrity check failed: the .vpk file does not match. The file may be corrupted or was tampered with.');
    }

    appendActivityLog('Integrity check passed', 'success');

    return { modZip, preview, previewExt, folderName };
  }

  const archiveField = archiveInput.closest('.md3-file-field');
  const archiveLabel = document.getElementById('umArchiveLabel');

  archiveInput.addEventListener('change', async () => {
    const file = archiveInput.files[0];
    extractedArchive = null;
    if (!file) {
      archiveField?.classList.remove('has-file');
      if (archiveLabel) archiveLabel.textContent = 'Choose archive\u2026';
      checkDuplicate();
      updatePreview();
      return;
    }
    try {
      validateArchiveFile(file);
    } catch (err) {
      archiveInput.value = '';
      archiveField?.classList.remove('has-file');
      if (archiveLabel) archiveLabel.textContent = 'Choose archive…';
      statusEl.textContent = err.message;
      statusEl.className = 'upload-status upload-status-error';
      return;
    }

    archiveField?.classList.add('has-file');
    if (archiveLabel) archiveLabel.textContent = file.name;

    const suggestedFromFile = suggestNameFromText(stripArchiveExtension(file.name));
    if (suggestedFromFile && (!nameInput.value.trim() || nameInput.value.trim() === autoFilledName)) {
      nameInput.value = suggestedFromFile;
      autoFilledName = suggestedFromFile;
    }

    const heroFromFileName = findHeroInText(stripArchiveExtension(file.name));
    if (heroFromFileName) selectHero(heroFromFileName);

    checkDuplicate();

    appendActivityLog('Reading archive…', 'progress');
    setLogIconState('busy');
    try {
      extractedArchive = await extractArchive(file);

      if (extractedArchive.folderName) {
        const suggestedFromFolder = suggestNameFromText(extractedArchive.folderName);
        if (suggestedFromFolder && (!nameInput.value.trim() || nameInput.value.trim() === autoFilledName)) {
          nameInput.value = suggestedFromFolder;
          autoFilledName = suggestedFromFolder;
        }
        if (!heroHidden.value) {
          const heroFromFolder = findHeroInText(extractedArchive.folderName);
          if (heroFromFolder) selectHero(heroFromFolder);
        }
      }

      appendActivityLog(
        extractedArchive.preview
          ? 'Archive OK'
          : 'Archive OK, no preview image found',
        'success'
      );
      setLogIconState('idle');
    } catch (err) {
      appendActivityLog('Archive error: ' + err.message, 'error');
      setLogIconState('error');
    } finally {
      checkDuplicate();
      updatePreview();
    }
  });

  let progressAnimFrame = null;
  let progressTrickleInterval = null;
  let displayedProgressPct = 0;

  function renderProgress(pct) {
    const v = Math.min(100, Math.max(0, pct));
    if (progressBar) progressBar.value = v;
    if (progressPct) progressPct.textContent = Math.round(v) + '%';
    displayedProgressPct = v;
  }

  function animateProgressTo(targetPct, duration = 300) {
    const target = Math.min(100, Math.max(0, targetPct));
    if (progressAnimFrame) cancelAnimationFrame(progressAnimFrame);
    const start = displayedProgressPct;
    const delta = target - start;
    if (Math.abs(delta) < 0.05 || duration <= 0) {
      renderProgress(target);
      return;
    }
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      renderProgress(start + delta * eased);
      progressAnimFrame = t < 1 ? requestAnimationFrame(step) : null;
    }
    progressAnimFrame = requestAnimationFrame(step);
  }

  function startProgressTrickle() {
    stopProgressTrickle();
    progressTrickleInterval = setInterval(() => {
      animateProgressTo(displayedProgressPct + (96 - displayedProgressPct) * 0.12, 650);
    }, 650);
  }

  function stopProgressTrickle() {
    if (progressTrickleInterval) {
      clearInterval(progressTrickleInterval);
      progressTrickleInterval = null;
    }
  }

  function showProgress() {
    progressWrap.style.display = '';
    renderProgress(0);
  }
  function hideProgress() {
    stopProgressTrickle();
    if (progressAnimFrame) {
      cancelAnimationFrame(progressAnimFrame);
      progressAnimFrame = null;
    }
    progressWrap.style.display = 'none';
    renderProgress(0);
  }

  function setSubmitBusy(busy) {
    isUploadBusy = busy;
    updateSubmitDisabledState();
    if (submitIcon) submitIcon.textContent = busy ? 'hourglass_empty' : 'send';
    if (submitText) submitText.textContent = busy ? 'Uploading\u2026' : 'Submit for review';
  }

  function xhrUpload(fd, onProgress, onSent) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${WORKER_BASE_URL}/api/submit`);
      let sentFired = false;
      xhr.upload.addEventListener('progress', ev => {
        if (!ev.lengthComputable) return;
        const pct = (ev.loaded / ev.total) * 100;
        if (onProgress) onProgress(pct);
        if (pct >= 99.9 && !sentFired) {
          sentFired = true;
          if (onSent) onSent();
        }
      });
      xhr.addEventListener('load', () => {
        if (!sentFired && onSent) onSent();
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status < 200 || xhr.status >= 300 || data.error) {
            reject(Object.assign(new Error(data.message || data.error || `HTTP ${xhr.status}`), { data }));
          } else {
            resolve(data);
          }
        } catch {
          reject(new Error('Invalid server response'));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('timeout', () => reject(new Error('Request timed out')));
      xhr.send(fd);
    });
  }

  function buildFormData(name, category) {
    const authorMode = form.querySelector('input[name="authorMode"]:checked').value;
    const extraMode = form.querySelector('input[name="extraMode"]:checked').value;
    const extraOriginMode = extraMode !== 'none'
      ? form.querySelector('input[name="extraOriginMode"]:checked').value
      : null;

    if (turnstileWidgetId === null) {
      throw new Error('Captcha is not ready. Please wait a moment and try again.');
    }

    const turnstileToken = turnstile.getResponse(turnstileWidgetId);

    if (!turnstileToken) {
      throw new Error('Please complete the captcha.');
    }

    const tags = {};
    const slotRadio = slotTagsWrap.querySelector('input[type="radio"]:checked');
    if (slotRadio) tags[slotRadio.value] = true;
    effectsTagsWrap.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => { tags[cb.value] = true; });
    genericTagsWrap.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => { tags[cb.value] = true; });

    const fd = new FormData();

    fd.set('cf-turnstile-response', turnstileToken);

    fd.set('name', name);
    fd.set('category', category);
    fd.set('hero', HERO_AWARE_CATEGORIES.includes(category) ? (heroHidden.value || '') : '');
    fd.set('tags', JSON.stringify(tags));
    fd.set('authorMode', authorMode);
    if (authorMode === 'existing') {
      fd.set('authorName', authorExistingSelect.value);
    } else if (authorMode === 'new') {
      fd.set('authorName', document.getElementById('umAuthorName').value.trim());
      fd.set('authorUrl', document.getElementById('umAuthorUrl').value.trim());
    }
    fd.set('extraMode', extraMode);
    if (extraMode !== 'none') {
      if (extraOriginMode === 'existing') {
        fd.set('extraExistingName', extraExistingSelect.value);
      } else {
        fd.set('extraName', document.getElementById('umExtraName').value.trim());
        fd.set('extraUrl', document.getElementById('umExtraUrl').value.trim());
      }
    }
    fd.set('modZip', new Blob([extractedArchive.modZip]), `${name}.zip`);
    if (extractedArchive.preview) {
      fd.set('preview', new Blob([extractedArchive.preview]), `${name}.${extractedArchive.previewExt}`);
    }
    return fd;
  }

  function resetForm() {
    form.reset();
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
    extractedArchive = null;
    autoFilledName = '';
    isDuplicateName = false;
    duplicateHint.style.display = 'none';
    isDuplicateAuthor = false;
    authorDuplicateHint.style.display = 'none';
    isDuplicateExtra = false;
    extraDuplicateHint.style.display = 'none';
    tagsGroup.style.display = 'none';
    heroGroup.style.display = 'none';
    slotGroup.style.display = 'none';
    effectsGroup.style.display = 'none';
    genericGroup.style.display = 'none';
    heroSearch.value = '';
    heroHidden.value = '';
    archiveField?.classList.remove('has-file');
    if (archiveLabel) archiveLabel.textContent = 'Choose archive\u2026';
    wireSegmented(document.getElementById('umAuthorSegmented'));
    wireSegmented(document.getElementById('umExtraSegmented'));
    wireSegmented(document.getElementById('umExtraOriginSegmented'));
    updatePreview();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'upload-status';

    const name = nameInput.value.trim();
    const category = categorySelect.value;

    if (!name || !category || !archiveInput.files[0]) {
      appendActivityLog('Fill in name, category and archive first.', 'error');
      setLogIconState('error');
      return;
    }
    if (BLACKLISTED_CATEGORIES.includes(category)) {
      appendActivityLog('Category temporarily unavailable.', 'error');
      setLogIconState('error');
      return;
    }
    if (!extractedArchive) {
      try {
        appendActivityLog('Reading archive…', 'progress');
        setLogIconState('busy');
        extractedArchive = await extractArchive(archiveInput.files[0]);
        appendActivityLog('Archive ready', 'success');
      } catch (err) {
        appendActivityLog('Archive error: ' + err.message, 'error');
        setLogIconState('error');
        return;
      }
    }
    if (name.length > MAX_NAME_LENGTH || !/^[a-zA-Z0-9 \-_'.,!]+$/.test(name)) {
      appendActivityLog('Invalid mod name.', 'error');
      setLogIconState('error');
      return;
    }

    if (!Array.isArray(window.categories) || !window.categories.some(c => c.id === category)) {
      appendActivityLog('Invalid category.', 'error');
      setLogIconState('error');
      return;
    }

    const hero = heroHidden.value.trim();
    if (HERO_AWARE_CATEGORIES.includes(category) && hero &&
      !(window.HEROES_LIST || []).includes(hero)) {
      appendActivityLog('Invalid hero.', 'error');
      setLogIconState('error');
      return;
    }

    const authorMode = form.querySelector('input[name="authorMode"]:checked')?.value;
    if (authorMode === 'new') {
      const authorUrl = document.getElementById('umAuthorUrl')?.value.trim();
      if (authorUrl && !isAllowedHttpUrl(authorUrl)) {
        appendActivityLog('Author URL is invalid.', 'error');
        setLogIconState('error');
        return;
      }
      checkAuthorDuplicate();
      if (isDuplicateAuthor) {
        appendActivityLog('Duplicate author name.', 'error');
        setLogIconState('error');
        return;
      }
    }

    const extraMode = form.querySelector('input[name="extraMode"]:checked')?.value;
    if (extraMode !== 'none') {
      const originMode = form.querySelector('input[name="extraOriginMode"]:checked')?.value;
      if (originMode === 'new') {
        const extraUrl = document.getElementById('umExtraUrl')?.value.trim();
        if (extraUrl && !isAllowedHttpUrl(extraUrl)) {
          appendActivityLog('Source URL is invalid.', 'error');
          setLogIconState('error');
          return;
        }
        checkExtraDuplicate();
        if (isDuplicateExtra) {
          const label = extraMode === 'source' ? 'source' : 'author';
          appendActivityLog(`Duplicate ${label} name.`, 'error');
          setLogIconState('error');
          return;
        }
      }
    }

    checkDuplicate();
    if (isDuplicateName) {
      appendActivityLog(`Duplicate name: "${name}"`, 'error');
      setLogIconState('error');
      return;
    }

    const fd = buildFormData(name, category);
    setSubmitBusy(true);
    showProgress();
    setLogIconState('busy');
    appendActivityLog(`Preparing "${name}"…`, 'info');
    const uploadLogRow = appendActivityLog('Uploading to server… 0%', 'progress');

    try {
      await xhrUpload(
        fd,
        pct => {
          const clamped = Math.min(100, Math.max(0, pct));
          animateProgressTo(clamped * 0.9, 220);
          updateActivityLog(uploadLogRow, `Uploading to server… ${Math.round(clamped)}%`);
        },
        () => {
          updateActivityLog(uploadLogRow, 'Uploaded — waiting for the server…');
          startProgressTrickle();
        }
      );

      stopProgressTrickle();
      if (turnstileWidgetId !== null) {
        turnstile.reset(turnstileWidgetId);
      }
      updateActivityLog(uploadLogRow, 'Upload confirmed by server');
      appendActivityLog('Submitted successfully — awaiting review', 'success');
      setLogIconState('success');
      animateProgressTo(100, 350);
      resetForm();
      refreshCooldownFromServer();
      setTimeout(hideProgress, 500);
      setTimeout(closeModal, 2500);
    } catch (err) {
      stopProgressTrickle();
      if (turnstileWidgetId !== null) {
        try {
          turnstile.reset(turnstileWidgetId);
        } catch { }
      }

      appendActivityLog('Error: ' + err.message, 'error');
      setLogIconState('error');
      hideProgress();
      if (err.data && err.data.nextSubmitInSeconds > 0) {
        startCooldown(err.data.nextSubmitInSeconds);
      }
    } finally {
      setSubmitBusy(false);
    }
  });

  clearActivityLog();
  updatePreview();
  initTurnstile();
}

Promise.all([
  waitForAppData(),
  waitForTurnstile(),
]).then(() => {
  setupUploadModal();
});