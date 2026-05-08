import { Link } from "react-router";
import { format, parseISO } from "date-fns";

interface PostFooterProps {
  publishDate: string;
}

export function PostFooter({ publishDate }: PostFooterProps) {
  return (
    <footer className="blog-post-footer">
      <div className="dateline">
        Posted {format(parseISO(publishDate), "MMMM d, yyyy")}
      </div>
      <Link to="/blog" prefetch="intent" className="blog-back-link">
        ← All posts
      </Link>
    </footer>
  );
}
