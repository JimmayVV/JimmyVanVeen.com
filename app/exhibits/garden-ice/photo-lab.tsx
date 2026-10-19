import * as React from "react";

import {
  OLD_GARDEN,
  type Point,
  type Rink,
  type RinkId,
  TD_GARDEN,
  arcPoints,
  creaseOutline,
  netBase,
  perimeter,
} from "./geometry";
import {
  type Homography,
  LANDMARK_LABELS,
  landmarkPoint,
  project,
  projectedPath,
  solveHomography,
} from "./homography";
import { type Anchor, REFERENCE_PHOTOS, type ReferencePhoto, defaultAnchors } from "./photos";

type Anchors = ReferencePhoto["anchors"];

/** The visitor's own photo, decoded in the browser. It never becomes a URL. */
interface Upload {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  arena: RinkId;
}

/** Every line of a rink that the overlay draws, in rink feet. */
export function rinkFeatures(rink: Rink) {
  const halfL = rink.length / 2;
  const halfW = rink.width / 2;
  const goalX = halfL - rink.goal;
  const cornerStart = halfL - rink.corner;
  const goalZ =
    halfW - rink.corner + Math.sqrt(Math.max(0, rink.corner ** 2 - (goalX - cornerStart) ** 2));
  const sides = [-1, 1] as const;
  const circles: Point[][] = [arcPoints(0, 0, 15, 0, 360, 48)];
  const dots: Point[] = [[0, 0]];
  for (const s of sides) {
    for (const z of [-22, 22]) {
      circles.push(arcPoints(s * (goalX - 20), z, 15, 0, 360, 48));
      dots.push([s * (goalX - 20), z], [s * (rink.blue - 5), z]);
    }
  }
  return {
    boards: perimeter(rink, 32),
    redLine: [
      [0, -halfW],
      [0, halfW],
    ] satisfies Point[],
    blueLines: sides.map((s): Point[] => [
      [s * rink.blue, -halfW],
      [s * rink.blue, halfW],
    ]),
    goalLines: sides.map((s): Point[] => [
      [s * goalX, -goalZ],
      [s * goalX, goalZ],
    ]),
    circles,
    dots,
    creases: sides.map((s) => ({ id: s === 1 ? "right" : "left", points: creaseOutline(rink, s) })),
    nets: sides.map((s) => netBase(rink).map(([x, z]): Point => [s * (goalX + x), z])),
  };
}

function RinkLayer({ rink, h, strength }: { rink: Rink; h: Homography; strength: number }) {
  const f = rinkFeatures(rink);
  const boards = projectedPath(h, f.boards, true);
  const line = (points: Point[], key: string, className: string) => (
    <path key={key} className={className} d={projectedPath(h, points, false)} />
  );
  return (
    <g className={`lab-rink lab-rink-${rink.id}`} style={{ opacity: strength / 100 }}>
      <path className="lab-ice" d={boards} />
      {line(f.redLine, "red", "lab-line")}
      {f.blueLines.map((l, i) => line(l, `blue${i}`, "lab-line lab-line-heavy"))}
      {f.goalLines.map((l, i) => line(l, `goal${i}`, "lab-line"))}
      {f.circles.map((c, i) => line(c, `circle${i}`, "lab-line"))}
      {f.creases.map((c) => (
        <path key={`crease-${c.id}`} className="lab-line" d={projectedPath(h, c.points, true)} />
      ))}
      {f.nets.map((n, i) => line(n, `net${i}`, "lab-line"))}
      {f.dots.map((dot) => {
        const p = project(h, dot);
        return p ? <circle key={dot.join()} className="lab-dot" cx={p[0]} cy={p[1]} r={3} /> : null;
      })}
      <path className="lab-halo" d={boards} />
      <path className="lab-boards" d={boards} />
    </g>
  );
}

