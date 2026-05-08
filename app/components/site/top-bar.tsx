import * as React from "react";
import { Link, useLocation } from "react-router";

import { ThemeToggle } from "~/components/site/theme-toggle";

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
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const firstLinkRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the mobile sheet and returns focus to the trigger so
  // keyboard users aren't stranded inside an open menu.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Make the page content behind the open sheet inert so Tab can't
  // escape into the document below. The topbar (containing the trigger
  // and the sheet itself) lives outside <main> and stays interactive.
  React.useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (open) main.setAttribute("inert", "");
    else main.removeAttribute("inert");
    return () => main.removeAttribute("inert");
  }, [open]);

  // Move focus into the sheet on open so keyboard users land on the
  // first interactive element instead of being parked on the trigger.
  React.useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    <>
      <header className="site-topbar">
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
          ref={triggerRef}
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
      <nav
        id="site-mobile-sheet"
        className={`site-mobile-sheet${open ? " is-open" : ""}`}
        aria-label="Mobile site navigation"
        aria-hidden={!open ? true : undefined}
      >
        {SECTIONS.map((section, idx) => (
          <Link
            ref={idx === 0 ? firstLinkRef : undefined}
            key={section.to}
            to={section.to}
            prefetch="intent"
            aria-current={isActive(pathname, section.to) ? "page" : undefined}
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
