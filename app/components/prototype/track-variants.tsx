// PROTOTYPE — throwaway. Three track-and-choreography variants for the
// home-page spark, switchable via `?variant=` on the real `/` route
// (issue #471). The #45 PNG is a placeholder motif; the final artwork is
// decided elsewhere. None of this is production code.
import * as React from "react";

import type { PrototypeVariant } from "./prototype-switcher";

export const TRACK_VARIANTS = [
  { key: "A", name: "Rule runner" },
  { key: "B", name: "One long lap" },
  { key: "C", name: "Whisper" },
] as const satisfies readonly PrototypeVariant<string>[];

export type TrackVariant = (typeof TRACK_VARIANTS)[number]["key"];

export function parseTrackVariant(value: string | null): TrackVariant | null {
  for (const v of TRACK_VARIANTS) {
    if (v.key === value) return v.key;
  }
  return null;
}

/** Side-view placeholder: the existing iRacing render. */
function SideCar({ className }: { className?: string }) {
  return (
    <div className={`proto-car${className ? ` ${className}` : ""}`} aria-hidden="true">
      <img src="/images/jimmy_car.png" alt="" width={416} height={175} decoding="async" />
    </div>
  );
}

/** Top-down placeholder: a lap has right-to-left legs, and a side-view car
 *  would drive upside down on them. This is the design consequence the
 *  prototype exists to surface, not a proposal for the final art. */
function TopDownCar() {
  return (
    <svg
      className="proto-topdown"
      viewBox="0 0 64 28"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <rect x="6" y="1" width="9" height="6" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="6" y="21" width="9" height="6" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="44" y="1" width="9" height="6" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="44" y="21" width="9" height="6" rx="1.5" fill="currentColor" stroke="none" />
      <path d="M4 8 H50 Q62 8 62 14 Q62 20 50 20 H4 Q1 20 1 14 Q1 8 4 8 Z" />
      <path d="M22 10 H38 L42 14 L38 18 H22 Z" />
      <path d="M46 10 V18" className="proto-topdown-accent" />
    </svg>
  );
}

/* ── A — Rule runner ─────────────────────────────────────────────────────
   One car per section rule. As a rule scrolls up the viewport the car drives
   its full width, exiting right; the next rule's car enters as that rule
   arrives. Load-in: a fade, then the view() timeline owns it. */
export function RuleRunnerCar() {
  return (
    <div className="proto-rule-track">
      <SideCar className="proto-rule-car" />
    </div>
  );
}

/* ── B — One long lap ────────────────────────────────────────────────────
   A single continuous track: along the first rule, down the right margin,
   back along the second rule, down the left margin, along the footer rule.
   Scroll position is the car's position on the lap. The path is measured
   from the real rules at runtime because their y positions depend on
   content height. */
export function LongLapOverlay({ host }: { host: React.RefObject<HTMLElement | null> }) {
  const [lap, setLap] = React.useState<{ path: string; range: string } | null>(null);

  React.useEffect(() => {
    const el = host.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      const box = el.getBoundingClientRect();
      const rules = Array.from(el.querySelectorAll(".home-section .head, .site-footer")).map(
        (node) => {
          const r = node.getBoundingClientRect();
          const isFooter = node.classList.contains("site-footer");
          // Section heads have their rule on the bottom edge; the footer's
          // rule is its top border.
          return {
            y: (isFooter ? r.top : r.bottom) - box.top,
            x0: r.left - box.left,
            x1: r.right - box.left,
          };
        },
      );
      if (rules.length === 0) return;
      const inset = 10; // keep the vertical legs inside the column
      let d = "";
      rules.forEach((rule, i) => {
        const leftToRight = i % 2 === 0;
        const startX = leftToRight ? rule.x0 : rule.x1 - inset;
        const endX = leftToRight ? rule.x1 - inset : rule.x0 + inset;
        if (i === 0) d += `M ${startX} ${rule.y} `;
        else d += `V ${rule.y} `;
        d += `H ${endX} `;
      });
      // Scroll offsets at which the sections block's top reaches the viewport
      // bottom, and its bottom edge (the footer) reaches the viewport bottom.
      const top = box.top + window.scrollY;
      const start = Math.max(0, top - window.innerHeight);
      const end = Math.max(start + 1, top + box.height - window.innerHeight);
      setLap({ path: d.trim(), range: `${Math.round(start)}px ${Math.round(end)}px` });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [host]);

  if (!lap) return null;

  return (
    <div className="proto-lap" aria-hidden="true">
      <div
        className="proto-lap-car"
        style={{ offsetPath: `path("${lap.path}")`, animationRange: lap.range }}
      >
        <TopDownCar />
      </div>
    </div>
  );
}

/* ── C — Whisper ─────────────────────────────────────────────────────────
   One moment: during load-in a hairline draws itself under the dek and the
   car drives in from the left and parks at its right end. After that it only
   nudges forward a little with the first few hundred pixels of scroll. */
export function WhisperTrack() {
  return (
    <div className="proto-whisper" aria-hidden="true">
      <span className="proto-whisper-rule" />
      <SideCar className="proto-whisper-car" />
    </div>
  );
}
