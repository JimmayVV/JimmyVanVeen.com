// PROTOTYPE — throwaway. Mounts the ink-dot scene after hydration
// (issue #482). Renders a poster in the SSR HTML; on the client, once
// hydrated and idle, dynamically imports the three.js scene and fades the
// poster out after the first rendered frame. Visitors with reduced motion,
// Save-Data, or no WebGL2 keep the poster and never download three.
import * as React from "react";

import type { InkVariant } from "./ink-variants";

function subscribeNever() {
  return () => {};
}

/** True only after hydration; false during SSR and the hydrating render. */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

function prefersPoster(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const nav: Navigator = navigator;
  if ("connection" in nav) {
    const c: unknown = nav.connection;
    if (typeof c === "object" && c !== null && "saveData" in c && c.saveData === true) return true;
  }
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  return gl === null;
}

/** Run `cb` when the browser is idle; Safari ships requestIdleCallback
 *  disabled by default, so fall back to a short timeout + rAF. */
function scheduleIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const t = window.setTimeout(() => window.requestAnimationFrame(cb), 300);
  return () => window.clearTimeout(t);
}

export function InkSceneMount({ variant }: { variant: InkVariant }) {
  const hydrated = useHydrated();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (prefersPoster()) return;

    let disposed = false;
    let dispose: (() => void) | undefined;
    const cancelIdle = scheduleIdle(() => {
      if (disposed) return;
      import("./ink-scene")
        .then((mod) => {
          if (disposed) return;
          dispose = mod.mountInkScene(canvas, {
            variant,
            onFirstFrame: () => setReady(true),
          });
        })
        .catch((error: unknown) => {
          console.warn("ink scene: failed to load renderer", error);
        });
    });

    return () => {
      disposed = true;
      cancelIdle();
      dispose?.();
    };
  }, [hydrated, variant]);

  return (
    <>
      <canvas ref={canvasRef} className="ink-canvas" aria-hidden="true" />
      {/* Poster: stands in for the scene before first frame and for
          visitors who never get one. Placeholder image for the prototype. */}
      <div className={`ink-poster${ready ? " is-hidden" : ""}`} aria-hidden="true">
        <img src="/images/jimmy_car.png" alt="" width={416} height={175} decoding="async" />
      </div>
    </>
  );
}
