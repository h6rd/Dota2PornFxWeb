(function () {
  try {
    const savedGifIndex = localStorage.getItem('gifIndex');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const hasClicked = localStorage.getItem('gifClicked') === 'true';

    const themes = ['ursa', 'brew', 'fura', 'storm', 'invoker', 'meepo', 'bh', 'axe'];
    const defaultTheme = 'ursa';

    document.documentElement.setAttribute('data-theme', savedTheme);

    if (savedGifIndex !== null) {
      const index = parseInt(savedGifIndex);
      if (index >= 0 && index < themes.length) {
        document.documentElement.setAttribute('data-gif-theme', themes[index]);
      } else {
        document.documentElement.setAttribute('data-gif-theme', defaultTheme);
      }
    } else {
      document.documentElement.setAttribute('data-gif-theme', defaultTheme);
    }
  } catch (e) {
  }
})();