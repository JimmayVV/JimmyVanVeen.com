interface PlateProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  className?: string;
}

export function Plate({ src, alt, caption, credit, className }: PlateProps) {
  return (
    <figure className={`plate${className ? ` ${className}` : ""}`}>
      <div className="plate-frame">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
      {caption || credit ? (
        <figcaption className="plate-caption">
          {caption}
          {caption && credit ? "  " : null}
          {credit ? <span className="credit">— {credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
