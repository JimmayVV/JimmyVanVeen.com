(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (stored === null && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch (_e) {
    /* noop */
  }
})();
