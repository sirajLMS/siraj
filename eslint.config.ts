import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "logs/**",
      "storage/**",
      ".cursor/**",
      "build/**",
      "dist/**",
      "out/**",
      "next-env.d.ts",
      "health/**",
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
      // generated
      "client/graphql/generated/**",
      "lib/font/google/generated/**",
      // temporarily
      "tests/**",
    ],
  },
  eslint.configs.recommended,
  sonarjs.configs?.recommended,
  // Disable all sonarjs rules globally (re-enable selectively when needed)
  {
    rules: Object.fromEntries(
      Object.keys((sonarjs.configs?.recommended as { rules?: Record<string, unknown> }).rules ?? {}).map(rule => [
        rule,
        "off",
      ])
    ),
  },
  cspellESLintPluginRecommended,
  // Use recommended rules WITHOUT type-aware linting for fast performance
  // Run `~/.bun/bin/bun tsc` separately for type checking
  // ...tseslint.configs.recommended,

  // Use `recommended` with a type-aware config set.
  // `strictTypeChecked` is the strongest.
  // ...tseslint.configs.strictTypeChecked,
  // TypeScript and React-specific configuration
  ...tseslint.configs.strictTypeChecked.map(config => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  // Tell ESLint where your tsconfig.json is so it can
  // enable type-aware rules.
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        project: true,
      },
      globals: globals.browser,
    },

    rules: {
      // React rules
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Note: you must disable the base rule as it can report incorrect errors
      "no-throw-literal": "off",
      "@typescript-eslint/only-throw-error": "warn",

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
       * Bans the `any` keyword — overridden to "off" below.
       */

      /**
       * Disable unified-signatures rule to prevent crashes with overloaded functions
       */
      "@typescript-eslint/unified-signatures": "off",

      /**
       * Disable SonarJS hook setter rule to prevent crashes with React hooks
       */
      "sonarjs/no-hook-setter-in-body": "off",
      "sonarjs/no-commented-code": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/different-types-comparison": "off",
      "sonarjs/prefer-regexp-exec": "off",
      "sonarjs/slow-regex": "off",
      "sonarjs/no-unused-vars": "off",
      // Redundant type conversions like String(str) are intentional for clarity
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      // Dynamic delete is used intentionally in state management
      "@typescript-eslint/no-dynamic-delete": "off",
      // setState in effects is used intentionally for derived state
      "react-hooks/set-state-in-effect": "off",
      // React Compiler memoization preservation warnings — not actionable
      "react-hooks/preserve-manual-memoization": "off",
      // Components created during render — intentional pattern in some cases
      "react-hooks/static-components": "off",
      // Ref access during render — intentional in some patterns
      "react-hooks/refs": "off",
      // Immutability — intentional mutations in some patterns
      "react-hooks/immutability": "off",
      // `never | null | undefined` is intentional in GraphQL isOneOf discriminated unions
      "@typescript-eslint/no-redundant-type-constituents": "off",

      // Allow numbers/booleans/nullish in template literals — overridden to "off" below

      // Enum comparisons with string literals are common and safe — disable false positives
      "@typescript-eslint/no-unsafe-enum-comparison": "off",

      // catch (e: unknown) is overly strict — `any` in catch is standard JS
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",

      // Non-null assertions are used intentionally in well-understood contexts
      "@typescript-eslint/no-non-null-assertion": "off",

      // Strict TS flags many optional chains and nullish coalescing as "unnecessary"
      // when the type system knows the value is non-null, but defensive coding is valid
      "@typescript-eslint/no-unnecessary-condition": "off",

      // Promise-returning functions passed to event handlers are intentional
      "@typescript-eslint/no-misused-promises": "off",

      // async functions without await are valid (e.g. interface implementations, stubs)
      "@typescript-eslint/require-await": "off",

      // string + number is valid JS — restrict-plus-operands is too strict
      "@typescript-eslint/restrict-plus-operands": "off",

      // Type params used once are valid for readability/documentation
      "@typescript-eslint/no-unnecessary-type-parameters": "off",

      // no-unsafe-* family — codebase uses `any` intentionally in many places
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",

      // `any` is used intentionally in many places
      "@typescript-eslint/no-explicit-any": "off",

      // restrict-template-expressions — allow all types in template literals
      "@typescript-eslint/restrict-template-expressions": "off",

      // no-base-to-string — ReactNode in template literals is intentional
      "@typescript-eslint/no-base-to-string": "off",

      // void in union types is used intentionally
      "@typescript-eslint/no-invalid-void-type": "off",

      // confusing-void-expression — void arrow shorthands are intentional
      "@typescript-eslint/no-confusing-void-expression": "off",

      // meaningless-void-operator — intentional in some patterns
      "@typescript-eslint/no-meaningless-void-operator": "off",

      // no-extraneous-class — static-only classes are used intentionally
      "@typescript-eslint/no-extraneous-class": "off",

      // no-misused-spread — intentional spread patterns
      "@typescript-eslint/no-misused-spread": "off",

      // no-deprecated — suppress deprecation warnings for now
      "@typescript-eslint/no-deprecated": "off",

      // await-thenable — intentional in some patterns
      "@typescript-eslint/await-thenable": "off",

      // 3. (Optional) Customize the rule severity
      "@cspell/spellchecker": [
        "warn",
        {
          autoFix: true,
          configFile: new URL("./cspell.config.yaml", import.meta.url).toString(),
          cspellOptionsRoot: import.meta.url,
        },
      ], // Use "warn" instead of "error"
    },
  },
  // Disable spellchecker for locale/seed files (Arabic text, French accents, seed data names)
  {
    files: ["client/locale/**", "client/components/Table/locale/**", "backend/db/scripts/seed/**"],
    rules: {
      "@cspell/spellchecker": "off",
    },
  },
];
