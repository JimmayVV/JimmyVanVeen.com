import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import netlifyPlugin from "@netlify/vite-plugin-react-router"
import { reactRouterDevTools } from "react-router-devtools"
import tailwindcss from "@tailwindcss/vite"
import babel from "vite-plugin-babel"

const ReactCompilerConfig = {
  target: "19",
}

export default defineConfig({
  plugins: [
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          ["babel-plugin-react-compiler", ReactCompilerConfig],
        ],
      },
    }),
    tailwindcss(),
    reactRouterDevTools(),
    reactRouter(),
    tsconfigPaths(),
    netlifyPlugin(),
  ],
  envPrefix: "JVV",
})
