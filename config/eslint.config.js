import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
// TODO(#282): unpin eslint-plugin-react-hooks from ~7.0.1 once the
// react-hooks/set-state-in-effect rule (added in 7.1.x) is addressed
// in use-mobile.ts and carousel.tsx.
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "build/**/*",
      "dist/**/*",
      "netlify/**/*",
      ".netlify/**/*",
      "node_modules/**/*",
      ".react-router/**/*",
      "**/*.min.js",
      "**/vendor/**/*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: new URL("..", import.meta.url).pathname,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettierPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // React Refresh with exclusions for UI components and React Router exports
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "loader",
            "clientLoader",
            "serverLoader",
            "action",
            "clientAction",
            "serverAction",
            "meta",
            "headers",
            "links",
            "handle",
            "ErrorBoundary",
            "HydrateFallback",
          ],
        },
      ],

      // Unused imports detection
      "no-unused-vars": "off", // Turned off in favor of unused-imports plugin
      "@typescript-eslint/no-unused-vars": "off", // Turned off in favor of unused-imports plugin
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/only-throw-error": "off", // Allow React Router responses
      "@typescript-eslint/strict-boolean-expressions": "off", // Too strict for React conditionals
      "@typescript-eslint/no-unnecessary-condition": "off", // Can be overly aggressive
      "@typescript-eslint/restrict-template-expressions": "off", // Allow number/boolean in templates
      "@typescript-eslint/no-base-to-string": "off", // Allow FormData stringification
      "@typescript-eslint/no-non-null-assertion": "off", // Sometimes needed for type narrowing
      "@typescript-eslint/require-await": "off", // clientLoader/action + provider interfaces are async by contract

      // React specific
      "react/prop-types": "off", // Using TypeScript
      "react/react-in-jsx-scope": "off", // React 17+ JSX transform
      "react/jsx-uses-react": "off", // React 17+ JSX transform

      // Prettier integration
      "prettier/prettier": "error",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Tests legitimately use `any`, casts, and mocks; type-aware rules
    // (no-unsafe-*, etc.) add noise, not safety, here.
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
);
