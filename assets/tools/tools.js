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

  function pick(tool) {
    hide();
    setTimeout(() => { if (OPENERS[tool]) OPENERS[tool](); }, 180);
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

    document.querySelectorAll('[data-tools-back]').forEach(btn => {
      btn.addEventListener('click', () => {
        const host = btn.closest('.info-modal');
        const closer = host && host.querySelector('.info-modal-close');
        if (closer) closer.click();
        setTimeout(() => {
          if (host && host.classList.contains('active')) return;
          open();
        }, 220);
      });
    });

    window.openToolsModal = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
