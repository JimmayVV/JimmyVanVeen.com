import * as React from "react";

import { type Point, type Rink, PARLA_PHOTO_FIT, perimeter, projectToPhoto } from "./geometry";
import { type Era } from "./rink-plan";

export const PARLA_PHOTO = {
  src: "/exhibits/garden-ice/boston-garden-1995.jpg",
  credit: "Troy Parla",
  source: "https://commons.wikimedia.org/wiki/File:BostonGardenNHL.jpg",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
} as const;

function photoPath(rink: Rink): string {
  return `${perimeter(rink, 48)
    .map((point: Point, i) => {
      const [u, v] = projectToPhoto(point);
      return `${i ? "L" : "M"}${u.toFixed(1)} ${v.toFixed(1)}`;
    })
    .join("")}Z`;
}

const CHOICES: { era: Era; label: string }[] = [
  { era: "old", label: "1995 boards" },
  { era: "both", label: "Both" },
  { era: "modern", label: "Today’s boards" },
];

export function PhotoOverlay({ old, modern }: { old: Rink; modern: Rink }) {
  const id = React.useId();
  const [era, setEra] = React.useState<Era>("both");
  const [dim, setDim] = React.useState(true);
  const oldPath = photoPath(old);
  const modernPath = photoPath(modern);
  const showOld = era !== "modern";
  const showModern = era !== "old";

  return (
    <figure className="exhibit-photo">
      <div className="exhibit-controls">
        <fieldset className="segmented">
          <legend className="sr-only">Outlines on the photograph</legend>
          {CHOICES.map((choice) => (
            <button
              key={choice.era}
              type="button"
              aria-pressed={era === choice.era}
              onClick={() => setEra(choice.era)}
            >
              {choice.label}
            </button>
          ))}
        </fieldset>
        <label className="check">
          <input type="checkbox" checked={dim} onChange={(e) => setDim(e.target.checked)} />
          Dim the photo
        </label>
      </div>
      <div className={`photo-frame${dim ? " is-dim" : ""}`}>
        <img
          src={PARLA_PHOTO.src}
          width={PARLA_PHOTO_FIT.width}
          height={PARLA_PHOTO_FIT.height}
          alt="The Boston Garden rink during a Rangers practice, around 1995, seen from the upper seats near center ice."
          loading="lazy"
          decoding="async"
        />
        <svg
          viewBox={`0 0 ${PARLA_PHOTO_FIT.width} ${PARLA_PHOTO_FIT.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id={`${id}-hatch`}
              width={9}
              height={9}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line className="photo-hatch-line" x1={0} y1={0} x2={0} y2={9} />
            </pattern>
          </defs>
          {showModern && (
            <>
              {showOld && (
                <path d={`${modernPath}${oldPath}`} fillRule="evenodd" fill={`url(#${id}-hatch)`} />
              )}
              <path className="photo-line photo-halo" d={modernPath} />
              <path className="photo-line photo-modern" d={modernPath} />
            </>
          )}
          {showOld && (
            <>
              <path className="photo-line photo-halo" d={oldPath} />
              <path className="photo-line photo-old" d={oldPath} />
            </>
          )}
        </svg>
      </div>
      <figcaption>
        Photo by {PARLA_PHOTO.credit},{" "}
        <a href={PARLA_PHOTO.source} target="_blank" rel="noreferrer">
          Wikimedia Commons
        </a>
        , licensed{" "}
        <a href={PARLA_PHOTO.licenseUrl} target="_blank" rel="noreferrer">
          {PARLA_PHOTO.license}
        </a>
        , shown unmodified. The outlines are fitted to the photo’s perspective from the straight
        sideboards; the old corner curves are an estimate.
      </figcaption>
    </figure>
  );
}
