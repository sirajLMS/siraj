# New Relic Integration — Technical Design

## Overview

The design uses New Relic's **Hybrid Agent** architecture for Next.js 16 App Router on Vercel serverless. The Hybrid Agent intercepts Next.js native OpenTelemetry spans (instead of patching modules) and synthesizes New Relic telemetry. For GraphQL, the official `@pothos/tracing-newrelic` plugin wraps Pothos resolvers with `newrelic.startSegment()` for field-level tracing. Drizzle ORM's built-in OTel tracing provides database query visibility within traces. The agent is gated to production-only via `NODE_ENV` and `NEXT_RUNTIME` checks.

## Design Goals

- **Production-only**: Zero overhead in dev/test — agent never loads outside production
- **Full-stack tracing**: HTTP → GraphQL resolver → Drizzle/PostgreSQL waterfall in New Relic
- **Minimal code change**: Leverage existing `@pothos/plugin-tracing` infrastructure; add `@pothos/tracing-newrelic` wrapper
- **Vercel-compatible**: Follow official New Relic Next.js + Vercel deployment guide exactly
- **No TypeScript config**: Use `newrelic.cjs` (CommonJS) as agent config file (agent uses `require()`, not `import`)

## Key Design Decisions (All Locked)

> All 5 design decisions are locked. No open questions remain. No studying required — executing agents should follow the decisions as written.

### Decision 1: Hybrid Agent Over Traditional Agent
**Context**: New Relic offers both traditional module-patching agent and Hybrid Agent for Next.js
**Options**:
1. Traditional agent — patches HTTP/Next.js/Undici modules — **Cons**: Doesn't work on Vercel (code splitting breaks module patching)
2. Hybrid Agent — intercepts Next.js OTel spans — **Cons**: Requires Next.js 16+ (already met)
**Decision**: Hybrid Agent
**Rationale**: Official docs state "we currently only support the Hybrid Agent approach for Next.js versions 16 and above." Traditional agent "didn't work when deploying to cloud providers like Vercel, AWS Amplify, Netlify, or Azure Static Web Apps."

### Decision 2: `newrelic.cjs` Over TypeScript Config
**Context**: Agent loads config via `require()` at startup
**Options**:
1. `newrelic.ts` — TypeScript config — **Cons**: Agent uses `require()`, not a TS loader; would need `tsc` compilation before agent reads it; not supported
2. `newrelic.cjs` — CommonJS config — **Cons**: Another JS file in a TS project; **Pros**: Officially supported since agent v7.5.0
3. Environment variables only — **Cons**: No local config file for reference; harder to version-control defaults
**Decision**: `newrelic.cjs` for local reference + env vars on Vercel
**Rationale**: Official docs state "you will need to update the configuration file's extension to be `.cjs` instead of `.js`." The `NEW_RELIC_CONFIG_FILENAME` env var can also point to a custom name but must still be `.cjs` or `.js`. On Vercel, env vars take precedence.

### Decision 3: `@pothos/tracing-newrelic` Over Custom OTel Wrapping
**Context**: Need field-level GraphQL resolver traces in New Relic
**Options**:
1. `@pothos/tracing-newrelic` — official Pothos plugin using `newrelic.startSegment()` — **Cons**: Adds `newrelic` as peer dependency
2. `@pothos/tracing-opentelemetry` — OTel-based wrapper — **Cons**: More setup, need OTel SDK config
3. Custom wrapping via `newrelic.instrumentWebframework()` — **Cons**: Not field-level, custom code to maintain
**Decision**: `@pothos/tracing-newrelic`
**Rationale**: Official Pothos plugin, minimal config, field-level spans with `field_name`, `field_path`, `field_type` attributes. Works with the Hybrid Agent's OTel interception. Siraj already has `@pothos/plugin-tracing` installed — just need to swap/extend the `wrap` function.

