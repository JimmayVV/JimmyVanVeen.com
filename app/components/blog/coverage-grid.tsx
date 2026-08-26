import * as React from "react";

/**
 * Renders a ```coverage fenced block as a proportion you can see: one mark per
 * item, filled marks for the covered share.
 *
 * Contentful stores post bodies as plain markdown, and the site renders them
 * with react-markdown without rehype-raw, so raw HTML in a post body is
 * stripped. A fenced block is therefore the only way a post can ask for a
 * custom figure, and it has the happy side effect of keeping the body readable
 * as text.
 *
 *     ```coverage
 *     total: 262
 *     stored: 45
 *     label: corpus coverage after 29 days
 *     storedLabel: in the shared store
 *     emptyLabel: local only, never sent
 *     ```
 *
 * `total` and `stored` are required. `label` titles the figure; `storedLabel`
 * and `emptyLabel` name the two states in the legend and in the screen-reader
 * description, and all three fall back to generic wording.
 */

export type CoverageSpec = {
  total: number;
  stored: number;
  label: string;
  storedLabel: string;
  emptyLabel: string;
};

const DEFAULTS: CoverageSpec = {
  total: 0,
  stored: 0,
  label: "covered",
  storedLabel: "covered",
  emptyLabel: "not covered",
};

/**
 * Above this many items the grid stops being legible and starts being a
 * rendering cost: every mark is an element carrying its own inline animation
 * delay. Post bodies are editor-authored rather than hostile, so this exists to
 * survive a typo (`total: 100000`), not an attack.
 */
export const MAX_MARKS = 1000;

/** `key: value` per line. Unknown keys are ignored rather than throwing. */
export function parseCoverage(source: string): CoverageSpec {
  const spec: CoverageSpec = { ...DEFAULTS };
  for (const line of source.split("\n")) {
    const match = /^\s*([a-zA-Z]+)\s*:\s*(.+?)\s*$/.exec(line);
    const rawKey = match?.[1];
    const value = match?.[2];
    if (rawKey === undefined || value === undefined) continue;
    const key = rawKey.toLowerCase();
    if (key === "total" || key === "stored") {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n) && n >= 0) spec[key] = n;
    } else if (key === "label") {
      spec.label = value;
    } else if (key === "storedlabel") {
      spec.storedLabel = value;
    } else if (key === "emptylabel") {
      spec.emptyLabel = value;
    }
  }
  spec.stored = Math.min(spec.stored, spec.total);
  return spec;
}

/**
 * Which marks are filled is decided by a seeded shuffle rather than filling from
 * the left. A contiguous block would read as "the first 45", and the real claim
 * is that the covered items were scattered arbitrarily through the set.
 *
 * Math.imul, not `*`: the state is masked to 0x7fffffff, so a plain multiply by
 * 1103515245 produces roughly 2.3e18, about 250x past Number.MAX_SAFE_INTEGER.
 * The low bits are gone before the mask ever runs, which stays deterministic but
 * is not the generator this claims to be. imul does the multiply in true 32-bit.
 */
export function scatter(total: number, stored: number, seed = 20260728): boolean[] {
  const order = Array.from({ length: total }, (_, i) => i);
  let state = seed;
  const next = () => {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const a = order[i];
    const b = order[j];
    if (a === undefined || b === undefined) continue;
    order[i] = b;
    order[j] = a;
  }
  const filled: boolean[] = Array.from({ length: total }, () => false);
  for (let i = 0; i < stored; i += 1) {
    const index = order[i];
    if (index !== undefined) filled[index] = true;
  }
  return filled;
}

export type Mark = { id: string; on: boolean };

/**
 * The marks to draw, or null when there are too many to draw usefully. Callers
 * keep the figure and its numbers either way; only the grid goes away, because a
 * proportional sample of a mistyped total would report a ratio nobody meant.
 */
export function marksFor(total: number, stored: number): Mark[] | null {
  if (total <= 0 || total > MAX_MARKS) return null;
  return scatter(total, stored).map((on, i) => ({ id: `mark-${i}`, on }));
}

export function CoverageGrid({ source }: { source: string }) {
  const spec = React.useMemo(() => parseCoverage(source), [source]);
  const marks = React.useMemo(() => marksFor(spec.total, spec.stored), [spec.total, spec.stored]);

  if (spec.total <= 0) return null;

  const remainder = spec.total - spec.stored;
  const description = marks
    ? `A grid of ${spec.total} marks. ${spec.stored} are filled to show ${spec.storedLabel}; the remaining ${remainder} are empty.`
    : `${spec.stored} of ${spec.total} ${spec.storedLabel}; the remaining ${remainder} ${spec.emptyLabel}.`;

  return (
    <figure className="not-prose my-10 rounded border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
      <figcaption className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="font-mono text-[0.66rem] font-semibold tracking-[0.15em] text-neutral-500 uppercase dark:text-neutral-400">
          {spec.label}
        </span>
        <span className="font-serif text-2xl tabular-nums text-neutral-900 dark:text-neutral-100">
          <span className="font-medium text-teal-700 dark:text-teal-300">{spec.stored}</span>
          {" / "}
          {spec.total}
        </span>
        <span className="sr-only">{description}</span>
      </figcaption>

      {marks ? (
        <div
          aria-hidden="true"
          className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(9px,1fr))] gap-1"
        >
          {marks.map((mark, i) => (
            <span
              key={mark.id}
              style={{ animationDelay: `${i * 2.4}ms` }}
              className={[
                "block aspect-square rounded-[1.5px] border",
                "motion-safe:animate-[blogCoverageMark_0.34s_ease-out_forwards] motion-safe:opacity-0",
                mark.on
                  ? "border-teal-700 bg-teal-700 dark:border-teal-400 dark:bg-teal-400"
                  : "border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.7rem] text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-[9px] rounded-[1.5px] bg-teal-700 dark:bg-teal-400" />
          {spec.storedLabel} {spec.stored}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-[9px] rounded-[1.5px] border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
          {spec.emptyLabel} {remainder}
        </span>
      </div>
    </figure>
  );
}
