import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
// import netlifyPlugin from "@netlify/vite-plugin-react-router"
import { reactRouterDevTools } from "react-router-devtools"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouterDevTools(),
    reactRouter(),
    tsconfigPaths(),
    // netlifyPlugin(),
  ],
  envPrefix: "JVV",
})
