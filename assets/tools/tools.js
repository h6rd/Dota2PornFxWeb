(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let overlay, modal, closeBtn;

  function lock() {
    if (typeof window.openModal === 'function') window.openModal();
    else document.body.classList.add('modal-open');
  }

  function unlock() {
    if (typeof window.closeModal === 'function') window.closeModal();
    else document.body.classList.remove('modal-open');
  }

  function open() {
    overlay.classList.add('active');
    modal.classList.add('active');
    lock();
  }

  function hide() {
    overlay.classList.remove('active');
    modal.classList.remove('active');
  }

  function close() {
    hide();
    unlock();
  }

  const OPENERS = {
    wallpaper: () => window.openWallpaperModal && window.openWallpaperModal(),
    cursors: () => window.openCursorModal && window.openCursorModal(),
    localization: () => window.openLocalizationModal && window.openLocalizationModal(),
    fonts: () => window.openFontModal && window.openFontModal()
  };

  const BASE = 'assets/tools/';
  const CDN_FFLATE = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js';
  const CDN_OPENTYPE = 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js';
  const VPK = BASE + 'wallpaper/vpk.js';

  const REGISTRY = {
    wallpaper: {
      html: BASE + 'wallpaper/wallpaper.html',
      css: [BASE + 'wallpaper/wallpaper.css'],
      libs: [BASE + 'wallpaper/mediabunny.min.js', VPK],
      js: BASE + 'wallpaper/wallpaper.js'
    },
    cursors: {
      html: BASE + 'cursors/cursors.html',
      css: [BASE + 'cursors/cursors.css'],
      libs: [CDN_FFLATE],
      js: BASE + 'cursors/cursors.js'
    },
    localization: {
      html: BASE + 'localization/localization.html',
      css: [BASE + 'localization/localization.css'],
      libs: [VPK],
      js: BASE + 'localization/localization.js'
    },
    fonts: {
      html: BASE + 'fonts/fonts.html',
      css: [BASE + 'fonts/fonts.css'],
      libs: [CDN_FFLATE, CDN_OPENTYPE],
      js: BASE + 'fonts/fonts.js'
    }
  };

  const scriptCache = new Map();
  const toolCache = new Map();

  function loadScript(src) {
    if (scriptCache.has(src)) return scriptCache.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => { scriptCache.delete(src); s.remove(); reject(new Error('Failed to load ' + src)); };
      document.body.appendChild(s);
    });
    scriptCache.set(src, p);
    return p;
  }

  function loadCss(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('link[data-tool-css="' + href + '"]')) { resolve(); return; }
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.dataset.toolCss = href;
      l.onload = () => resolve();
      l.onerror = () => { l.remove(); reject(new Error('Failed to load ' + href)); };
      document.head.appendChild(l);
    });
  }

  const htmlDone = new Set();
  async function loadHtml(url) {
    if (htmlDone.has(url)) return;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Failed to load ' + url);
    const tpl = document.createElement('template');
    tpl.innerHTML = await r.text();
    if (htmlDone.has(url)) return;
    htmlDone.add(url);
    document.body.appendChild(tpl.content);
  }

  async function doLoad(tool) {
    const cfg = REGISTRY[tool];
    if (!cfg) throw new Error('Unknown tool: ' + tool);
    await Promise.all([loadHtml(cfg.html), ...cfg.css.map(loadCss), ...cfg.libs.map(loadScript)]);
    await loadScript(cfg.js);
  }

  function load(tool) {
    if (!toolCache.has(tool)) {
      const p = doLoad(tool).catch((err) => {
        toolCache.delete(tool);
        throw err;
      });
      toolCache.set(tool, p);
    }
    return toolCache.get(tool);
  }

  window.ToolsLoader = { load };

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else console.error(msg);
  }

  let picking = false;
  async function pick(tool) {
    if (picking) return;
    picking = true;
    hide();
    try {
      const ready = load(tool);
      await Promise.all([ready, new Promise((r) => setTimeout(r, 180))]);
      if (OPENERS[tool]) OPENERS[tool]();
    } catch (err) {
      console.error(err);
      toast('The tool could not be loaded. Please check your connection and try again.');
      open();
    } finally {
      picking = false;
    }
  }

  function init() {
    overlay = $('toolsOverlay');
    modal = $('toolsModal');
    closeBtn = $('closeToolsModal');
    if (!modal) return;

    ['toolsButton', 'mobileToolsButton'].forEach(id => {
      const b = $(id);
      if (!b) return;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        if (id === 'mobileToolsButton') $('mobileMenu')?.classList.remove('active');
        open();
      });
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    modal.querySelectorAll('[data-tool]').forEach(card => {
      card.addEventListener('click', () => pick(card.dataset.tool));
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('[data-tools-back]');
      if (!btn) return;
      const host = btn.closest('.info-modal');
      const closer = host && host.querySelector('.info-modal-close');
      if (closer) closer.click();
      setTimeout(() => {
        if (host && host.classList.contains('active')) return;
        open();
      }, 220);
    });

    window.openToolsModal = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
