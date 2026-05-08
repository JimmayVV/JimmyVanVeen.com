import { formatPostDate } from "~/utils/format-post-date";

interface PostHeroProps {
  title: string;
  publishDate: string;
  description?: string;
  readingMinutes?: number;
}

export function PostHero({
  title,
  publishDate,
  description,
  readingMinutes,
}: PostHeroProps) {
  const date = formatPostDate(publishDate);
  const meta = readingMinutes ? `${date} · ${readingMinutes} min read` : date;

  return (
    <header className="blog-post-hero">
      <div className="dateline">{meta}</div>
      <h1>{title}</h1>
      {description ? <p className="dek">{description}</p> : null}
      <div className="rule" />
    </header>
  );
}
