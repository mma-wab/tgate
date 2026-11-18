/* Applies the saved theme and language before first paint to avoid flashes. */
(function () {
  try {
    var root = document.documentElement;
    var theme = localStorage.getItem('tph:theme');
    var prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = theme === 'dark' || (!theme && prefersDark);
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';

    var lang = localStorage.getItem('tph:lang');
    lang = lang === 'en' ? 'en' : 'ar';
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  } catch (error) {
    /* Storage can be unavailable in private modes; defaults still render. */
  }
})();
