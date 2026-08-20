# New Relic APM Integration

## Overview

- **Hybrid Agent architecture**: New Relic intercepts Next.js native OTel spans instead of module patching. This is the only supported approach for Next.js 16+ on Vercel serverless — the traditional module-patching agent does not work when deploying to cloud providers like Vercel.
- **Production-only**: The agent never loads in dev/test (zero dev/test overhead). A dynamic `import("newrelic")` gated by `NODE_ENV === "production"` and `NEXT_RUNTIME === "nodejs"` ensures the module is never even evaluated outside production.
- **GraphQL resolver tracing** via `@pothos/tracing-newrelic` — wraps resolvers with `newrelic.startSegment()` to create `graphql.resolve` segments with field-level attributes (`field_name`, `field_path`, `field_type`, args, source).

## Architecture

- **Agent loading**: `backend/lib/newrelic-agent.ts` — dynamic `import("newrelic")`, 8s connection timeout, production + nodejs runtime gate. Returns the `newrelic` module instance on success, `undefined` on failure or when not in production.
- **Instrumentation hook**: `instrumentation.ts` — the `register()` function loads the agent after env validation, only when `NODE_ENV === "production"` and `NEXT_RUNTIME === "nodejs"`. Agent failure is caught and logged — never blocks server startup.
- **Configuration**: `newrelic.cjs` — CommonJS config file at project root. The agent loads config via `require()`, so TypeScript is not supported. On Vercel, environment variables override this file.
- **GraphQL tracing**: `backend/graphql/gqlSchemaBuilder.ts` — the `tracing.wrap` function uses a conditional `require("@pothos/tracing-newrelic")` gated by `NODE_ENV === "production"`. In dev/test, falls back to existing `wrapResolver` duration logging.
- **Vercel bundling**: `next.config.ts` — `outputFileTracingIncludes` ensures the full `newrelic` package is traced into serverless function bundles.

### Component Flow

```text
instrumentation.ts (entry point)
  └── if NODE_ENV === 'production' && NEXT_RUNTIME === 'nodejs'
      └── ensureEnvironmentValidated()  (env validation runs first)
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

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEW_RELIC_LICENSE_KEY` | Yes (production) | New Relic license key for telemetry export |
| `NEW_RELIC_APP_NAME` | Yes (production) | Application name in New Relic. Supports composite naming (e.g., `"Siraj-Deploy-1;Siraj-Production"`) for multi-deployment rollup aggregation |
| `NEW_RELIC_LABELS` | Optional | Custom labels (environment, tier, stack info) attached to the application entity |

On Vercel, these are configured in the Vercel console — the `newrelic.cjs` file is not needed in the deployment.

### Config File (`newrelic.cjs`)

Located at the project root. Serves as local reference and for non-Vercel deployments. Key settings:

- **OTel enabled**: `opentelemetry.enabled: true` — enables Hybrid Agent mode so the agent intercepts Next.js native OTel spans
- **HTTP instrumentation disabled**: `instrumentation.http.enabled: false` — avoids duplicate spans with Next.js OTel
- **Next.js instrumentation disabled**: `instrumentation.next.enabled: false` — Next.js provides native OTel spans
- **Undici instrumentation disabled**: `instrumentation.undici.enabled: false` — avoids duplicate fetch spans
- **Distributed tracing enabled**: `distributed_tracing.enabled: true`

## Agent Loading Flow

1. Next.js calls `register()` in `instrumentation.ts` on server startup
2. Env validation runs first (`ensureEnvironmentValidated()`)
3. If `NODE_ENV === "production"` and `NEXT_RUNTIME === "nodejs"`: `loadNewRelicAgent()` is called
4. Dynamic `import("newrelic")` loads the agent module
5. Waits up to 8s for the agent's `"started"` event, logs a warning on timeout (non-blocking — server continues without telemetry)
6. Agent failure is caught and logged — never blocks server startup

### Key Implementation Details

- The `loadNewRelicAgent()` function in `backend/lib/newrelic-agent.ts` uses a `hasAgent()` type guard to verify the loaded module has an `agent` property (the `@types/newrelic` package doesn't expose it, but the runtime API does)
- The 8s timeout uses a settled-flag pattern to prevent double-resolution between timeout, `"started"`, and `"errored"` events
- On timeout, the function resolves (not rejects) — the server continues without telemetry

## GraphQL Resolver Tracing

- **In production**: `createNewrelicWrapper({ includeArgs: true, includeSource: true })` wraps resolvers, creating `graphql.resolve` segments with field name, path, type, args, and source as custom span attributes
- **In dev/test**: existing `wrapResolver` duration logging is used (`logger.log` with resolver name and duration in ms)
- The `require("@pothos/tracing-newrelic")` is gated by `NODE_ENV === "production"` — the `newrelic` module is never loaded in dev. This is necessary because `@pothos/tracing-newrelic` imports `newrelic` at its module top level, so a static import would evaluate `newrelic` in dev/test
- The ESLint disable comment for `@typescript-eslint/no-require-imports` is the one exception allowed in this codebase — it is gated by `NODE_ENV` and documented as the only synchronous way to conditionally load the plugin without evaluating `newrelic` in dev

### Why `require()` and not `import()`

`new SchemaBuilder({...})` is synchronous — the `wrap` function must return a resolver synchronously. Dynamic `import()` is async and would require refactoring the entire builder to an async factory, which is a disproportionate change. Conditional `require()` is synchronous, idiomatic for CommonJS interop in Next.js, and the `NODE_ENV` gate guarantees the `newrelic` module is never evaluated in dev/test.

## Vercel Deployment

- `outputFileTracingIncludes: { "/*": ["./node_modules/newrelic/**/*"] }` in `next.config.ts`
- Ensures the full `newrelic` package is traced into serverless function bundles
- Without this, `@vercel/nft` may tree-shake parts of the agent that are dynamically loaded, causing missing telemetry or runtime errors in production
- The `newrelic` package is listed in `dependencies` (not `devDependencies`) in `package.json` so it's available on Vercel. In dev, `require("@pothos/tracing-newrelic")` is never called, so `newrelic` is never evaluated even if the package is installed

## Zero Dev/Test Overhead

- **Agent module never imported**: `loadNewRelicAgent()` returns `undefined` immediately when `NODE_ENV !== "production"` — `import("newrelic")` is never called
- **GraphQL tracing fallback**: falls back to simple `wrapResolver` duration logging via `logger.log`
- **No environment variables needed**: no `NEW_RELIC_LICENSE_KEY` or `NEW_RELIC_APP_NAME` required in dev/test
- **No performance impact**: no agent initialization, no network calls, no config parsing during `bun run dev`, `bun test`, or `bun quality-gate`

## Troubleshooting

- **Agent not connecting**: check `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_NAME` env vars are set in the Vercel console (or `newrelic.cjs` for non-Vercel deployments)
- **Timeout warning** ("New Relic agent connection timed out after 8s"): the agent has 8s to connect — check network/firewall rules allowing outbound traffic to New Relic's ingest endpoints
- **Missing GraphQL traces**: verify `NODE_ENV=production` is set and the agent loaded successfully (check for "New Relic agent connected" log). The `require("@pothos/tracing-newrelic")` only runs in production
- **Vercel bundle missing newrelic**: verify `outputFileTracingIncludes` in `next.config.ts` includes `"./node_modules/newrelic/**/*"`. Without this, `@vercel/nft` may tree-shake the dynamically loaded agent code
- **Agent failure blocking startup**: this should never happen — agent loading is wrapped in try/catch in both `instrumentation.ts` and `loadNewRelicAgent()`. If it does, check the error log for the root cause
