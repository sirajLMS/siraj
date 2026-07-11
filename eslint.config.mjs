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
  // import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-test/**",
    ".next-test-*/**",
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
    "**/.ai",
    "**/.git",
    "**/*.md",
    "**/*.html",
    ".husky",
    "**/messages/**",
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
    "scratch/**",
    "**/unRefactored_tests/**",
    "*storybook.log",
    "storybook-static/**",
    ".playwright-mcp/**",
  ]),
  eslint.configs.recommended,
  sonarjs.configs.recommended,
  // cspellESLintPluginRecommended, // Disabled for performance

  // TypeScript and React-specific configuration
  ...tseslint.configs.recommended.map(config => ({
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
          destructuredArrayIgnorePattern: "^_",
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

      // Spell checking (disabled for performance - run separately if needed)
      // "@cspell/spellchecker": [
      //   "warn",
      //   {
      //     autoFix: true,
      //     configFile: new URL("./cspell.config.yaml", import.meta.url).toString(),
      //     cspellOptionsRoot: import.meta.url,
      //   },
      // ],
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

  // Disable react-refresh rule for UI test files (test utilities export non-component helpers)
  {
    files: ["test/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  // Allow console and bypass security rules in specific files (logger, scripts, tests, config)
  {
    files: [
      "frontend/utils/logger.ts",
      "scripts/**/*.ts",
      "backend/db/scripts/**/*.ts",
      "backend/db/test/**/*.ts",
      "next.config.ts",
    ],
    rules: {
      "no-console": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-os-command-from-path": "off",
      "sonarjs/no-hardcoded-ip": "off",
      "sonarjs/sql-queries": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },

  // // Local custom rules
  // import { localRulesPlugin } from "./scripts/eslint-rules/index.mjs";
  //   {
  //     files: ["**/*.{tsx}"],
  //     plugins: {
  //       "local-rules": localRulesPlugin,
  //     },
  //     rules: {
  //       "local-rules/no-hardcoded-colors": "error",
  //     },
  //   },

  // Enforce @/ path alias — relative ./ or ../ imports are banned
  // except for barrel files (**/index.ts) which legitimately re-export siblings.
  {
    files: [
      "app/**/*.{ts,tsx}",
      "backend/**/*.{ts,tsx}",
      "frontend/**/*.{ts,tsx}",
      "shared/**/*.{ts,tsx}",
      "test/**/*.{ts,tsx}",
      "scripts/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value=/^\\.\\.?\\//]",
          message: "Imports must use @/ path alias, not relative ./ or ../ — see AGENTS.md",
        },
      ],
    },
  },

  // Shared code must not depend on frontend, backend, or app layers.
  {
    files: ["shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/frontend/**", "@/backend/**", "@/app/**"],
              message: "Shared code must not import from frontend, backend, or app layers — see shared/AGENTS.md",
            },
          ],
        },
      ],
    },
  },

  // Frontend code must not depend on the backend layer (use GraphQL or shared/ instead).
  {
    files: ["frontend/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/backend/**"],
              message:
                "Frontend code must not import from the backend layer — use GraphQL, shared/, or app/ server entry points instead",
            },
          ],
        },
      ],
    },
  },

  // Backend code must not depend on the frontend layer.
  {
    files: ["backend/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/frontend/**"],
              message:
                "Backend code must not import from the frontend layer — move shared logic to shared/ or backend/",
            },
          ],
        },
      ],
    },
  },

  // **/index.ts barrel files keep relative ./sibling re-exports by design.
  {
    files: ["**/index.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Seeders must not import from the database layer directly — use services instead.
  {
    files: ["backend/db/seeds/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/backend/db/drizzleDb",
                "@/backend/db/db.types",
                "@/backend/db/schema",
                "@/backend/db/schema/**",
                "@/backend/db/repo",
                "@/backend/db/repo/**",
                "@/backend/db/migration",
                "@/backend/db/migration/**",
                "@/backend/db/scripts/**",
                "@/backend/drizzle/**",
              ],
              message:
                "Seeders must not import from the database layer — call backend services (bootstrap methods) instead. See backend/db/seeds/AGENTS.md",
            },
          ],
        },
      ],
    },
  },

  // Mobile files must not import desktop files (and vice versa).
  // IMPORTANT: no-restricted-imports matches the raw import specifier string (the `from` value).
  // TypeScript imports omit the .tsx extension, so patterns must match extensionless imports.
  // Use regex for precise matching instead of glob group to catch both "foo.desktop" and "foo.desktop.tsx".
  {
    files: ["**/*.mobile.tsx", "**/*.mobile.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "\\.desktop(\\.tsx?)?$",
              message: "Mobile components must not import desktop components — see architecture rules in AGENTS.md",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.desktop.tsx", "**/*.desktop.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "\\.mobile(\\.tsx?)?$",
              message: "Desktop components must not import mobile components — see architecture rules in AGENTS.md",
            },
          ],
        },
      ],
    },
  },

  // Mobile and desktop files must not use useMediaQuery or useViewport.
  // They are pure presentation — the viewport tier is decided by the parent switcher.
  // `paths` and `patterns` coexist in the same rule entry (both fire independently).
  {
    files: ["**/*.mobile.tsx", "**/*.desktop.tsx", "**/*.mobile.ts", "**/*.desktop.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mui/material",
              importNames: ["useMediaQuery"],
              allowTypeImports: true,
              message:
                "Mobile/desktop components must not use useMediaQuery — viewport tier is decided by the parent View switcher",
            },
          ],
          patterns: [
            {
              group: ["@/frontend/hooks/useViewport", "@/frontend/context/ViewportContext"],
              message: "Mobile/desktop components must not read viewport context — they are already tier-specific",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
