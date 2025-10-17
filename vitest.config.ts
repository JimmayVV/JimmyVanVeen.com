import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use happy-dom for DOM simulation
    environment: "happy-dom",

    // Global test utilities
    globals: true,

    // Setup files to run before tests
    setupFiles: ["./config/test/setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "build/**",
        "dist/**",
        "**/*.config.ts",
        "**/*.config.js",
        "config/**",
        "server/**",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
    },

    // Include test files
    include: ["app/**/*.test.{ts,tsx}"],

    // Timeout for tests
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
});
