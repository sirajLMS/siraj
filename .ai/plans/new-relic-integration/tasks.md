# New Relic Integration — Tasks

## Phase 0: Pre-Implementation Baseline (DONE)

- [x] 0.1 Record tsgo error count baseline (0 errors)
- [x] 0.2 Record biome warnings baseline (0 warnings)
- [x] 0.3 Create deferred-items ledger (not needed — no deferred items)

---

## Phase 1: Dependencies & Configuration

- [ ] 1. Install New Relic dependencies
  - Add to `package.json` dependencies: `newrelic` (latest v14+), `@pothos/tracing-newrelic`
  - Add to `package.json` devDependencies: `@types/newrelic`
  - Run `bun install`
  - _Requirements: AC-3, AC-5_
  - Applicable AGENTS.md: root `AGENTS.md`
  - Applicable instructions: `backend.instructions.md`

- [ ] 1.1 Quality loop on `package.json`
  - Run `bun run scripts/health/sub-loop.ts package.json --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/1.1-outcome.md`

- [ ] 2. Create `newrelic.cjs` config file
  - Create `newrelic.cjs` at project root
  - Enable `opentelemetry: { enabled: true }`
  - Disable `instrumentation.http`, `instrumentation.next`, `instrumentation.undici`
  - Set `logging.level` to `info`
  - NOTE: `.cjs` files are NOT linted by the project ESLint config (only `.ts`/`.tsx` files are). No inline eslint-disable comments needed. NEVER add `oxlint-disable` comments.
  - Comment that on Vercel, env vars override this file
  - _Requirements: AC-2, AC-3, AC-9_
  - Applicable AGENTS.md: root `AGENTS.md`
  - Applicable instructions: `backend.instructions.md`

- [ ] 2.1 Quality loop on `newrelic.cjs`
  - Run `bun run scripts/health/sub-loop.ts newrelic.cjs --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/2.1-outcome.md`

---

## Phase 2: Agent Loading Infrastructure

- [ ] 3. Create `backend/lib/newrelic-agent.ts` — agent loading helper
  - Export `loadNewRelicAgent()` async function
  - Dynamic `import('newrelic')` — module never loaded if not called
  - Wait for agent connection (up to 8s timeout, per official example)
  - Listen for `'started'` and `'errored'` events
  - Return the `newrelic` module instance (or `undefined` if not loaded)
  - Gate: only callable when `NODE_ENV === 'production'` and `NEXT_RUNTIME === 'nodejs'`
  - Use `@/backend/lib/logger` for any diagnostic logging (never `console.*`)
  - _Requirements: AC-1, AC-6_
  - Applicable AGENTS.md: `backend/AGENTS.md`, root `AGENTS.md`
  - Applicable instructions: `backend.instructions.md`

- [ ] 3.0 Add `export * from "./newrelic-agent"` to `backend/lib/index.ts` barrel
  - Add the export line in alphabetical order (after "logger" line)
  - This file has no `/` in export paths, uses `./` prefix — follows barrel conventions
  - _Requirements: AC-1_

- [ ] 3.1 Quality loop on `backend/lib/newrelic-agent.ts` AND `backend/lib/index.ts`
  - Run `bun run scripts/health/sub-loop.ts backend/lib/newrelic-agent.ts --lifecycle codescene`
  - Run `bun run scripts/health/sub-loop.ts backend/lib/index.ts --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/3.1-outcome.md`

- [ ] 4. Modify `instrumentation.ts` — load New Relic in production
  - Add New Relic agent loading after existing env validation
  - Gate: `process.env.NODE_ENV === 'production'` AND `process.env.NEXT_RUNTIME === 'nodejs'`
  - Call `loadNewRelicAgent()` from `@/backend/lib/newrelic-agent` (async — `await` the call)
  - The existing `ensureEnvironmentValidated()` call is synchronous — no `await` needed
  - Do NOT block the existing `ensureEnvironmentValidated()` call if agent fails (use try/catch around agent loading)
  - Preserve existing Edge runtime guard (`NEXT_RUNTIME === 'nodejs'` check)
  - _Requirements: AC-1, AC-6, AC-19_
  - Applicable AGENTS.md: root `AGENTS.md`
  - Applicable instructions: `backend.instructions.md` (root-level file importing backend lib)

- [ ] 4.1 Quality loop on `instrumentation.ts`
  - Run `bun run scripts/health/sub-loop.ts instrumentation.ts --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/4.1-outcome.md`

---

## Phase 3: Vercel Deployment Configuration

- [ ] 5. Modify `next.config.ts` — add `outputFileTracingIncludes`
  - Add `outputFileTracingIncludes: { "/*": ["./node_modules/newrelic/**/*"] }` to config
  - This tells Vercel's @vercel/nft to include the full newrelic package in serverless function traces
  - Keep existing config intact — only add the new property
  - _Requirements: AC-12_
  - Applicable AGENTS.md: root `AGENTS.md`
  - Applicable instructions: `frontend.instructions.md` (Next.js config file)

