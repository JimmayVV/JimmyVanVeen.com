interface PlateProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Plate({
  src,
  alt,
  caption,
  credit,
  className,
  width,
  height,
  priority = false,
}: PlateProps) {
  return (
    <figure className={`plate${className ? ` ${className}` : ""}`}>
      <div className="plate-frame">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      </div>
      {caption || credit ? (
        <figcaption className="plate-caption">
          {caption}
          {caption && credit ? <span className="sep"> · </span> : null}
          {credit ? <span className="credit">{credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
