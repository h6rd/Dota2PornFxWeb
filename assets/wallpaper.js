(function () {
  'use strict';

  var SETTINGS_KEY = 'd2pfx_settings';
  var MAX_SHAPES = 8;
  var MAX_ITEMS = 40;
  var MAX_PER_COLOR = 2;
  var SHAPE_OPACITY = 0.8;
  var MIN_SIZE = 6;
  var MAX_SIZE = 80;
  var DEFAULTS = { enabled: true, shapes: 3, seed: 927850948, items: null };

  var VALID = [
    '4-leaf-clover', '4-sided-cookie', '6-sided-cookie', '7-sided-cookie',
    '8-leaf-clover', '9-sided-cookie', '12-sided-cookie', 'arch', 'arrow',
    'boom', 'bun', 'burst', 'circle', 'diamond', 'fan', 'flower', 'gem',
    'ghost-ish', 'heart', 'hexagon', 'oval', 'pentagon', 'pill', 'pixel-circle',
    'pixel-triangle', 'puffy', 'puffy-diamond', 'semicircle', 'slanted',
    'soft-boom', 'soft-burst', 'square', 'sunny', 'triangle', 'very-sunny'
  ];
  var EXCLUDED = ['circle', 'boom', 'pixel-triangle', 'puffy', 'burst', 'puffy-diamond', 'oval'];
  var SHAPES = [
    'soft-burst', 'flower', 'sunny', 'very-sunny',
    '4-leaf-clover', '4-sided-cookie', '6-sided-cookie', '7-sided-cookie',
    '8-leaf-clover', '9-sided-cookie', '12-sided-cookie', 'pentagon', 'gem',
    'soft-boom', 'pill', 'square'
  ].filter(function (n) {
    return EXCLUDED.indexOf(n) < 0 && VALID.indexOf(n) >= 0;
  });
  var COLOR_ROLES = [
    'primary', 'secondary', 'tertiary',
    'primary-container', 'secondary-container', 'tertiary-container',
    'primary-fixed', 'primary-fixed-dim',
    'secondary-fixed', 'secondary-fixed-dim',
    'tertiary-fixed', 'tertiary-fixed-dim',
    'surface-container-highest', 'surface-variant'
  ];

  function colorVar(role) {
    return 'var(--md-sys-color-' + role + ', var(--md-sys-color-primary-container))';
  }

  function readAll() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function clamp(v, a, b) { return isNaN(v) ? a : Math.min(b, Math.max(a, v)); }
  function num(v, def, a, b) { v = +v; return (v !== v || v === null) ? def : Math.min(b, Math.max(a, v)); }
  function rid() { return 'n' + Math.random().toString(36).slice(2, 9); }

  function normItem(it, i) {
    if (!it || VALID.indexOf(it.shape) < 0) return null;
    return {
      id: typeof it.id === 'string' && it.id ? it.id : 'i' + i,
      shape: it.shape,
      color: COLOR_ROLES.indexOf(it.color) >= 0 ? it.color : 'primary-container',
      x: num(it.x, 0.5, -0.2, 1.2),
      y: num(it.y, 0.5, -0.2, 1.2),
      size: num(it.size, 24, MIN_SIZE, MAX_SIZE),
      dur: num(it.dur, 90, 20, 400),
      dir: it.dir === 'reverse' ? 'reverse' : 'normal',
      start: num(it.start, 0, 0, 360)
    };
  }
  function normalize(c) {
    c = Object.assign({}, DEFAULTS, c || {});
    var items = null;
    if (Array.isArray(c.items)) {
      items = c.items.map(normItem).filter(Boolean).slice(0, MAX_ITEMS);
    }
    return {
      enabled: !!c.enabled,
      shapes: Math.round(clamp(+c.shapes, 1, MAX_SHAPES)),
      seed: (c.seed | 0) || 1,
      items: items
    };
  }
  function load() { return normalize(readAll().wallpaper); }
  function save(c) {
    var s = readAll();
    s.wallpaper = c;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { }
  }

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function generateItems(c) {
    var rand = rng(c.seed);
    var vw = window.innerWidth || 1280, vh = window.innerHeight || 720;
    var vmin = Math.min(vw, vh) / 100;
    var placed = [];
    var colorUse = COLOR_ROLES.map(function () { return 0; });
    var GAP = 0.04;
    var zoneHalf = Math.min(vw * 0.36, 540);
    var zoneTop = 100;
    var pool = SHAPES.slice();
    var out = [];
    for (var s = pool.length - 1; s > 0; s--) {
      var j = Math.floor(rand() * (s + 1));
      var tmp = pool[s]; pool[s] = pool[j]; pool[j] = tmp;
    }
    for (var i = 0; i < c.shapes && i < pool.length; i++) {
      var size = 16 + rand() * 28;
      var cx = 0, cy = 0, ok = false;
      for (var round = 0; round < 6 && !ok; round++) {
        var r = size * vmin / 2;
        for (var t = 0; t < 40; t++) {
          var px = vw * (-0.06 + rand() * 1.12), py = vh * (-0.06 + rand() * 1.12);
          var free = !(py > zoneTop && Math.abs(px - vw / 2) < zoneHalf);
          for (var k = 0; k < placed.length; k++) {
            var dx = px - placed[k].x, dy = py - placed[k].y;
            var min = r + placed[k].r + 2 * Math.min(r, placed[k].r) * GAP;
            if (dx * dx + dy * dy < min * min) { free = false; break; }
          }
          if (free) { cx = px; cy = py; ok = true; placed.push({ x: px, y: py, r: r }); break; }
        }
        if (!ok) size *= 0.85;
        if (size < 8) break;
      }
      if (!ok) continue;
      var dur = 70 + rand() * 110;
      var dir = rand() < 0.5 ? 'normal' : 'reverse';
      var avail = [];
      for (var ci = 0; ci < COLOR_ROLES.length; ci++) if (colorUse[ci] < MAX_PER_COLOR) avail.push(ci);
      if (!avail.length) {
        colorUse = COLOR_ROLES.map(function () { return 0; });
        for (ci = 0; ci < COLOR_ROLES.length; ci++) avail.push(ci);
      }
      var pick = avail[Math.floor(rand() * avail.length)];
      colorUse[pick]++;
      var start = Math.round(rand() * 360);
      out.push({
        id: 'a' + i, shape: pool[i], color: COLOR_ROLES[pick],
        x: cx / vw, y: cy / vh, size: size, dur: dur, dir: dir, start: start
      });
    }
    return out;
  }

  var root, shapesEl, lastKey = '', cfg = load();
  var nodes = {};

  function ensureDom() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'wallpaper';
    root.setAttribute('aria-hidden', 'true');
    shapesEl = document.createElement('div');
    shapesEl.className = 'wp-shapes';
    root.appendChild(shapesEl);
    document.body.insertBefore(root, document.body.firstChild);
  }

  function placeNode(node, it) {
    var s = it.size.toFixed(2) + 'vmin';
    node.style.width = s;
    node.style.height = s;
    node.style.left = 'calc(' + (it.x * 100).toFixed(3) + '% - ' + (it.size / 2).toFixed(2) + 'vmin)';
    node.style.top = 'calc(' + (it.y * 100).toFixed(3) + '% - ' + (it.size / 2).toFixed(2) + 'vmin)';
  }

  function clearShapes() {
    shapesEl.textContent = '';
    nodes = {};
  }

  function renderItems(items) {
    shapesEl.style.opacity = SHAPE_OPACITY;
    var seen = {};
    items.forEach(function (it) {
      seen[it.id] = true;
      var wrap = nodes[it.id];
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'wp-shape';
        wrap.style.animationDuration = it.dur.toFixed(1) + 's';
        wrap.style.animationDirection = it.dir;
        wrap.style.animationDelay = '-' + (it.dur * it.start / 360).toFixed(1) + 's';
        wrap.appendChild(document.createElement('m3e-shape'));
        shapesEl.appendChild(wrap);
        nodes[it.id] = wrap;
      }
      placeNode(wrap, it);
      var sh = wrap.firstChild;
      if (sh.getAttribute('name') !== it.shape) sh.setAttribute('name', it.shape);
      sh.style.setProperty('--m3e-shape-container-color', colorVar(it.color));
    });
    Object.keys(nodes).forEach(function (id) {
      if (!seen[id]) { nodes[id].remove(); delete nodes[id]; }
    });
  }

  function renderConfig() {
    if (!cfg.enabled) { clearShapes(); return; }
    renderItems(cfg.items || generateItems(cfg));
  }

  function syncUi() {
    var $ = function (id) { return document.getElementById(id); };
    var en = $('wpEnabled'); if (en) en.checked = cfg.enabled;
    var body = $('wpBody'); if (body) body.classList.toggle('disabled', !cfg.enabled);
    var el = $('wpShapes');
    if (el) {
      el.value = cfg.items ? Math.min(cfg.items.length, MAX_SHAPES) : cfg.shapes;
      el.disabled = !!cfg.items;
      el.dispatchEvent(new Event('input'));
    }
    var v = $('wpShapesVal'); if (v) v.textContent = cfg.items ? cfg.items.length : cfg.shapes;
    var lab = $('wpShapesLabel'); if (lab) lab.textContent = cfg.items ? 'Shapes (custom layout)' : 'Shapes';
  }

  function apply(next) {
    cfg = normalize(next || cfg);
    lastKey = JSON.stringify(cfg);
    ensureDom();
    document.documentElement.classList.toggle('has-wallpaper', cfg.enabled);
    if (!editing) renderConfig();
    syncUi();
  }

  function update(patch) {
    var n = normalize(Object.assign({}, cfg, patch));
    save(n);
    apply(n);
  }

  var editing = false, dirty = false, placing = false;
  var draft = [], selectedId = null;
  var brush = { shape: 'flower', color: 'primary-container', size: 28 };
  var ed = null;
  var hmap = {};

  function getItem(id) {
    for (var i = 0; i < draft.length; i++) if (draft[i].id === id) return draft[i];
    return null;
  }
  function labelOf(s) { return s.replace(/-/g, ' '); }
  function toast(msg) { if (typeof window.showToast === 'function') window.showToast(msg); }

  function buildEditor() {
    var d = document.createElement('div');
    d.id = 'wpEditor';
    d.className = 'wpe';
    d.innerHTML =
      '<div class="wpe-stage" id="wpeStage"></div>' +
      '<div class="wpe-bar" role="dialog" aria-label="Wallpaper editor">' +
      '<div class="wpe-head">' +
      '<span class="wpe-title">Edit wallpaper</span>' +
      '<span class="wpe-hint" id="wpeHint"></span>' +
      '<button type="button" class="wpe-icon-btn" id="wpeMin" aria-label="Collapse panel" title="Collapse panel">' +
      '<span class="material-symbols-rounded">expand_more</span></button>' +
      '</div>' +
      '<div class="wpe-sections">' +
      '<div class="wpe-section"><span class="wpe-label">Shape</span>' +
      '<div class="wpe-shapes" id="wpeShapes"></div></div>' +
      '<div class="wpe-section"><span class="wpe-label">Color</span>' +
      '<div class="wpe-colors" id="wpeColors"></div></div>' +
      '<div class="wpe-section"><span class="wpe-label">Size <span class="st-range-val" id="wpeSizeVal"></span></span>' +
      '<input type="range" class="st-range wpe-range" id="wpeSize" min="' + MIN_SIZE + '" max="' + MAX_SIZE + '" step="1" aria-label="Shape size"></div>' +
      '</div>' +
      '<div class="wpe-actions">' +
      '<button type="button" class="st-btn" id="wpeAdd" aria-pressed="false"><span class="material-symbols-rounded">add</span><span>Add</span></button>' +
      '<button type="button" class="st-btn" id="wpeDelete"><span class="material-symbols-rounded">delete</span><span>Delete</span></button>' +
      '<button type="button" class="st-btn" id="wpeClear"><span class="material-symbols-rounded">delete_sweep</span><span>Clear</span></button>' +
      '<span class="wpe-spacer"></span>' +
      '<button type="button" class="st-btn" id="wpeCancel"><span class="material-symbols-rounded">close</span><span>Cancel</span></button>' +
      '<button type="button" class="st-btn st-btn--primary" id="wpeDone"><span class="material-symbols-rounded">check</span><span>Done</span></button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(d);

    ed = {
      root: d,
      stage: d.querySelector('#wpeStage'),
      bar: d.querySelector('.wpe-bar'),
      hint: d.querySelector('#wpeHint'),
      shapes: d.querySelector('#wpeShapes'),
      colors: d.querySelector('#wpeColors'),
      size: d.querySelector('#wpeSize'),
      sizeVal: d.querySelector('#wpeSizeVal'),
      add: d.querySelector('#wpeAdd'),
      del: d.querySelector('#wpeDelete')
    };

    VALID.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wpe-shape-btn';
      b.dataset.shape = name;
      b.title = labelOf(name);
      b.setAttribute('aria-label', labelOf(name));
      var m = document.createElement('m3e-shape');
      m.setAttribute('name', name);
      b.appendChild(m);
      ed.shapes.appendChild(b);
    });
    COLOR_ROLES.forEach(function (role) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wpe-swatch';
      b.dataset.color = role;
      b.title = labelOf(role);
      b.setAttribute('aria-label', labelOf(role));
      b.style.setProperty('--c', colorVar(role));
      ed.colors.appendChild(b);
    });

    ed.shapes.addEventListener('click', function (e) {
      var b = e.target.closest('.wpe-shape-btn'); if (b) change({ shape: b.dataset.shape });
    });
    ed.colors.addEventListener('click', function (e) {
      var b = e.target.closest('.wpe-swatch'); if (b) change({ color: b.dataset.color });
    });
    ed.size.addEventListener('input', function () { change({ size: +ed.size.value }); });

    ed.add.addEventListener('click', function () { setPlacing(!placing); });
    ed.del.addEventListener('click', removeSelected);
    d.querySelector('#wpeClear').addEventListener('click', function () {
      if (!draft.length) return;
      draft = []; selectedId = null; dirty = true;
      refresh();
    });
    d.querySelector('#wpeCancel').addEventListener('click', function () { finish(false); });
    d.querySelector('#wpeDone').addEventListener('click', function () { finish(true); });
    d.querySelector('#wpeMin').addEventListener('click', function () {
      var min = ed.bar.classList.toggle('min');
      this.setAttribute('aria-label', min ? 'Expand panel' : 'Collapse panel');
    });

    ed.stage.addEventListener('pointerdown', function (e) {
      if (e.target !== ed.stage) return;
      if (placing) addAt(e.clientX, e.clientY);
      else select(null);
    });
  }

  function current() { return getItem(selectedId) || brush; }

  function syncPalette() {
    if (!ed) return;
    var cur = current();
    ed.shapes.style.setProperty('--wpe-color', colorVar(cur.color));
    Array.prototype.forEach.call(ed.shapes.children, function (b) {
      b.classList.toggle('active', b.dataset.shape === cur.shape);
    });
    Array.prototype.forEach.call(ed.colors.children, function (b) {
      b.classList.toggle('active', b.dataset.color === cur.color);
    });
    var size = Math.round(cur.size);
    ed.size.value = size;
    ed.sizeVal.textContent = size;
    ed.size.style.setProperty('--st-pct', ((size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE) * 100) + '%');
    ed.del.disabled = !selectedId;
    ed.add.classList.toggle('active', placing);
    ed.add.setAttribute('aria-pressed', placing ? 'true' : 'false');
    ed.stage.classList.toggle('placing', placing);
    ed.hint.textContent = placing
      ? 'Tap anywhere to place a shape'
      : selectedId
        ? 'Drag to move · drag the dot to resize'
        : draft.length ? 'Select a shape to edit it, or press Add' : 'Press Add to place a shape';
  }

  function syncHandles() {
    if (!ed) return;
    var seen = {};
    draft.forEach(function (it) {
      seen[it.id] = true;
      var h = hmap[it.id];
      if (!h) {
        h = document.createElement('div');
        h.className = 'wpe-handle';
        h.dataset.id = it.id;
        h.addEventListener('pointerdown', onHandleDown);
        ed.stage.appendChild(h);
        hmap[it.id] = h;
      }
      placeNode(h, it);
      var sel = it.id === selectedId;
      h.classList.toggle('selected', sel);
      var knob = h.firstChild;
      if (sel && !knob) {
        knob = document.createElement('span');
        knob.className = 'wpe-knob';
        knob.addEventListener('pointerdown', onKnobDown);
        h.appendChild(knob);
      } else if (!sel && knob) {
        knob.remove();
      }
    });
    Object.keys(hmap).forEach(function (id) {
      if (!seen[id]) { hmap[id].remove(); delete hmap[id]; }
    });
  }

  function refresh() {
    renderItems(draft);
    syncHandles();
    syncPalette();
  }

  function setPlacing(on) {
    placing = !!on;
    if (placing) selectedId = null;
    syncHandles();
    syncPalette();
  }

  function select(id) {
    selectedId = id;
    var it = getItem(id);
    if (it) { brush.shape = it.shape; brush.color = it.color; brush.size = it.size; }
    syncHandles();
    syncPalette();
  }

  function change(patch) {
    Object.assign(brush, patch);
    var it = getItem(selectedId);
    if (it) { Object.assign(it, patch); dirty = true; }
    refresh();
  }

  function addAt(px, py) {
    if (draft.length >= MAX_ITEMS) { toast('Shape limit reached'); return; }
    var it = {
      id: rid(), shape: brush.shape, color: brush.color, size: brush.size,
      x: clamp(px / (window.innerWidth || 1), -0.2, 1.2),
      y: clamp(py / (window.innerHeight || 1), -0.2, 1.2),
      dur: 70 + Math.random() * 110,
      dir: Math.random() < 0.5 ? 'normal' : 'reverse',
      start: Math.round(Math.random() * 360)
    };
    draft.push(it);
    dirty = true;
    selectedId = it.id;
    placing = true;
    refresh();
  }

  function removeSelected() {
    if (!selectedId) return;
    draft = draft.filter(function (i) { return i.id !== selectedId; });
    selectedId = null; dirty = true;
    refresh();
  }

  function onHandleDown(e) {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    var h = e.currentTarget, id = h.dataset.id, it = getItem(id);
    if (!it) return;
    placing = false;
    select(id);
    var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
    var ox = e.clientX - it.x * vw, oy = e.clientY - it.y * vh;
    try { h.setPointerCapture(e.pointerId); } catch (_) { }
    function move(ev) {
      it.x = clamp((ev.clientX - ox) / vw, -0.2, 1.2);
      it.y = clamp((ev.clientY - oy) / vh, -0.2, 1.2);
      dirty = true;
      placeNode(h, it);
      if (nodes[id]) placeNode(nodes[id], it);
    }
    function up() {
      h.removeEventListener('pointermove', move);
      h.removeEventListener('pointerup', up);
      h.removeEventListener('pointercancel', up);
    }
    h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', up);
    h.addEventListener('pointercancel', up);
  }

  function onKnobDown(e) {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    var k = e.currentTarget, h = k.parentNode, it = getItem(h.dataset.id);
    if (!it) return;
    var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
    var vmin = Math.min(vw, vh) / 100;
    try { k.setPointerCapture(e.pointerId); } catch (_) { }
    function move(ev) {
      var dx = ev.clientX - it.x * vw, dy = ev.clientY - it.y * vh;
      it.size = clamp(2 * Math.sqrt(dx * dx + dy * dy) / vmin, MIN_SIZE, MAX_SIZE);
      brush.size = it.size;
      dirty = true;
      placeNode(h, it);
      if (nodes[it.id]) placeNode(nodes[it.id], it);
      syncPalette();
    }
    function up() {
      k.removeEventListener('pointermove', move);
      k.removeEventListener('pointerup', up);
      k.removeEventListener('pointercancel', up);
    }
    k.addEventListener('pointermove', move);
    k.addEventListener('pointerup', up);
    k.addEventListener('pointercancel', up);
  }

  function startEdit() {
    if (editing) return;
    editing = true;
    dirty = false; placing = false; selectedId = null;
    var wasEnabled = cfg.enabled;
    ensureDom();
    document.documentElement.classList.add('has-wallpaper', 'wp-editing');
    draft = (cfg.items || generateItems(cfg)).map(function (i) { return Object.assign({}, i); });
    if (!wasEnabled) clearShapes();
    buildEditor();
    refresh();
    if (typeof window.openModal === 'function') window.openModal();
  }

  function finish(commit) {
    if (!editing) return;
    editing = false;
    var items = draft;
    draft = []; selectedId = null; placing = false;
    hmap = {};
    if (ed) { ed.root.remove(); ed = null; }
    document.documentElement.classList.remove('wp-editing');
    if (typeof window.closeModal === 'function') window.closeModal();
    if (commit && dirty) {
      update({ enabled: true, items: items });
    } else {
      apply(cfg);
    }
    dirty = false;
  }

  window.addEventListener('keydown', function (e) {
    if (!editing) return;
    var tag = e.target && e.target.tagName;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (placing) setPlacing(false);
      else if (selectedId) select(null);
      else finish(true);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && tag !== 'INPUT') {
      e.preventDefault(); e.stopPropagation();
      removeSelected();
    }
  }, true);

  function bind() {
    var $ = function (id) { return document.getElementById(id); };
    var en = $('wpEnabled');
    if (en) en.addEventListener('change', function () { update({ enabled: en.checked }); });

    var cnt = $('wpShapes');
    if (cnt) cnt.addEventListener('input', function (e) {
      if (!e.isTrusted || cfg.items) return;
      update({ shapes: +cnt.value });
    });

    var edit = $('wpEdit');
    if (edit) edit.addEventListener('click', function () {
      var close = $('closeSettingsModal');
      if (close) close.click();
      startEdit();
    });

    var toggle = $('wpToggle'), collapse = $('wpCollapse');
    function setOpen(open) {
      if (!toggle || !collapse) return;
      collapse.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (toggle) toggle.addEventListener('click', function () {
      setOpen(!collapse.classList.contains('open'));
    });

    var modal = $('settingsModal');
    if (modal && window.MutationObserver) {
      var wasActive = modal.classList.contains('active');
      new MutationObserver(function () {
        var active = modal.classList.contains('active');
        if (wasActive && !active) setTimeout(function () {
          if (!modal.classList.contains('active')) setOpen(false);
        }, 350);
        wasActive = active;
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    var rt, lw = window.innerWidth, lh = window.innerHeight;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var w = window.innerWidth, h = window.innerHeight;
        if (Math.abs(w - lw) < 40 && Math.abs(h - lh) < 150) return;
        lw = w; lh = h;
        if (cfg.enabled && !editing && !cfg.items) renderConfig();
      }, 300);
    });

    var shuffle = $('wpShuffle');
    if (shuffle) shuffle.addEventListener('click', function () {
      update({ seed: Math.floor(Math.random() * 1e9) + 1, items: null });
    });
    var reset = $('wpReset');
    if (reset) reset.addEventListener('click', function () {
      update(Object.assign({}, DEFAULTS, { enabled: cfg.enabled }));
    });
  }

  window.applyWallpaper = function (c) {
    if (editing) return;
    var n = normalize(c ? c : readAll().wallpaper);
    var key = JSON.stringify(n);
    if (key === lastKey) return;
    lastKey = key;
    apply(n);
  };
  window.getWallpaperConfig = function () { return cfg; };
  window.editWallpaper = startEdit;

  function init() { lastKey = JSON.stringify(cfg); apply(cfg); bind(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();