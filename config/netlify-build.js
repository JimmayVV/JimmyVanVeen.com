import * as fsp from "node:fs/promises";

await fsp.rm(".netlify/functions-internal", { recursive: true }).catch(() => {
  // Ignore error if directory doesn't exist
});
await fsp.mkdir(".netlify/functions-internal", { recursive: true });
await fsp.cp("build/server/", ".netlify/functions-internal/handler", {
  recursive: true,
});

// .netlify/functions-internal
