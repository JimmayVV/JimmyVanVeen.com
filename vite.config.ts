import { reactRouterDevTools } from "react-router-devtools";

import netlifyReactRouter from "@netlify/vite-plugin-react-router";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";

const ReactCompilerConfig = {
  target: "19",
};

export default defineConfig({
  plugins: [
    babel({
      include: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
    reactRouterDevTools(),
    reactRouter(),
    netlifyReactRouter(),
  ],
  envPrefix: "JVV",
  envDir: "./config/env",
  resolve: {
    // Vite 8 resolves tsconfig `paths` (the `~/*` alias) natively,
    // replacing the vite-tsconfig-paths plugin.
    tsconfigPaths: true,
  },
  ssr: {
    // react-syntax-highlighter and refractor ship CJS dists that
    // require ESM-only deps at runtime, which crashes Node-runtime
    // Netlify Functions. Bundling them into the SSR output sidesteps
    // the require-of-ESM error.
    noExternal: ["react-syntax-highlighter", "refractor"],
  },
});
