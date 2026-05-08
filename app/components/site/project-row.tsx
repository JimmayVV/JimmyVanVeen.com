interface ProjectRowProps {
  title: string;
  description: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  screenshotUrl?: string | null;
}

export function ProjectRow({
  title,
  description,
  liveUrl,
  repoUrl,
  screenshotUrl,
}: ProjectRowProps) {
  const targetUrl = liveUrl ?? repoUrl;
  const hasScreenshot = Boolean(screenshotUrl && targetUrl);

  return (
    <article className={`project-row${hasScreenshot ? " has-screenshot" : ""}`}>
      {hasScreenshot && screenshotUrl && targetUrl ? (
        <a
          href={targetUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${title}`}
          className="row-screenshot"
        >
          <img
            src={screenshotUrl}
            alt={`Screenshot of ${title}`}
            loading="lazy"
            decoding="async"
          />
        </a>
      ) : null}
      <div className="row-body">
        <h3 className="row-title">{title}</h3>
        {description ? <p className="row-dek">{description}</p> : null}
        <div className="row-links">
          {liveUrl ? (
            <a href={liveUrl} target="_blank" rel="noreferrer">
              Live demo
            </a>
          ) : null}
          {repoUrl ? (
            <a href={repoUrl} target="_blank" rel="noreferrer">
              Source
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
