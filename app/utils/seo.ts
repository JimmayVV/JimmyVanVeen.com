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
 *
 * The Open Graph and Twitter tags here are explicitly *not* an SEO measure. No
 * search engine documents them as a ranking or appearance signal, and the
 * audit in docs/seo-audit-2026-09-16.md records them as failing that evidence
 * bar. They are here for one reason: a link to this site pasted into Slack,
 * iMessage, Bluesky, or LinkedIn should show a title, a sentence, and a
 * picture rather than a bare URL.
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

/**
 * Fallback share image: the same Talladega plate the home page already shows.
 * Re-encoded to 381 KB, so linking to it costs a preview fetcher very little.
 */
const DEFAULT_SHARE_IMAGE = "/images/talladega_glory.jpg";
const DEFAULT_SHARE_IMAGE_ALT =
  "A pack of stock cars running three-wide down the front stretch at Talladega Superspeedway in iRacing.";

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
  /**
   * Share-card image. A path or an absolute URL; both are normalised to an
   * absolute https URL, because every preview fetcher requires one. Defaults
   * to the home-page plate.
   */
  image?: string | undefined;
  /** Alt text for the share image. Defaults alongside the image. */
  imageAlt?: string | undefined;
  /** og:type. "article" for blog posts, "website" everywhere else. */
  ogType?: "website" | "article" | undefined;
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

/**
 * Normalise anything image-shaped into an absolute https URL.
 *
 * Handles the three forms this site produces: a root-relative path from
 * public/, a protocol-relative Contentful asset URL (`//images.ctfassets.net/…`),
 * and an already-absolute URL. Preview fetchers reject relative ones.
 */
export function absoluteUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (/^https?:\/\//.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildMeta({
  title,
  homeTitle,
  description,
  pathname,
  image,
  imageAlt,
  ogType = "website",
}: BuildMetaOptions): MetaDescriptor[] {
  const resolvedTitle = homeTitle ?? `${title ?? SITE_NAME}${TITLE_SUFFIX}`;

  const descriptors: MetaDescriptor[] = [{ title: resolvedTitle }];

  if (description) {
    descriptors.push({ name: "description", content: description });
  }

  const url = canonicalUrl(pathname);

  descriptors.push({
    tagName: "link",
    rel: "canonical",
    href: url,
  });

  // Open Graph. Every consumer worth caring about reads these, including
  // Twitter/X, which falls back to og:* when a twitter:* equivalent is absent —
  // so the twitter tags below are only the two that have no og counterpart.
  descriptors.push(
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: resolvedTitle },
    { property: "og:url", content: url },
    { property: "og:image", content: absoluteUrl(image ?? DEFAULT_SHARE_IMAGE) },
    {
      property: "og:image:alt",
      content: imageAlt ?? (image ? resolvedTitle : DEFAULT_SHARE_IMAGE_ALT),
    },
  );

  if (description) {
    descriptors.push({ property: "og:description", content: description });
  }

  descriptors.push({ name: "twitter:card", content: "summary_large_image" });

  return descriptors;
}
