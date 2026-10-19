import * as React from "react";

import { type Rink, type RinkId, type Unit } from "./geometry";
import type { CameraView, SceneController, ViewerMode } from "./scene.client";

const MODES: { mode: ViewerMode; label: string }[] = [
  { mode: "both", label: "Old inside new" },
  { mode: "split", label: "Side by side" },
  { mode: "old", label: "1995 only" },
  { mode: "modern", label: "Today only" },
];

const VIEWS: { view: CameraView; label: string }[] = [
  { view: "stands", label: "From the stands" },
  { view: "overhead", label: "Overhead" },
  { view: "ice", label: "At ice level" },
];

type Status = "idle" | "loading" | "ready" | "failed";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  // Some WebKit versions ignore a click on a link that isn't in the document.
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function RinkViewer({ old, modern, unit }: { old: Rink; modern: Rink; unit: Unit }) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const sceneRef = React.useRef<SceneController | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [mode, setMode] = React.useState<ViewerMode>("both");
  const [view, setView] = React.useState<CameraView>("stands");
  const [boards, setBoards] = React.useState(true);
  const [dimensions, setDimensions] = React.useState(true);
  const [oldGoals, setOldGoals] = React.useState(true);
  const [modernGoals, setModernGoals] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [failure, setFailure] = React.useState<string | null>(null);

  // The scene loads asynchronously; whatever the visitor chose meanwhile is applied when it's ready.
  const latest = React.useRef({
    state: { old, modern, mode, boards, dimensions, oldGoals, modernGoals, unit },
    view,
  });
  React.useEffect(() => {
    latest.current = {
      state: { old, modern, mode, boards, dimensions, oldGoals, modernGoals, unit },
      view,
    };
  });

  // Three.js is ~600 KB; fetch it only once the viewer is close to the screen.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setStatus("loading");
        import("./scene.client")
          .then(({ createScene }) => {
            if (cancelled) return;
            const scene = createScene(stage, latest.current.state);
            scene.setView(latest.current.view);
            sceneRef.current = scene;
            setStatus("ready");
          })
          .catch((error: unknown) => {
            console.error("Garden Ice 3D failed to start", error);
            if (!cancelled) setStatus("failed");
          });
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(stage);
    return () => {
      cancelled = true;
      observer.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Moving a rink rebuilds its geometry and textures, so wait for a slider to settle.
  React.useEffect(() => {
    const timer = setTimeout(
      () => sceneRef.current?.update({ ...latest.current.state, old, modern, unit }),
      150,
    );
    return () => clearTimeout(timer);
  }, [old, modern, unit]);

  // Showing or hiding parts is cheap; apply it at once.
  React.useEffect(() => {
    sceneRef.current?.update({
      ...latest.current.state,
      mode,
      boards,
      dimensions,
      oldGoals,
      modernGoals,
    });
  }, [mode, boards, dimensions, oldGoals, modernGoals]);

  React.useEffect(() => {
    sceneRef.current?.setView(view);
  }, [view]);

  async function exportModel(id: RinkId) {
    const scene = sceneRef.current;
    if (!scene) return;
    setBusy(id);
    setFailure(null);
    try {
      const blob = await scene.exportModel(id);
      download(blob, id === "old" ? "boston-garden-1995.glb" : "td-garden-2026.glb");
    } catch (error) {
      console.error("Garden Ice model export failed", error);
      setFailure("The model couldn’t be exported in this browser. The image download still works.");
    } finally {
      setBusy(null);
    }
  }

  async function exportImage() {
    const scene = sceneRef.current;
    if (!scene) return;
    setBusy("image");
    setFailure(null);
    try {
      const blob = await scene.exportImage();
      if (!blob) throw new Error("Canvas produced no image");
      download(blob, `garden-ice-${mode}-${view}.png`);
    } catch (error) {
      console.error("Garden Ice image export failed", error);
      setFailure("The view couldn’t be saved as an image in this browser.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="exhibit-viewer">
      <div className="exhibit-controls">
        <fieldset className="segmented">
          <legend className="sr-only">Which rinks to show</legend>
          {MODES.map((item) => (
            <button
              key={item.mode}
              type="button"
              aria-pressed={mode === item.mode}
              onClick={() => setMode(item.mode)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
        <fieldset className="segmented">
          <legend className="sr-only">Where to stand</legend>
          {VIEWS.map((item) => (
            <button
              key={item.view}
              type="button"
              aria-pressed={view === item.view}
              onClick={() => setView(item.view)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
      </div>

      <div className={`viewer-stage is-${status}`} ref={stageRef}>
        {mode === "split" && status === "ready" && (
          <div className="viewer-split-labels" aria-hidden="true">
            <span className="is-old">Boston Garden, 1995</span>
            <span>TD Garden, today</span>
          </div>
        )}
        {status !== "ready" && (
          <p className="viewer-status" aria-live="polite">
            {status === "failed"
              ? "The 3D view needs WebGL, which this browser didn’t provide. The plan above and the photograph below show the same rinks."
              : "Loading the 3D rinks…"}
          </p>
        )}
      </div>

      <div className="exhibit-controls viewer-footer">
        <p className="viewer-hint">
          {view === "overhead"
            ? "Overhead stays fixed. Scroll or pinch to zoom."
            : "Drag to walk around center ice. Scroll or pinch to zoom."}
          {mode === "split" &&
            " Under each rink the other is drawn flat: 1995 in gold, today in slate."}
        </p>
        <label className="check">
          <input type="checkbox" checked={boards} onChange={(e) => setBoards(e.target.checked)} />
          Boards and glass
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={dimensions}
            onChange={(e) => setDimensions(e.target.checked)}
          />
          Dimensions
        </label>
        {mode !== "modern" && (
          <label className="check">
            <input
              type="checkbox"
              checked={oldGoals}
              onChange={(e) => setOldGoals(e.target.checked)}
            />
            1995 goals
          </label>
        )}
        {mode !== "old" && (
          <label className="check">
            <input
              type="checkbox"
              checked={modernGoals}
              onChange={(e) => setModernGoals(e.target.checked)}
            />
            Today’s goals
          </label>
        )}
      </div>

      <div className="viewer-downloads">
        <fieldset>
          <legend>Download</legend>
          <button
            type="button"
            disabled={status !== "ready" || busy !== null}
            onClick={() => exportImage()}
          >
            {busy === "image" ? "Saving…" : "This view (PNG)"}
          </button>
          <button
            type="button"
            disabled={status !== "ready" || busy !== null}
            onClick={() => exportModel("old")}
          >
            {busy === "old" ? "Exporting…" : "Boston Garden model (GLB)"}
          </button>
          <button
            type="button"
            disabled={status !== "ready" || busy !== null}
            onClick={() => exportModel("modern")}
          >
            {busy === "modern" ? "Exporting…" : "TD Garden model (GLB)"}
          </button>
        </fieldset>
        <p className="viewer-failure" aria-live="polite">
          {failure}
        </p>
      </div>
    </div>
  );
}
