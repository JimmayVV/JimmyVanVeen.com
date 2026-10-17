import * as React from "react";

import {
  type Point,
  type Rink,
  type Unit,
  cornerArcs,
  formatLength,
  lerpRink,
  netBase,
  perimeter,
} from "./geometry";

export type Era = "old" | "both" | "modern";

const ERA_TITLES: Record<Era, string> = {
  old: "Boston Garden ice, 1994–95",
  both: "Boston Garden ice drawn inside TD Garden ice, centered on the red line",
  modern: "TD Garden ice, current NHL dimensions",
};

/** Corners in perimeter order, and the straight boards that run from each one to the next. */
const CORNERS = ["northeast", "northwest", "southwest", "southeast"] as const;
const SIDES = ["north", "west", "south", "east"] as const;

function toPath(points: readonly Point[], close = true): string {
  const d = points.map(([x, z], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${z.toFixed(2)}`).join("");
  return close ? `${d}Z` : d;
}

/** Points along a circle around (cx, cz), from angle `from` to `to` in degrees. */
function arc(cx: number, cz: number, r: number, from: number, to: number, steps = 16): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return [cx + r * Math.cos(t), cz + r * Math.sin(t)] as const;
  });
}

/** Regulation markings for one rink. Callers clip them to the boards. */
function Markings({ rink }: { rink: Rink }) {
  const half = rink.length / 2;
  const sides = [-1, 1] as const;
  return (
    <g className="rink-markings">
      <rect className="rink-red-fill" x={-0.5} y={-60} width={1} height={120} />
      {sides.map((s) => {
        const goal = s * (half - rink.goal);
        const dotX = goal - s * 20;
        const creaseAngle = (Math.asin(4 / 6) * 180) / Math.PI;
        const crease =
          rink.id === "old"
            ? arc(goal, 0, 6, s === 1 ? 90 : -90, s === 1 ? 270 : 90)
            : [
                [goal, -4] as const,
                ...arc(
                  goal,
                  0,
                  6,
                  s === 1 ? 180 + creaseAngle : -creaseAngle,
                  s === 1 ? 180 - creaseAngle : creaseAngle,
                ),
                [goal, 4] as const,
              ];
        return (
          <g key={s}>
            <rect
              className="rink-blue-fill"
              x={s * rink.blue - 0.5}
              y={-60}
              width={1}
              height={120}
            />
            <line className="rink-red-thin" x1={goal} x2={goal} y1={-60} y2={60} />
            <path className="rink-crease" d={toPath(crease)} />
            <path
              className="rink-net"
              d={toPath(
                netBase(rink).map(([x, z]): Point => [goal + s * x, z]),
                false,
              )}
            />
            {rink.id === "modern" &&
              sides.map((z) => (
                <line
                  key={z}
                  className="rink-red-thin"
                  x1={goal}
                  y1={z * 11}
                  x2={s * half}
                  y2={z * 14}
                />
              ))}
            {sides.map((z) => (
              <g key={z}>
                <circle className="rink-red-thin" cx={dotX} cy={z * 22} r={15} />
                <circle className="rink-red-dot" cx={dotX} cy={z * 22} r={1} />
                <circle className="rink-red-dot" cx={s * (rink.blue - 5)} cy={z * 22} r={1} />
              </g>
            ))}
          </g>
        );
      })}
      <circle className="rink-blue-thin" cx={0} cy={0} r={15} />
      <circle className="rink-blue-dot" cx={0} cy={0} r={0.5} />
    </g>
  );
}

function Dimension({
  from,
  to,
  at,
  label,
  axis,
  side,
  tone,
}: {
  from: number;
  to: number;
  at: number;
  label: string;
  axis: "x" | "z";
  /** Which side of the line the label sits on. */
  side: -1 | 1;
  tone: "modern" | "old";
}) {
  const tick = 1.6;
  const mid = (from + to) / 2;
  const offset = side * 2.4;
  if (axis === "x") {
    return (
      <g className={`rink-dim rink-dim-${tone}`}>
        <line x1={from} x2={to} y1={at} y2={at} />
        <line x1={from} x2={from} y1={at - tick} y2={at + tick} />
        <line x1={to} x2={to} y1={at - tick} y2={at + tick} />
        <text x={mid} y={at + offset} dominantBaseline={side === -1 ? "auto" : "hanging"}>
          {label}
        </text>
      </g>
    );
  }
  return (
    <g className={`rink-dim rink-dim-${tone}`}>
      <line x1={at} x2={at} y1={from} y2={to} />
      <line x1={at - tick} x2={at + tick} y1={from} y2={from} />
      <line x1={at - tick} x2={at + tick} y1={to} y2={to} />
      <text
        x={at + offset}
        y={mid}
        transform={`rotate(${side === 1 ? 90 : -90} ${at + offset} ${mid})`}
        dominantBaseline="auto"
      >
        {label}
      </text>
    </g>
  );
}

function useEraTween(era: Era): number {
  const target = era === "old" ? 0 : 1;
  const [t, setT] = React.useState(target);
  const current = React.useRef(target);

  React.useEffect(() => {
    const start = current.current;
    if (start === target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 900;
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - began) / duration);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
      current.current = start + (target - start) * eased;
      setT(current.current);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return t;
}

export function RinkPlan({
  old,
  modern,
  era,
  unit,
  labels = true,
  className,
}: {
  old: Rink;
  modern: Rink;
  era: Era;
  unit: Unit;
  /** Dimension lines and their numbers. Off for thumbnails. */
  labels?: boolean;
  className?: string;
}) {
  const id = React.useId();
  const t = useEraTween(era);
  const shown = lerpRink(old, modern, t);
  const both = era === "both";
  const shownPath = toPath(perimeter(shown));
  const oldPath = toPath(perimeter(old));
  const oldCorners = cornerArcs(old).map((points, i) => ({ id: CORNERS[i] ?? "", points }));
  const oldStraights = oldCorners.map((corner, i) => {
    const next = oldCorners[(i + 1) % oldCorners.length];
    const points = [corner.points[corner.points.length - 1], next?.points[0]];
    return { id: SIDES[i] ?? "", points: points.filter((p): p is Point => p !== undefined) };
  });
  const halfL = shown.length / 2;
  const halfW = shown.width / 2;

  return (
    <svg
      className={`rink-plan${both ? " is-both" : ""}${t < 0.5 ? " is-old" : ""}${className ? ` ${className}` : ""}`}
      viewBox="-120 -66 240 132"
      aria-labelledby={`${id}-title`}
    >
      <title id={`${id}-title`}>{ERA_TITLES[era]}</title>
      <defs>
        <clipPath id={`${id}-ice`}>
          <path d={shownPath} />
        </clipPath>
        <clipPath id={`${id}-old-ice`}>
          <path d={oldPath} />
        </clipPath>
        <pattern
          id={`${id}-hatch`}
          width={2.2}
          height={2.2}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line className="rink-hatch-line" x1={0} y1={0} x2={0} y2={2.2} />
        </pattern>
      </defs>

      <path className="rink-ice" d={shownPath} />
      <g clipPath={`url(#${id}-ice)`}>
        <Markings rink={shown} />
      </g>

      <g className="rink-then" aria-hidden={!both}>
        <path
          className="rink-extra"
          d={`${shownPath}${oldPath}`}
          fillRule="evenodd"
          fill={`url(#${id}-hatch)`}
        />
        <g clipPath={`url(#${id}-old-ice)`} className="rink-old-lines">
          {([-1, 1] as const).map((s) => (
            <g key={s}>
              <line
                x1={s * (old.length / 2 - old.goal)}
                x2={s * (old.length / 2 - old.goal)}
                y1={-60}
                y2={60}
              />
              <line x1={s * old.blue} x2={s * old.blue} y1={-60} y2={60} />
            </g>
          ))}
        </g>
        {/* Straight boards are documented; the corner curves are a placeholder, so they're dashed. */}
        {oldStraights.map((side) => (
          <path key={side.id} className="rink-old-board" d={toPath(side.points, false)} />
        ))}
        {oldCorners.map((corner) => (
          <path key={corner.id} className="rink-old-corner" d={toPath(corner.points, false)} />
        ))}
      </g>

      <path className="rink-board" d={shownPath} />

      {labels && (
        <g className="rink-dims">
          <Dimension
            axis="x"
            from={-halfL}
            to={halfL}
            at={-halfW - 9}
            side={-1}
            label={formatLength(shown.length, unit)}
            tone={t < 0.5 ? "old" : "modern"}
          />
          <Dimension
            axis="z"
            from={-halfW}
            to={halfW}
            at={halfL + 8}
            side={1}
            label={formatLength(shown.width, unit)}
            tone={t < 0.5 ? "old" : "modern"}
          />
          {both && (
            <>
              <Dimension
                axis="x"
                from={-old.length / 2}
                to={old.length / 2}
                at={halfW + 9}
                side={1}
                label={formatLength(old.length, unit)}
                tone="old"
              />
              <Dimension
                axis="z"
                from={-old.width / 2}
                to={old.width / 2}
                at={-halfL - 8}
                side={-1}
                label={formatLength(old.width, unit)}
                tone="old"
              />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