- [ ] 5.1 Quality loop on `next.config.ts`
  - Run `bun run scripts/health/sub-loop.ts next.config.ts --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/5.1-outcome.md`

---

## Phase 4: Pothos GraphQL Tracing Integration

- [ ] 6. Modify `backend/graphql/gqlSchemaBuilder.ts` — integrate `@pothos/tracing-newrelic`
  - Import `createNewrelicWrapper` from `@pothos/tracing-newrelic` — NOTE: `@pothos/tracing-newrelic` imports `newrelic` at its top level. To prevent `newrelic` from loading in dev/test, use a **conditional dynamic import** pattern:
    ```typescript
    // At module init:
    const isProduction = process.env.NODE_ENV === "production";
    let tracingWrap = wrapResolver(resolver, (_err, duration) => {
      logger.log(`Executed resolver ${config.parentType}.${config.name} in ${duration}ms`);
    });
    if (isProduction) {
      // Dynamic import ensures newreic module is NOT loaded in dev/test
      const { createNewrelicWrapper } = await import("@pothos/tracing-newrelic");
      tracingWrap = createNewrelicWrapper({ includeArgs: true, includeSource: true });
    }
    ```
    **IMPORTANT**: Since `gqlSchemaBuilder.ts` is currently a synchronous module (no top-level await), you need to either:
    - (a) Refactor the builder initialization to be async (wrap in an async factory function), OR
    - (b) Use a conditional `require()` gated by `NODE_ENV` (since `newrelic` is CommonJS), OR
    - (c) Statically import `@pothos/tracing-newrelic` but ensure `newrelic` package is only installed as a production dependency (not devDependencies) so it's absent in dev — the import will fail gracefully
    Research and choose the approach that works best with the Bun + Next.js 16 + Turbopack bundler. Document the choice in the outcome file.
  - `createNewrelicWrapper()` RETURNS a wrap function — assign it to `tracing.wrap` config (same position as current `wrapResolver`)
  - Add `includeArgs: true` but document that sensitive fields (passwords, PINs) should be excluded via Pothos field-level tracing config
  - _Requirements: AC-5, AC-14, AC-15, AC-16, AC-17_
  - Applicable AGENTS.md: `backend/graphql/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md`
  - Applicable instructions: `backend.instructions.md`

- [ ] 6.1 Quality loop on `backend/graphql/gqlSchemaBuilder.ts`
  - Run `bun run scripts/health/sub-loop.ts backend/graphql/gqlSchemaBuilder.ts --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/6.1-outcome.md`

---

## Phase 5: Documentation & Knowledge Propagation

- [ ] 7. Create canonical reference doc `docs/observability/new-relic-integration.md`
  - Create `docs/observability/` directory if it doesn't exist
  - Document the Hybrid Agent architecture and how it works
  - Document the `newrelic.cjs` config file and why it's `.cjs` not `.ts`
  - Document the Vercel environment variables needed
  - Document the `outputFileTracingIncludes` requirement
  - Document the Pothos tracing integration (`@pothos/tracing-newrelic`)
  - Document the Drizzle OTel tracing (mention it's available but currently disabled)
  - Document cold start trade-offs and limitations
  - Document the Vercel Drains + OTLP export as an alternative approach
  - Include troubleshooting section (agent not reporting, missing traces, etc.)
  - _Requirements: AC-22, AC-23_

- [ ] 7.1 Quality loop on `docs/observability/new-relic-integration.md`
  - Run `bun run scripts/health/sub-loop.ts docs/observability/new-relic-integration.md --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/7.1-outcome.md`

- [ ] 8. Update root `AGENTS.md` — add reference to new doc
  - Add `docs/observability/new-relic-integration.md` to Important References section
  - Add one-line description
  - _Requirements: AC-23_
  - Applicable AGENTS.md: root `AGENTS.md`

- [ ] 8.1 Quality loop on `AGENTS.md`
  - Run `bun run scripts/health/sub-loop.ts AGENTS.md --lifecycle codescene`
  - Fix any errors, re-run until exit 0
  - Write outcome: `.ai/plans/new-relic-integration/outcome/8.1-outcome.md`

---

## Phase 6: Post-Implementation Review

- [ ] 9. Run Plan Review skill
  - Invoke `@plan-review` on the complete plan
  - Fix all violations reported
  - Re-run until "Plan passes all AGENTS.md rules"
  - Write outcome: `.ai/plans/new-relic-integration/outcome/plan-review-R1.md`

- [ ] 10. Parallel Review Wave
  - Dispatch `review-backend` subagent on all modified `backend/` files
  - Dispatch `review-types` on any type changes
  - Dispatch `review-config` on `next.config.ts`, `instrumentation.ts`, `newrelic.cjs`
  - Aggregate findings, fix feature-specific issues
  - Write outcome: `.ai/plans/new-relic-integration/outcome/post-implementation-review.md`
