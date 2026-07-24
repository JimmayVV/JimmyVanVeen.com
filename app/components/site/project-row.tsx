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
  // Only render the screenshot when there's somewhere to click — a
  // decorative thumbnail with no associated action is dead UI.
  const showScreenshot = screenshotUrl != null && targetUrl != null;

  return (
    <article className={`project-row${showScreenshot ? " has-screenshot" : ""}`}>
      {showScreenshot ? (
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
            width={1200}
            height={750}
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
