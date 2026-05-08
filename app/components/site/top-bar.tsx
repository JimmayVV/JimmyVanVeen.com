import * as React from "react";
import { Link, useLocation } from "react-router";

import { ThemeToggle } from "~/components/blog/theme-toggle";

const SECTIONS = [
  { label: "Home", to: "/" },
  { label: "Blog", to: "/blog" },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function TopBar() {
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="site-topbar" role="banner">
        <Link to="/" prefetch="intent" className="brand">
          Jimmy Van Veen
        </Link>
        <nav className="section-nav" aria-label="Primary">
          {SECTIONS.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              prefetch="intent"
              aria-current={isActive(pathname, section.to) ? "page" : undefined}
            >
              {section.label}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
        <button
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="site-mobile-sheet"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <ThemeToggle />
      </header>
      {open ? (
        <div
          id="site-mobile-sheet"
          className="site-mobile-sheet"
          role="dialog"
          aria-label="Site navigation"
        >
          {SECTIONS.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              prefetch="intent"
              aria-current={isActive(pathname, section.to) ? "page" : undefined}
            >
              {section.label}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
