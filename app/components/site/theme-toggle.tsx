import * as React from "react";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle() {
  // useState's lazy initializer reads document.documentElement on the client
  // (theme-init.js has already set the .dark class before hydration), so
  // we don't need a second setTheme inside the effect — that would just
  // schedule a redundant re-render with the same value.
  const [theme, setTheme] = React.useState<Theme>(getInitial);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical SSR mount-swap; not worth a useSyncExternalStore rewrite for one post-mount render
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  }

  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  if (!mounted) {
    // The placeholder is intentionally non-functional and reserves
    // layout space until hydration completes. We mark it aria-hidden
    // so screen readers don't announce a stale label — getInitial()
    // returns "light" during SSR (no document) so any aria-label here
    // would be backwards for dark-mode users until mount.
    // suppressHydrationWarning lets React reconcile the real button
    // in on hydration without warning about the intentional swap.
    return (
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="blog-toggle"
        suppressHydrationWarning
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggle}
      className="blog-toggle"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
