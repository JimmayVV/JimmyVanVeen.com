import { Link } from "react-router";

import { formatPostDate } from "~/utils/format-post-date";

interface PostFooterProps {
  publishDate: string;
}

export function PostFooter({ publishDate }: PostFooterProps) {
  return (
    <footer className="blog-post-footer">
      <div className="dateline">Posted {formatPostDate(publishDate)}</div>
      <Link to="/blog" prefetch="intent" className="blog-back-link">
        ← All posts
      </Link>
    </footer>
  );
}
