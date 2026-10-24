(function () {
  'use strict';

  var SETTINGS_KEY = 'd2pfx_settings';
  var MAX_SHAPES = 8;
  var MAX_PER_COLOR = 2;
  var SHAPE_OPACITY = 0.8;
  var DEFAULTS = { enabled: true, shapes: 3, seed: 927850948 };

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
  var COLORS = COLOR_ROLES.map(function (r) {
    return 'var(--md-sys-color-' + r + ', var(--md-sys-color-primary-container))';
  });

  function readAll() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function clamp(v, a, b) { return isNaN(v) ? a : Math.min(b, Math.max(a, v)); }
  function normalize(c) {
    c = Object.assign({}, DEFAULTS, c || {});
    return {
      enabled: !!c.enabled,
      shapes: Math.round(clamp(+c.shapes, 1, MAX_SHAPES)),
      seed: (c.seed | 0) || 1
    };
  }
  function load() { return normalize(readAll().wallpaper); }
  function save(cfg) {
    var s = readAll();
    s.wallpaper = cfg;
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

  var root, shapesEl, lastKey = '', cfg = load();

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

  function renderShapes() {
    shapesEl.textContent = '';
    shapesEl.style.opacity = SHAPE_OPACITY;
    var rand = rng(cfg.seed);
    var vw = window.innerWidth || 1280, vh = window.innerHeight || 720;
    var vmin = Math.min(vw, vh) / 100;
    var placed = [];
    var colorUse = COLORS.map(function () { return 0; });
    var GAP = 0.04;
    var zoneHalf = Math.min(vw * 0.36, 540);
    var zoneTop = 100;
    var pool = SHAPES.slice();
    for (var s = pool.length - 1; s > 0; s--) {
      var j = Math.floor(rand() * (s + 1));
      var tmp = pool[s]; pool[s] = pool[j]; pool[j] = tmp;
    }
    for (var i = 0; i < cfg.shapes && i < pool.length; i++) {
      var name = pool[i];
      var size = 16 + rand() * 28;
      var x, y, ok = false;
      for (var round = 0; round < 6 && !ok; round++) {
        var r = size * vmin / 2;
        for (var t = 0; t < 40; t++) {
          var cx = vw * (-0.06 + rand() * 1.12), cy = vh * (-0.06 + rand() * 1.12);
          var free = !(cy > zoneTop && Math.abs(cx - vw / 2) < zoneHalf);
          for (var k = 0; k < placed.length; k++) {
            var dx = cx - placed[k].x, dy = cy - placed[k].y;
            var min = r + placed[k].r + 2 * Math.min(r, placed[k].r) * GAP;
            if (dx * dx + dy * dy < min * min) { free = false; break; }
          }
          if (free) { x = (cx - r) / vw * 100; y = (cy - r) / vh * 100; ok = true; placed.push({ x: cx, y: cy, r: r }); break; }
        }
        if (!ok) size *= 0.85;
        if (size < 8) break;
      }
      if (!ok) continue;
      var dur = 70 + rand() * 110;
      var dir = rand() < 0.5 ? 'normal' : 'reverse';
      var avail = [];
      for (var ci = 0; ci < COLORS.length; ci++) if (colorUse[ci] < MAX_PER_COLOR) avail.push(ci);
      if (!avail.length) {
        colorUse = COLORS.map(function () { return 0; });
        for (ci = 0; ci < COLORS.length; ci++) avail.push(ci);
      }
      var pick = avail[Math.floor(rand() * avail.length)];
      colorUse[pick]++;
      var color = COLORS[pick];
      var start = Math.round(rand() * 360);

      var wrap = document.createElement('div');
      wrap.className = 'wp-shape';
      wrap.style.cssText = 'width:' + size.toFixed(1) + 'vmin;height:' + size.toFixed(1) + 'vmin;left:' +
        x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;animation-duration:' + dur.toFixed(1) +
        's;animation-direction:' + dir + ';animation-delay:-' + (dur * start / 360).toFixed(1) + 's;';
      var sh = document.createElement('m3e-shape');
      sh.setAttribute('name', name);
      sh.style.setProperty('--m3e-shape-container-color', color);
      wrap.appendChild(sh);
      shapesEl.appendChild(wrap);
    }
  }

  function syncUi() {
    var $ = function (id) { return document.getElementById(id); };
    var en = $('wpEnabled'); if (en) en.checked = cfg.enabled;
    var body = $('wpBody'); if (body) body.classList.toggle('disabled', !cfg.enabled);
    var el = $('wpShapes'); if (el) el.value = cfg.shapes;
    var v = $('wpShapesVal'); if (v) v.textContent = cfg.shapes;
  }

  function apply(next) {
    cfg = normalize(next || cfg);
    lastKey = JSON.stringify(cfg);
    ensureDom();
    document.documentElement.classList.toggle('has-wallpaper', cfg.enabled);
    if (cfg.enabled) renderShapes();
    syncUi();
  }

  function update(patch) {
    var n = normalize(Object.assign({}, cfg, patch));
    save(n);
    apply(n);
  }

  function bind() {
    var $ = function (id) { return document.getElementById(id); };
    var en = $('wpEnabled');
    if (en) en.addEventListener('change', function () { update({ enabled: en.checked }); });

    var cnt = $('wpShapes');
    if (cnt) cnt.addEventListener('input', function () { update({ shapes: +cnt.value }); });

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
        if (cfg.enabled) renderShapes();
      }, 300);
    });

    var shuffle = $('wpShuffle');
    if (shuffle) shuffle.addEventListener('click', function () {
      update({ seed: Math.floor(Math.random() * 1e9) + 1 });
    });
    var reset = $('wpReset');
    if (reset) reset.addEventListener('click', function () {
      update(Object.assign({}, DEFAULTS, { enabled: cfg.enabled }));
    });
  }

  window.applyWallpaper = function (c) {
    var n = normalize(c ? c : readAll().wallpaper);
    var key = JSON.stringify(n);
    if (key === lastKey) return;
    lastKey = key;
    apply(n);
  };
  window.getWallpaperConfig = function () { return cfg; };

  function init() { lastKey = JSON.stringify(cfg); apply(cfg); bind(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();