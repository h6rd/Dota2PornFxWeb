(function () {
  const THEME_SEEDS = {
    ursa: { color: '#7b00ff', variant: 'tonal-spot' },
    brew: { color: '#ffa45e', variant: 'tonal-spot' },
    fura: { color: '#215c20', variant: 'tonal-spot' },
    storm: { color: '#416897', variant: 'tonal-spot' },
    invoker: { color: '#757575', variant: 'monochrome' },
    meepo: { color: '#ff006f', variant: 'tonal-spot' },
    bh: { color: '#3e3717', variant: 'tonal-spot' },
    axe: { color: '#ae0000', variant: 'tonal-spot' },
    od: { color: '#265443', variant: 'tonal-spot' },
  };

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
    const next = { color: seed.color, variant: seed.variant, scheme };
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