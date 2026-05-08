import { Link } from "react-router";

import { format } from "date-fns";

interface PostFooterProps {
  publishDate: string;
}

export function PostFooter({ publishDate }: PostFooterProps) {
  return (
    <footer className="blog-post-footer">
      <div className="dateline">
        Posted {format(new Date(publishDate), "MMMM d, yyyy")}
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <Link
          to="/blog"
          prefetch="intent"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--blog-accent)",
            textDecoration: "none",
          }}
        >
          ← All posts
        </Link>
      </div>
    </footer>
  );
}
