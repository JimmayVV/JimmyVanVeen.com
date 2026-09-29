import { Link } from "react-router";

import type { DiscussionLink } from "~/utils/discussion-links";
import { formatPostDate } from "~/utils/format-post-date";

import { ShareButtons } from "./share-buttons";
import { XLogo } from "./x-logo";

interface PostFooterProps {
  publishDate: string;
  /** The post's slug, for its share links. The buttons are omitted without one. */
  slug?: string;
  /** Threads where this post is discussed. The line is omitted when empty. */
  discussion?: DiscussionLink[];
}

const NO_DISCUSSION: DiscussionLink[] = [];

export function PostFooter({ publishDate, slug, discussion = NO_DISCUSSION }: PostFooterProps) {
  return (
    <footer className="blog-post-footer">
      <div className="dateline">Posted {formatPostDate(publishDate)}</div>
      {discussion.length > 0 ? (
        <aside className="blog-discuss" aria-label="Discuss this post">
          <p className="blog-discuss-lede">Disagree? Tell me.</p>
          <p className="blog-discuss-body">
            The conversation about this post is on{" "}
            {discussion.map((link) => link.platform).join(" and ")}.
          </p>
          <div className="blog-discuss-actions">
            {discussion.map((link) => (
              <a
                key={link.platform}
                className="blog-discuss-button"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.platform === "X" ? <XLogo size={15} /> : null}
                Reply on {link.platform}
              </a>
            ))}
          </div>
        </aside>
      ) : null}
      <div className="blog-post-footer-row">
        <Link to="/blog" prefetch="intent" className="blog-back-link">
          ← All posts
        </Link>
        {slug ? <ShareButtons slug={slug} /> : null}
      </div>
    </footer>
  );
}
