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
    "app/**/actions.ts",
    "scripts/**/*.ts",

    // Backend DB seed & migration runners — invoked via `bun run` / `drizzle-kit`,
    // they are the import-graph root for 100+ backend/db/seeds/** files
    "backend/db/scripts/**/*.ts",
    "backend/db/seeds/index.ts",

    // GraphQL schema side-effect registration — `import "@/backend/graphql/pothos"`
    // registers all Pothos types by side-effect (no named imports from the call site)
    "backend/graphql/gqlSchema.definitions.ts",
    "backend/graphql/pothos/index.ts",
    "backend/graphql/query/index.ts",
    "backend/graphql/mutation/index.ts",

    // Bun --preload test roots — loaded via `bun test --preload <file>` CLI flag,
    // never statically imported (package.json scripts: test:ui:components, test:ui:e2e, etc.)
    "test/ui/test-env.ts",
    "test/ui/e2e-preload.ts",
    "test/ui/components/happydom-preload.ts",
    "test/ui/components/next-dynamic-mock.ts",
    "test/ui/components/translation-preload.ts",
    "test/integration/preload/live-comm-preload.ts",
    "test/integration/preload/live-fx-preload.ts",

    // Shell-invoked test runners — executed via `bun run test/scripts/…` from
    // package.json scripts (test:graphql, build:test, test:ui:*, etc.), never imported
    "test/scripts/**/*.ts",

    // Storybook stories — mirrors .storybook/main.ts `stories` glob; components exercised
    // only by stories stay counted (storybook runtime imports .storybook/preview.tsx itself)
    "frontend/**/*.stories.@(ts|tsx)",
  ],
  project: [
    "app/**/*.{ts,tsx}",
    "backend/**/*.{ts,tsx}",
    "frontend/**/*.{ts,tsx}",
    // MDX: knip's built-in MDX compiler is registered via the @mdx-js peer of
    // @storybook/addon-docs (bun.lock); without this extension in `project` knip emits a
    // "compiled extension excluded" config hint. No .mdx files exist in the repo yet —
    // this covers future Storybook docs pages so their imports would be followed.
    "frontend/**/*.mdx",
    "shared/**/*.{ts,tsx}",
    "scripts/**/*.{ts,tsx}",
    "test/**/*.{ts,tsx}",
  ],
  ignore: [
    "**/generated/**",

    // Storybook story aggregation — re-exports *.stories.tsx, accessed only by
    // @storybook/react plugin globbing, never by app code
    "frontend/common/stories/**",

    // Enum layers are value catalogs, not regular modules: members back pgEnum columns, are
    // registered into the Pothos schema via gqlSchemaBuilder.enumType(), and are referenced as
    // string literals (e.g. `invoiceType: "CREDIT_HOURS_PACKAGE"`) — member-level dead-code
    // analysis is unsound here and deleting "unused" members breaks the GraphQL/DB contract.
    "backend/enum/**",
    "shared/constants/**/*.enum.ts",

    // Curated catalog helper surfaces — partially-consumed public API surfaces that mirror
    // other catalog patterns (currency.ts); removing "unused" entries risks dropping valid options
    "frontend/common/lib/payment-method.ts",

    // Namespace-member usage invisible to knip's member tracking:
    // - recurring-schedule-detail/payment-catalog: consumed via `const { X } = await import(...)` dynamic imports
    // - appearance-settings getResolvedAppearance: consumed by service tests via the services barrel
    // - supported-*-repo `listAll`: consumed through the generic `CatalogRepo` type parameter of
    //   buildCatalogMethods() (payment-catalog.service.ts), not by class-name member access
    "backend/services/schedule/recurring-schedule-detail.service.ts",
    "backend/services/payment-method/payment-catalog.service.ts",
    "backend/services/appearance/appearance-settings.service.ts",
    "backend/db/repo/billing/supported-payment-link.repository.ts",
    "backend/db/repo/billing/supported-online-account.repository.ts",
  ],

  // External CLI tool spawned at runtime via child_process.spawn — not an npm binary
  // knip can resolve. Referenced in scripts/sonar-interactive-fixer.ts as optional copilot runner mode.
  ignoreBinaries: ["copilot"],

  // Tooling-only / lifecycle dependencies not statically imported from any source file.
  // These are spell-check dicts, sonar CLI, and duplicate scanner.
  // Conservative starter set — re-run knip after entry changes to verify remaining deps.
  ignoreDependencies: [
    "lint-staged",
    "jscpd",
    "@sonar/scan",
    "@cspell/dict-ar",
    "@cspell/eslint-plugin",
    // TypeScript 6 patch: required via CommonJS require() in scripts/ts6-eslint-patch.cjs and
    // package.json postinstall — .cjs files sit outside the knip project globs
    "@typescript/typescript6",
    // Provides the `tsgo` binary invoked by the `bun tsgo` package script
    "@typescript/native-preview",
    // CLDR data packs: read by file path from node_modules in scripts/generate-iana-timezone-enum.ts
    // (fs.readFileSync, no import statements)
    "cldr-core",
    "cldr-dates-full",
    "cldr-localenames-full",
  ],
};

export default config;
