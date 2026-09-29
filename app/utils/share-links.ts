import { SITE_URL } from "~/utils/seo";

/**
 * The link to paste when sharing a post:
 * `https://www.jimmyvanveen.com/blog/<slug>?ref=<platform>&campaign=<slug>`.
 *
 * GoatCounter reads `ref` as the visit's source and `campaign` as its campaign
 * (goatcounter.com/help/campaigns). `utm_source` would count the same, but a
 * `utm_*` link on X showed the card X had cached for the bare URL, while the
 * `ref` form fetched a fresh one, so the short names are the ones used here.
 */
export type SharePlatform = "x" | "linkedin" | "bsky";

export function shareUrl(slug: string, platform: SharePlatform): string {
  const url = new URL(`/blog/${encodeURIComponent(slug)}`, SITE_URL);
  url.searchParams.set("ref", platform);
  url.searchParams.set("campaign", slug);
  return url.toString();
}
