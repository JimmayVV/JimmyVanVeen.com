import * as React from "react";

export function ReadingProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frameId = 0;

    function compute() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const value = max > 0 ? (window.scrollY / max) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, value)));
    }

    function schedule() {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(compute);
    }

    compute();
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", schedule, opts);
    window.addEventListener("resize", schedule, opts);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", schedule, opts);
      window.removeEventListener("resize", schedule, opts);
    };
  }, []);

  return (
    <div className="blog-progress" aria-hidden="true">
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}
