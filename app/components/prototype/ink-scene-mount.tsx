// PROTOTYPE — throwaway. Mounts the ink-dot scene after hydration
// (issue #482). Nothing is shown before the scene: the page is paper until
// the dots scatter in, which is the interstitial. Reduced motion gets a
// single still frame of the assembled car. Save-Data and no-WebGL2 get
// paper and never download three.
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

function sceneBlocked(): boolean {
  const nav: Navigator = navigator;
  if ("connection" in nav) {
    const c: unknown = nav.connection;
    if (typeof c === "object" && c !== null && "saveData" in c && c.saveData === true) return true;
  }
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  return gl === null;
}

export function InkSceneMount({ variant }: { variant: InkVariant }) {
  const hydrated = useHydrated();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!hydrated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (sceneBlocked()) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Hydration is after first paint by definition, so start now: the
    // sooner the ink arrives, the shorter the blank.
    let disposed = false;
    let dispose: (() => void) | undefined;
    import("./ink-scene")
      .then((mod) => {
        if (disposed) return;
        dispose = mod.mountInkScene(canvas, { variant, reducedMotion });
      })
      .catch((error: unknown) => {
        console.warn("ink scene: failed to load renderer", error);
      });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, [hydrated, variant]);

  return <canvas ref={canvasRef} className="ink-canvas" aria-hidden="true" />;
}
