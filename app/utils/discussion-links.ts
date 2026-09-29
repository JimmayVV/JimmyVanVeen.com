/**
 * The places a post is discussed, for the "Talk about this post on" line in its
 * footer. The conversation lives on X and Bluesky rather than in a comments
 * section here: replies there are seen by the people who follow the thread, and
 * there is nothing to moderate or store on this site.
 *
 * The URLs come from the post's optional `xThreadUrl` and `blueskyThreadUrl`
 * fields in Contentful. Contentful validates their shape on save; this checks
 * again at render, because a link the site prints must never point anywhere
 * but a post on the platform it's labelled with.
 */

export interface DiscussionLink {
  platform: "X" | "Bluesky";
  href: string;
}

interface DiscussionFields {
  xThreadUrl?: string | null | undefined;
  blueskyThreadUrl?: string | null | undefined;
}

const X_POST = /^https:\/\/(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/[0-9]+(?:[/?#].*)?$/;
const BLUESKY_POST = /^https:\/\/bsky\.app\/profile\/[^/\s]+\/post\/[A-Za-z0-9]+(?:[/?#].*)?$/;

export function discussionLinks({
  xThreadUrl,
  blueskyThreadUrl,
}: DiscussionFields): DiscussionLink[] {
  const links: DiscussionLink[] = [];
  const x = xThreadUrl?.trim();
  if (x && X_POST.test(x)) links.push({ platform: "X", href: x });
  const bluesky = blueskyThreadUrl?.trim();
  if (bluesky && BLUESKY_POST.test(bluesky)) links.push({ platform: "Bluesky", href: bluesky });
  return links;
}
