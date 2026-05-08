import * as React from "react";

export function ReadingProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const value = max > 0 ? (window.scrollY / max) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, value)));
    }
    update();
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", update, opts);
    window.addEventListener("resize", update, opts);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="blog-progress" aria-hidden="true">
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}
