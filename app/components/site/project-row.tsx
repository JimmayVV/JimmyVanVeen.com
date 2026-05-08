interface ProjectRowProps {
  title: string;
  description?: string | null;
  liveUrl?: string | null;
  repoUrl?: string;
}

export function ProjectRow({
  title,
  description,
  liveUrl,
  repoUrl,
}: ProjectRowProps) {
  return (
    <article className="project-row">
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
    </article>
  );
}
