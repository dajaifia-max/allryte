(() => {
  const root = document.documentElement;
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem('theme');
  } catch (_) {
    savedTheme = null;
  }

  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : systemTheme;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute('content', theme === 'light' ? '#f5f0e7' : '#0b1f1c');
})();