/** Larger than any phone photo; past this, decoding stalls the page with no feedback. */
export const MAX_UPLOAD_MB = 40;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PhotoLab({ old, modern }: { old: Rink; modern: Rink }) {
  const id = React.useId();
  const first = REFERENCE_PHOTOS[0];
  const [photoId, setPhotoId] = React.useState(first?.id ?? "");
  const [upload, setUpload] = React.useState<Upload | null>(null);
  const [anchorsById, setAnchorsById] = React.useState<Record<string, Anchors>>({});
  const [oldStrength, setOldStrength] = React.useState(100);
  const [modernStrength, setModernStrength] = React.useState(100);
  const [dim, setDim] = React.useState(true);
  const [adjusting, setAdjusting] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dragging = React.useRef<number | null>(null);

  const preset = REFERENCE_PHOTOS.find((p) => p.id === photoId);
  const showingUpload = photoId === "upload" && upload !== null;
  const photo = showingUpload
    ? { width: upload.width, height: upload.height, arena: upload.arena }
    : preset;

  // Paint the visitor's photo onto the canvas; free it when it's replaced or the page goes away.
  const bitmap = upload?.bitmap;
  React.useEffect(() => {
    if (showingUpload && bitmap) canvasRef.current?.getContext("2d")?.drawImage(bitmap, 0, 0);
  }, [showingUpload, bitmap]);
  React.useEffect(() => () => bitmap?.close(), [bitmap]);

  if (!photo) return null;

  const startingAnchors = showingUpload
    ? defaultAnchors(photo.width, photo.height)
    : (preset?.anchors ?? defaultAnchors(photo.width, photo.height));
  const anchors = anchorsById[photoId] ?? startingAnchors;
  const fitted = anchorsById[photoId] !== undefined;
  // The landmarks belong to whichever building is in the photo, at its documented size.
  const photoRink = photo.arena === "old" ? OLD_GARDEN : TD_GARDEN;
  const h = solveHomography(
    anchors.map((a) => landmarkPoint(photoRink, a.landmark)),
    anchors.map((a) => a.at),
  );

  function setAnchor(index: number, at: Point) {
    const next = anchors.map((a, i): Anchor => (i === index ? { ...a, at } : a));
    const [a0, a1, a2, a3] = next;
    if (a0 && a1 && a2 && a3) setAnchorsById((all) => ({ ...all, [photoId]: [a0, a1, a2, a3] }));
  }

  function toPhotoPixels(clientX: number, clientY: number): Point | null {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || !photo) return null;
    return [
      clamp(((clientX - rect.left) / rect.width) * photo.width, 0, photo.width),
      clamp(((clientY - rect.top) / rect.height) * photo.height, 0, photo.height),
    ];
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError(`“${file.name}” isn’t an image. Choose a JPEG, PNG or WebP photo.`);
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(
        `“${file.name}” is over ${MAX_UPLOAD_MB} MB. Choose a smaller copy, such as one exported for the web.`,
      );
      return;
    }
    createImageBitmap(file)
      .then((decoded) => {
        setUpload((previous) => ({
          bitmap: decoded,
          width: decoded.width,
          height: decoded.height,
          arena: previous?.arena ?? "modern",
        }));
        setAnchorsById(({ upload: _discard, ...rest }) => rest);
        setPhotoId("upload");
        setAdjusting(true);
      })
      .catch(() => {
        setUploadError(`“${file.name}” couldn’t be read as an image. Try another photo.`);
      });
  }

  const both = oldStrength > 0 && modernStrength > 0;

  return (
    <figure className="exhibit-photo">
      <fieldset className="lab-picker">
        <legend className="sr-only">Reference photo</legend>
        <div className="lab-picker-strip">
          {REFERENCE_PHOTOS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={photoId === p.id}
              onClick={() => {
                setPhotoId(p.id);
                setAdjusting(false);
              }}
            >
              <img
                src={p.thumb}
                alt=""
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
              />
              <span>{p.label}</span>
            </button>
          ))}
          <label className={`lab-upload${photoId === "upload" ? " is-active" : ""}`}>
            <input type="file" accept="image/*" onChange={onFile} />
            <span>{upload ? "Your photo (choose another)" : "Use your own photo"}</span>
          </label>
        </div>
        {uploadError && (
          <p className="lab-upload-error" role="alert">
            {uploadError}
          </p>
        )}
        {upload && photoId !== "upload" && (
          <button type="button" className="lab-upload-return" onClick={() => setPhotoId("upload")}>
            Back to your photo
          </button>
        )}
      </fieldset>

      <div
        ref={frameRef}
        className={`photo-frame${dim ? " is-dim" : ""}${adjusting ? " is-adjusting" : ""}`}
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        {showingUpload ? (
          <canvas
            ref={canvasRef}
            width={photo.width}
            height={photo.height}
            aria-label="Your photo"
          />
        ) : (
          <img
            src={preset?.src}
            width={photo.width}
            height={photo.height}
            alt={preset?.alt ?? ""}
            decoding="async"
          />
        )}
        {h && (
          <svg
            viewBox={`0 0 ${photo.width} ${photo.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={`${id}-hatch`}
                width={10}
                height={10}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line className="photo-hatch-line" x1={0} y1={0} x2={0} y2={10} />
              </pattern>
            </defs>
            {both && (
              <path
                d={`${projectedPath(h, perimeter(modern, 32), true)}${projectedPath(h, perimeter(old, 32), true)}`}
                fillRule="evenodd"
                fill={`url(#${id}-hatch)`}
                style={{ opacity: Math.min(oldStrength, modernStrength) / 100 }}
              />
            )}
            {modernStrength > 0 && <RinkLayer rink={modern} h={h} strength={modernStrength} />}
            {oldStrength > 0 && <RinkLayer rink={old} h={h} strength={oldStrength} />}
          </svg>
        )}
        {adjusting &&
          anchors.map((anchor, index) => (
            <button
              key={anchor.landmark}
              type="button"
              className="lab-handle"
              style={{
                left: `${(anchor.at[0] / photo.width) * 100}%`,
                top: `${(anchor.at[1] / photo.height) * 100}%`,
              }}
              aria-label={`${LANDMARK_LABELS[anchor.landmark]}. Drag, or use the arrow keys, to place it on the photo.`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                dragging.current = index;
              }}
              onPointerMove={(e) => {
                if (dragging.current !== index) return;
                const at = toPhotoPixels(e.clientX, e.clientY);
                if (at) setAnchor(index, at);
              }}
              onPointerUp={() => {
                dragging.current = null;
              }}
              onKeyDown={(e) => {
                const step = (e.shiftKey ? 10 : 1) * (photo.width / 600);
                const moves: Record<string, Point> = {
                  ArrowLeft: [-step, 0],
                  ArrowRight: [step, 0],
                  ArrowUp: [0, -step],
                  ArrowDown: [0, step],
                };
                const move = moves[e.key];
                if (!move) return;
                e.preventDefault();
                setAnchor(index, [
                  clamp(anchor.at[0] + move[0], 0, photo.width),
                  clamp(anchor.at[1] + move[1], 0, photo.height),
                ]);
              }}
            >
              <span>{LANDMARK_LABELS[anchor.landmark]}</span>
            </button>
          ))}
      </div>

      <div className="lab-controls">
        <label className="lab-strength lab-strength-old">
          <span>Boston Garden, 1995</span>
          <output>{oldStrength}%</output>
          <input
            type="range"
            min={0}
            max={100}
            value={oldStrength}
            onChange={(e) => setOldStrength(Number(e.target.value))}
          />
        </label>
        <label className="lab-strength">
          <span>TD Garden, today</span>
          <output>{modernStrength}%</output>
          <input
            type="range"
            min={0}
            max={100}
            value={modernStrength}
            onChange={(e) => setModernStrength(Number(e.target.value))}
          />
        </label>
        <div className="lab-toggles">
          <label className="check">
            <input type="checkbox" checked={dim} onChange={(e) => setDim(e.target.checked)} />
            Dim the photo
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={adjusting}
              onChange={(e) => setAdjusting(e.target.checked)}
            />
            Adjust the fit
          </label>
          <button
            type="button"
            className="assumptions-reset"
            disabled={!fitted}
            onClick={() => setAnchorsById(({ [photoId]: _discard, ...rest }) => rest)}
          >
            Reset the fit
          </button>
        </div>
        {showingUpload && (
          <fieldset className="segmented">
            <legend>This photo shows</legend>
            {(["old", "modern"] as const).map((arena) => (
              <button
                key={arena}
                type="button"
                aria-pressed={upload.arena === arena}
                onClick={() => setUpload({ ...upload, arena })}
              >
                {arena === "old" ? "Boston Garden" : "TD Garden"}
              </button>
            ))}
          </fieldset>
        )}
      </div>

      <figcaption>
        {adjusting ? (
          <p>
            Drag each dot to where that line meets the boards in the photo; the rinks redraw as you
            go. Only the ice is drawn, so the near boards can hide the edge closest to the camera.
          </p>
        ) : (
          <p>
            {showingUpload
              ? "Your photo stays in this browser; it isn’t uploaded anywhere."
              : preset?.lookFor}
          </p>
        )}
        {!showingUpload && preset && (
          <p className="lab-credit">
            Photo by {preset.credit.author}, {preset.credit.year},{" "}
            <a href={preset.credit.source} target="_blank" rel="noreferrer">
              {preset.credit.site}
            </a>
            {preset.credit.license === "Public domain" ? (
              ", in the public domain"
            ) : preset.credit.licenseUrl ? (
              <>
                , licensed{" "}
                <a href={preset.credit.licenseUrl} target="_blank" rel="noreferrer">
                  {preset.credit.license}
                </a>
              </>
            ) : (
              ", used with the photographer’s permission"
            )}
            , shown unmodified. The rinks are drawn on a separate layer.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
