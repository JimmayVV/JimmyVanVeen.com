import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import react from "eslint-plugin-react"
import jsxA11y from "eslint-plugin-jsx-a11y"
import tseslint from "typescript-eslint"
import prettierPlugin from "eslint-plugin-prettier"
import prettierConfig from "eslint-config-prettier"
import unusedImports from "eslint-plugin-unused-imports"

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
  ...tseslint.configs.recommended,
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
        tsconfigRootDir: import.meta.dirname,
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
            "action",
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

      // React specific
      "react/prop-types": "off", // Using TypeScript
      "react/react-in-jsx-scope": "off", // React 17+ JSX transform
      "react/jsx-uses-react": "off", // React 17+ JSX transform

      // Prettier integration
      "prettier/prettier": "error",
    },
  },
  {
    files: ["app/components/ui/**/*"],
    rules: {
      "react-refresh/only-export-components": "off", // Disable for shadcn/ui components
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
)
