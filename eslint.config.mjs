import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules",
    ".next",
    "logs",
    "storage",
    ".cursor",
    "build",
    "dist",
    "out",
    ".scannerwork",
    "docs",
    ".git",
    ".kiro",
    ".vscode",
    ".devcontainer",
    ".github",
    ".ai",
    // File patterns
    "**/*.d.ts",
    "next-env.d.ts",
    "eslint.config.ts",
    "debug-eslint.js",
    "bun.lock",
    "*.lock",
    "*.log",
    "draft/**",
    "frontend/graphql/generated/**",
  ]),
  eslint.configs.recommended,
  sonarjs.configs.recommended,
  cspellESLintPluginRecommended,

  // TypeScript and React-specific configuration
  ...tseslint.configs.strictTypeChecked.map(config => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),

  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      // ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // React rules
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // TypeScript rules
      // Note: you must disable the base rule as it can report incorrect errors
      "no-throw-literal": "off",
      "@typescript-eslint/only-throw-error": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-namespace": "off",

      /**
       * Bans the `!` (non-null assertion) operator.
       * This is the #1 source of your runtime null errors.
       */
      "@typescript-eslint/no-non-null-assertion": "error",

      /**
       * Bans the `any` keyword, forcing you to use the safer `unknown`.
       * `any` disables all null checking.
       */
      "@typescript-eslint/no-explicit-any": "error",

      /**
       * Disallow direct use of console methods.
       * Use the logger utility instead: import { logger } from '@/utils/logger'
       */
      "no-console": "error",

      // SonarJS rules
      "sonarjs/no-nested-conditional": "off",

      "react-hooks/preserve-manual-memoization": "off",
      "@typescript-eslint/restrict-template-expressions": "off",

      // Spell checking
      "@cspell/spellchecker": [
        "warn",
        {
          autoFix: true,
          configFile: new URL("./cspell.config.yaml", import.meta.url).toString(),
          cspellOptionsRoot: import.meta.url,
        },
      ],
    },
  },

  // Disable react-refresh rule for Next.js special files
  {
    files: [
      "**/page.tsx",
      "**/layout.tsx",
      "**/loading.tsx",
      "**/error.tsx",
      "**/not-found.tsx",
      "**/template.tsx",
      "**/default.tsx",
      "**/route.ts",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  // Allow console in logger implementation, vite config, and scripts
  {
    files: ["src/utils/logger/**/*.ts", "scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-os-command-from-path": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
]);

export default eslintConfig;