### Decision 4: Production-Only Agent Loading
**Context**: Agent must never load in dev/test (per AC-6/AC-7)
**Options**:
1. Gate in `instrumentation.ts` with `NODE_ENV` check — **Cons**: Agent module still evaluated
2. Dynamic `import('newrelic')` gated by `NODE_ENV === 'production'` — **Pros**: Module never loaded in dev
3. Separate instrumentation file loaded only in production build
**Decision**: Dynamic import gated by `NODE_ENV === 'production'` AND `NEXT_RUNTIME === 'nodejs'`
**Rationale**: `import('newrelic')` ensures the module is never even evaluated in dev/test. The existing `instrumentation.ts` already gates env validation via `NEXT_RUNTIME === 'nodejs'` — same pattern.

### Decision 5: Dual Tracing Wrapper (New Relic + Logger Fallback)
**Context**: Current Pothos tracing uses `wrapResolver` for duration logging. New Relic plugin uses `createNewrelicWrapper` for segments. Need both.
**Options**:
1. Replace `wrapResolver` with `createNewrelicWrapper` only — **Cons**: Loses logger.log duration output in dev
2. Use both — `createNewrelicWrapper` in production, `wrapResolver` in dev — **Cons**: Conditional logic in builder config
3. Conditional wrapper selection at builder initialization
**Decision**: Conditional wrapper — when `newrelic` module is available (production), use `createNewrelicWrapper`; otherwise fall back to existing `wrapResolver` logger pattern
**Rationale**: Zero dev overhead, preserves existing logging behavior in dev, gains New Relic segments in production.

**✅ Resolution — Conditional `require()` gated by `NODE_ENV`** (Option b):

`@pothos/tracing-newrelic` imports `newrelic` at its module top level (`import newrelic from 'newrelic'`). A static `import` in `gqlSchemaBuilder.ts` would cause `newrelic` to be evaluated in dev/test, violating AC-6/AC-19.

Options considered:
- **(a) Async builder factory with dynamic `import('@pothos/tracing-newrelic')`** — ❌ Requires refactoring builder initialization to async; `new SchemaBuilder()` is called synchronously at module top level; would cascade breaking changes across the entire GraphQL schema initialization
- **(b) Conditional `require()` gated by `NODE_ENV`** — ✅ **CHOSEN**: Works because `newrelic` is CommonJS; `require()` is synchronous; only evaluates when `NODE_ENV === 'production'`; zero dev/test overhead; minimal code change (3 lines in builder config)
- **(c) Install `newrelic` as production-only dependency** — ❌ Fragile: Turbopack may still resolve and bundle the import at build time even if the package is absent in dev; crashes are non-graceful (uncaught `MODULE_NOT_FOUND`)

**Locked approach** (b):
```typescript
// In gqlSchemaBuilder.ts tracing config:
tracing: {
  default: config => isRootField(config),
  wrap: (resolver, _options, config) => {
    if (process.env.NODE_ENV === "production") {
      // Conditional require: newrelic module is NEVER loaded in dev/test.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- gated by NODE_ENV; CommonJS require is the only way to conditionally load @pothos/tracing-newrelic without evaluating newrelic in dev
      const { createNewrelicWrapper } = require("@pothos/tracing-newrelic");
      return createNewrelicWrapper({ includeArgs: true, includeSource: true })(
        resolver, _options, config
      );
    }
    // Dev/test fallback: existing wrapResolver duration logging
    return wrapResolver(resolver, (_error, duration) => {
      logger.log(`Executed resolver ${config.parentType}.${config.name} in ${duration}ms`);
    });
  },
},
```

**Why `require()` and not `import()`**: `new SchemaBuilder({...})` is synchronous — the `wrap` function must return a resolver synchronously. Dynamic `import()` is async and would require refactoring the entire builder to an async factory (Option a), which is a disproportionate change. Conditional `require()` is synchronous, idiomatic for CommonJS interop in Next.js, and the `NODE_ENV` gate guarantees the `newrelic` module is never evaluated in dev/test.

**Note on `newrelic` package placement in `package.json`**: Install `newrelic` in `dependencies` (not `devDependencies`) so it's available on Vercel. In dev, `require("@pothos/tracing-newrelic")` is never called, so `newrelic` is never evaluated even if the package happens to be installed. The `NODE_ENV` gate is the safety boundary, not the package placement.

## Component Architecture

