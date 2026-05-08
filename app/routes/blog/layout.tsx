import { Link, Outlet } from "react-router";

import { ThemeToggle } from "~/components/blog/theme-toggle";

export default function Blog() {
  return (
    <div className="blog-theme">
      <header className="blog-topbar">
        <Link to="/" prefetch="intent" className="brand">
          ← Jimmy Van Veen
        </Link>
        <ThemeToggle />
      </header>
      <Outlet />
    </div>
  );
}
