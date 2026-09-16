/**
 * One place where every page's title, description, and canonical are built.
 *
 * Before this existed, `app/root.tsx` exported a single `{ title: "Jimmy Van
 * Veen" }` and no child route except `/privacy` overrode it. React Router's
 * `meta` export *replaces* the parent's rather than merging, so the home page,
 * the blog index, and every post served that identical title with no
 * description and no canonical. Google treated it the way the docs say it
 * will: it rewrote the title and invented a snippet, which is why a search for
 * the name returned a description scraped out of the "Selected work" project
 * rows.
 *
 * Every route now calls `buildMeta`. Adding a route without it is the bug this
 * module exists to prevent.
 */

import type { MetaDescriptor } from "react-router";

export const SITE_URL = "https://www.jimmyvanveen.com";

/**
 * The name Google is asked to use for the site, via `WebSite` structured data
 * on the home page. Matches the visible brand in the top bar and footer — the
 * markup must describe what a visitor actually sees.
 */
export const SITE_NAME = "Jimmy Van Veen";

/** Title suffix for every page except the home page, which is name-forward already. */
const TITLE_SUFFIX = ` · ${SITE_NAME}`;

interface BuildMetaOptions {
  /**
   * The page's own title, without the site-name suffix. Omit only on the home
   * page, where `homeTitle` carries the full string.
   */
  title?: string | undefined;
  /** Full title used verbatim, no suffix appended. Home page only. */
  homeTitle?: string | undefined;
  /**
   * Must describe what is actually on the page. Omitted rather than invented
   * when a post has no description — no description at all beats a generic one,
   * which is a documented rewrite trigger.
   */
  description?: string | undefined;
  /** Path including the leading slash, e.g. `/blog/some-post`. */
  pathname: string;
}

/**
 * Absolute, self-referential canonical URL for a path.
 *
 * Absolute because the docs require it; self-referential because every page
 * here is its own canonical — the site has no duplicate or parameterised URLs.
 */
export function canonicalUrl(pathname: string): string {
  if (pathname === "/") return SITE_URL;
  return `${SITE_URL}${pathname.replace(/\/+$/, "")}`;
}

export function buildMeta({
  title,
  homeTitle,
  description,
  pathname,
}: BuildMetaOptions): MetaDescriptor[] {
  const resolvedTitle = homeTitle ?? `${title ?? SITE_NAME}${TITLE_SUFFIX}`;

  const descriptors: MetaDescriptor[] = [{ title: resolvedTitle }];

  if (description) {
    descriptors.push({ name: "description", content: description });
  }

  descriptors.push({
    tagName: "link",
    rel: "canonical",
    href: canonicalUrl(pathname),
  });

  return descriptors;
}
