(function () {
  const THEME_SEEDS = {
    ursa: { color: '#7b00ff', variant: 'tonal-spot' },
    brew: { color: '#ff6f00', variant: 'tonal-spot' },
    fura: { color: '#04ff00', variant: 'tonal-spot' },
    storm: { color: '#0073ff', variant: 'tonal-spot' },
    invoker: { color: '#757575', variant: 'monochrome' },
    meepo: { color: '#ff006f', variant: 'tonal-spot' },
    bh: { color: '#ffd000', variant: 'tonal-spot' },
    axe: { color: '#ff0000', variant: 'tonal-spot' },
    od: { color: '#00ff99', variant: 'tonal-spot' },
  };

  const VARIANTS = ['tonal-spot', 'fidelity', 'vibrant', 'expressive', 'rainbow', 'neutral'];
  const CONTRASTS = ['standard', 'medium', 'high'];
  const SETTINGS_KEY = 'd2pfx_settings';

  function readPref(key, allowed, fallback) {
    try {
      const v = (JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {})[key];
      return allowed.indexOf(v) !== -1 ? v : fallback;
    } catch (e) { return fallback; }
  }
  let variantPref = readPref('variant', VARIANTS, 'tonal-spot');
  let contrastPref = readPref('contrast', CONTRASTS, 'standard');

  const themes = Object.keys(THEME_SEEDS);
  const defaultTheme = 'ursa';
  const root = document.documentElement;

  let themeReady = false;

  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function resolveTheme(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return darkQuery && !darkQuery.matches ? 'light' : 'dark';
  }
  window.resolveTheme = resolveTheme;
  let freezeToken = 0;

  function freezeTransitions(updatePromise) {
    const token = ++freezeToken;
    root.classList.add('theme-switching');
    const release = () => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token === freezeToken) root.classList.remove('theme-switching');
    }));
    Promise.resolve(updatePromise).then(release, release);
    setTimeout(() => {
      if (token === freezeToken) root.classList.remove('theme-switching');
    }, 1200);
  }

  function syncM3eTheme() {
    const el = document.getElementById('appTheme');
    if (!el) return;
    const seed = THEME_SEEDS[root.getAttribute('data-gif-theme')] || THEME_SEEDS[defaultTheme];
    const scheme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = { color: seed.color, variant: variantPref, scheme, contrast: contrastPref };
    let changed = false;
    for (const name in next) {
      if (el.getAttribute(name) !== next[name]) {
        el.setAttribute(name, next[name]);
        changed = true;
      }
    }
    if (changed && themeReady) freezeTransitions(el.updateComplete);
  }
  window.syncM3eTheme = syncM3eTheme;
  window.setM3eColorOptions = function (variant, contrast) {
    const v = VARIANTS.indexOf(variant) !== -1 ? variant : 'tonal-spot';
    const c = CONTRASTS.indexOf(contrast) !== -1 ? contrast : 'standard';
    if (v === variantPref && c === contrastPref) return;
    variantPref = v;
    contrastPref = c;
    syncM3eTheme();
  };
  window.THEME_SEEDS = THEME_SEEDS;

  try {
    const savedGifIndex = localStorage.getItem('gifIndex');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    root.setAttribute('data-theme', resolveTheme(savedTheme));

    if (savedGifIndex !== null) {
      const index = parseInt(savedGifIndex);
      if (index >= 0 && index < themes.length) {
        root.setAttribute('data-gif-theme', themes[index]);
      } else {
        root.setAttribute('data-gif-theme', defaultTheme);
      }
    } else {
      root.setAttribute('data-gif-theme', defaultTheme);
    }
  } catch (e) {
  }

  if (darkQuery) {
    const onSchemeChange = () => {
      try {
        if (localStorage.getItem('theme') === 'auto') {
          root.setAttribute('data-theme', resolveTheme('auto'));
        }
      } catch (e) { }
    };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSchemeChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSchemeChange);
  }

  new MutationObserver(syncM3eTheme).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-gif-theme'],
  });

  root.classList.add('theme-pending', 'no-transition');
  const reveal = () => {
    root.classList.remove('theme-pending', 'no-transition');
    themeReady = true;
  };
  const revealNextFrames = () =>
    requestAnimationFrame(() => requestAnimationFrame(reveal));
  customElements.whenDefined('m3e-theme')
    .then(() => {
      syncM3eTheme();
      const el = document.getElementById('appTheme');
      return el && el.updateComplete;
    })
    .then(revealNextFrames, revealNextFrames);
  setTimeout(reveal, 2500);
})();