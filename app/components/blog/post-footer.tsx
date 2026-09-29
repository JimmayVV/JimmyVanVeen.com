import { Link } from "react-router";

import type { DiscussionLink } from "~/utils/discussion-links";
import { formatPostDate } from "~/utils/format-post-date";

interface PostFooterProps {
  publishDate: string;
  /** Threads where this post is discussed. The line is omitted when empty. */
  discussion?: DiscussionLink[];
}

const NO_DISCUSSION: DiscussionLink[] = [];

export function PostFooter({ publishDate, discussion = NO_DISCUSSION }: PostFooterProps) {
  return (
    <footer className="blog-post-footer">
      <div className="dateline">Posted {formatPostDate(publishDate)}</div>
      {discussion.length > 0 ? (
        <p className="blog-discuss">
          Discuss this post on{" "}
          {discussion.map((link, index) => (
            <span key={link.platform}>
              {index > 0 ? " or " : null}
              <a href={link.href} target="_blank" rel="noopener">
                {link.platform}
              </a>
            </span>
          ))}
          .
        </p>
      ) : null}
      <Link to="/blog" prefetch="intent" className="blog-back-link">
        ← All posts
      </Link>
    </footer>
  );
}
