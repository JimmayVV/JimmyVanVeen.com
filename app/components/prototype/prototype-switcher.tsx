// PROTOTYPE — throwaway. Floating variant switcher for the home-page track
// prototype (issue #471). Renders only when `?variant=` is present, so a
// stray merge shows nothing to ordinary visitors.
import * as React from "react";
import { useSearchParams } from "react-router";

export interface PrototypeVariant<K extends string> {
  key: K;
  name: string;
}

export function PrototypeSwitcher<K extends string>({
  variants,
  current,
}: {
  variants: readonly PrototypeVariant<K>[];
  current: K;
}) {
  const [, setSearchParams] = useSearchParams();
  const index = variants.findIndex((v) => v.key === current);
  const active = variants[index] ?? variants[0];

  const go = React.useCallback(
    (delta: number) => {
      const next = variants[(index + delta + variants.length) % variants.length];
      if (!next) return;
      setSearchParams(
        (prev) => {
          prev.set("variant", next.key);
          return prev;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [index, variants, setSearchParams],
  );

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go]);

  if (!active) return null;

  return (
    <nav className="proto-switcher" aria-label="Prototype variant switcher">
      <button type="button" onClick={() => go(-1)} aria-label="Previous variant">
        ←
      </button>
      <span>
        <strong>{active.key}</strong> — {active.name}
      </span>
      <button type="button" onClick={() => go(1)} aria-label="Next variant">
        →
      </button>
    </nav>
  );
}