```
instrumentation.ts (entry point)
  └── if process.env.NODE_ENV === 'production' && process.env.NEXT_RUNTIME === 'nodejs'
      └── await loadNewRelicAgent()  [backend/lib/newrelic-agent.ts]
          └── dynamic import('newrelic') — module never loaded if not called
              └── newrelic.cjs config (or env vars on Vercel)
                  └── Hybrid Agent intercepts Next.js OTel spans (opentelemetry.enabled: true)
                      ├── HTTP transaction spans (from Next.js, instrumentation.http disabled)
                      ├── GraphQL operation spans (from @as-integrations/next OTel)
                      │   └── gqlSchemaBuilder.ts: conditional require('@pothos/tracing-newrelic')
                      │       └── createNewrelicWrapper({ includeArgs, includeSource })
                      │           └── newrelic.startSegment('graphql.resolve')
                      └── Drizzle DB query spans (from Drizzle OTel tracing)
```

**Key**: `require('@pothos/tracing-newrelic')` inside `gqlSchemaBuilder.ts` is gated by `process.env.NODE_ENV === 'production'`. In dev/test, the `newrelic` module is never evaluated — the existing `wrapResolver` logger fallback runs instead.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `newrelic`, `@pothos/tracing-newrelic`, `@types/newrelic` deps |
| `newrelic.cjs` | Create | New Relic agent config (CommonJS) for local reference & non-Vercel deployments |
| `instrumentation.ts` | Modify | Add New Relic agent loading in production nodejs runtime |
| `next.config.ts` | Modify | Add `outputFileTracingIncludes` for `newrelic` package |
| `backend/graphql/gqlSchemaBuilder.ts` | Modify | Swap tracing wrapper to `@pothos/tracing-newrelic` in production |
| `backend/lib/newrelic-agent.ts` | Create | Agent loading helper (dynamic import + connection wait) |
| `docs/observability/new-relic-integration.md` | Create | Canonical reference doc |

## UX/Navigation Specification

This is a backend observability integration — **no new routes, sidebar entries, or UI components** are added.

- **No new pages/routes**: All changes are in `instrumentation.ts`, `next.config.ts`, `gqlSchemaBuilder.ts`, and config files
- **No sidebar/navigation changes**: Observability tooling is configured via Vercel console + New Relic UI (external), not the Siraj app
- **Role-based access**: N/A — no user-facing UI changes
- **Mobile/Desktop**: N/A — no UI changes
- **Permission mapping**: N/A — no route additions

## Outcome & Knowledge Transfer Protocol

Per spec-driven development rules:
- **BEFORE Execution**: Read ALL files in `.ai/plans/new-relic-integration/outcome/`
- **AFTER Execution**: Write `<task-id>-outcome.md` with research findings and implementation details
- **PROGRESS TRACKING**: Update task checkboxes `[ ]` → `[x]` in `tasks.md`

## Error Handling Strategy

- **Agent connection failure**: 8-second timeout (per official example) — agent runs in background, non-blocking after timeout
- **Missing `NEW_RELIC_LICENSE_KEY`**: Agent will log error and disable itself (built-in behavior)
- **Pothos tracing with no agent**: LOCKED — `@pothos/tracing-newrelic` imports `newrelic` at its top level. A conditional `require("@pothos/tracing-newrelic")` gated by `process.env.NODE_ENV === "production"` ensures `newrelic` is never evaluated in dev/test. In dev/test, the existing `wrapResolver` logger fallback is used. No async refactoring needed.
- **Vercel cold start**: Agent adds startup overhead; the 8s timeout is a ceiling, not typical. Documented as known trade-off.

## Testing Strategy

- **Unit tests**: No new tests needed for config files (`.cjs`). Agent loading helper (`newrelic-agent.ts`) can have a simple test verifying it returns `undefined` when not in production.
- **Integration tests**: Verify `instrumentation.ts` `register()` does not call `import('newrelic')` when `NODE_ENV !== 'production'`
- **E2E verification**: Manual — deploy to Vercel, make requests, confirm data appears in New Relic APM entity
- **Quality gates**: All modified files must pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
