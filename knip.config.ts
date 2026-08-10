import type { KnipConfig } from "knip";

/**
 * Knip unused-code / unused-dependency analysis.
 * Prefer `knip.config.ts` over `knip.ts` so `import … from "knip"` resolves to the package.
 *
 * Next.js, Storybook, Bun test, ESLint, Biome, and Drizzle plugins auto-detect their own
 * entry files; `entry` / `project` below set the analysis scope for this monorepo layout.
 */
const config: KnipConfig = {
  entry: [
    "app/**/page.tsx",
    "app/**/layout.tsx",
    "app/**/route.ts",
    "app/**/loading.tsx",
    "app/**/error.tsx",
    "app/**/template.tsx",
    "scripts/**/*.ts",
  ],
  project: [
    "app/**/*.{ts,tsx}",
    "backend/**/*.{ts,tsx}",
    "frontend/**/*.{ts,tsx}",
    "shared/**/*.{ts,tsx}",
    "scripts/**/*.{ts,tsx}",
    "test/**/*.{ts,tsx}",
  ],
  ignore: [
    "**/.*/**",
    "!.storybook/**",
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
    "**/generated/**",
    "**/unRefactored_tests/**",
    "**/*.d.ts",
  ],
};

export default config;
