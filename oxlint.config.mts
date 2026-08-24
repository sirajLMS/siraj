import { defineConfig } from "oxlint";

const unusedVarOptions = {
  argsIgnorePattern: "^_",
  varsIgnorePattern: "^_",
  caughtErrorsIgnorePattern: "^_",
  destructuredArrayIgnorePattern: "^_",
} as const;

export default defineConfig({
  plugins: [
    "typescript",
    "unicorn",
    "oxc",
    "react",
    "nextjs",
    "import",
    "promise",
    "node",
    "vitest",
    "jsx-a11y",
    "jsdoc",
  ],
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    // Intentional dialog/field focus is valid a11y; this rule fights modal UX.
    "jsx-a11y/no-autofocus": "off",
    "no-console": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-namespace": "off",
    "no-unused-vars": ["error", unusedVarOptions],
    "@typescript-eslint/no-unused-vars": ["error", unusedVarOptions],
    "import/no-unassigned-import": [
      "error",
      {
        allow: [
          "**/*.css",
          "**/*.scss",
          "**/*.mutation",
          "**/*.mutation.ts",
          "**/*.query",
          "**/*.query.ts",
          "**/*.type",
          "**/*.type.ts",
          "**/*.enum",
          "**/*.enum.ts",
          "**/*.pothos",
          "**/*.pothos.ts",
          "./*",
          "@/backend/graphql/**",
          "@mui/x-data-grid/themeAugmentation",
        ],
      },
    ],
  },
  overrides: [
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
      },
    },
    {
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "test/**/*",
        "backend/db/test/**/*",
        "backend/services/**/test/**/*",
        "backend/services/**/*.test.ts",
        "frontend/**/test/**/*",
        "frontend/**/*.test.tsx",
        "frontend/**/*.test.ts",
        "app/**/*.test.ts",
      ],
      rules: {
        "@typescript-eslint/unbound-method": "off",
      },
    },
    {
      // Drizzle dialect-aware type-erasure: the `as never` casts on FK
      // .references(() => otherTable.id as never, ...) in schema files, and the
      // `db as never` cast in migrate.ts (libsql migrator branch) are the documented
      // multi-dialect (PG + SQLite) pattern (see __shared__/dialectAwareBuilder.ts
      // + docs/SQLITE_MIGRATION_PROGRESS.md). The casts are intentional and
      // runtime-safe (real sqlite/pg objects are returned; the cast only erases
      // the TS type so the service/repo layers see PG types unchanged).
      files: ["backend/db/schema/**", "backend/db/scripts/migrate.ts", "test/scripts/run-server-tests.ts"],
      rules: {
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
    {
      files: [
        "frontend/common/hooks/useApolloConnectivity.ts",
        "frontend/common/providers/apollo/useAuthRecoveryRegistration.ts",
        "frontend/common/views/dashboard/admin/__shared__/useAdminDashboard.ts",
        "frontend/common/views/dashboard/teachers/dashboard/utils/useTeacherDashboardLastUpdated.ts",
        "frontend/common/views/dashboard/components/DashboardProfileShell.tsx",
      ],
      rules: {
        "@typescript-eslint/consistent-return": "off",
      },
    },
  ],
  ignorePatterns: [
    "**/.*/**",
    "!.storybook/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "dist/**",
    "logs/**",
    "storage/**",
    "scratch/**",
    "draft/**",
    "public/**",
    "storybook-static/**",
    "docs/**",
    "**/*.d.ts",
    "next-env.d.ts",
    "eslint.config.ts",
    "eslint.config.mjs",
    "oxlint.config.mts",
    "debug-eslint.js",
    "bun.lock",
    "*.lock",
    "*.log",
    "**/*.md",
    "**/*.html",
    "**/messages/**",
    "frontend/common/graphql/generated/**",
    "**/unRefactored_tests/**",
    "*storybook.log",
  ],
  env: {
    builtin: true,
    browser: true,
    node: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
