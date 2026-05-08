(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored !== "light" && stored !== "dark") stored = null;
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (stored === null && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch (_e) {
    /* noop */
  }
})();
