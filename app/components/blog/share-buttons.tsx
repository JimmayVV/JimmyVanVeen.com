import * as React from "react";

import { type SharePlatform, shareUrl } from "~/utils/share-links";

/**
 * Buttons that copy a post's share link for one platform, tagged so the visit
 * is credited to it in analytics. Copying, not posting: the link belongs in
 * the first reply under a post that makes the argument, so the reader pastes
 * it where it goes.
 */

const PLATFORMS: { id: SharePlatform; label: string; icon?: React.ReactNode }[] = [
  {
    id: "x",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
        />
      </svg>
    ),
  },
  { id: "linkedin", label: "LinkedIn" },
  { id: "bsky", label: "Bluesky" },
];

export function ShareButtons({ slug }: { slug: string }) {
  const [copied, setCopied] = React.useState<SharePlatform | null>(null);

  async function copy(platform: SharePlatform) {
    try {
      await navigator.clipboard.writeText(shareUrl(slug, platform));
      setCopied(platform);
    } catch {
      // Clipboard access can be refused (insecure context, permissions). The
      // link is still in each button's title, so nothing is lost but a click.
      setCopied(null);
    }
  }

  const copiedLabel = PLATFORMS.find((p) => p.id === copied)?.label;

  return (
    <div className="blog-share">
      <span>Copy link for</span>
      {PLATFORMS.map((platform) => (
        <button
          key={platform.id}
          type="button"
          className="blog-share-button"
          title={shareUrl(slug, platform.id)}
          aria-label={`Copy link for ${platform.label}`}
          onClick={() => void copy(platform.id)}
        >
          {platform.icon ?? platform.label}
        </button>
      ))}
      <span className="blog-share-status" aria-live="polite">
        {copiedLabel ? `Copied link for ${copiedLabel}` : ""}
      </span>
    </div>
  );
}
