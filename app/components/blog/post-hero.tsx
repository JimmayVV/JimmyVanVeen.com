import { formatPostDate } from "~/utils/format-post-date";
import { SITE_NAME } from "~/utils/seo";

interface PostHeroProps {
  title: string;
  publishDate: string;
  description?: string | undefined;
  readingMinutes?: number | undefined;
  /** Falls back to the site owner — posts without an explicit Contentful author are his. */
  author?: string | undefined;
}

export function PostHero({
  title,
  publishDate,
  description,
  readingMinutes,
  author,
}: PostHeroProps) {
  const date = formatPostDate(publishDate);
  const byline = author ?? SITE_NAME;
  // The byline is visible because the Article markup on this page claims an
  // author, and structured data may only describe what a visitor can see.
  const meta = readingMinutes
    ? `By ${byline} · ${date} · ${readingMinutes} min read`
    : `By ${byline} · ${date}`;

  return (
    <header className="blog-post-hero">
      <div className="dateline">{meta}</div>
      <h1>{title}</h1>
      {description ? <p className="dek">{description}</p> : null}
      <div className="rule" />
    </header>
  );
}
