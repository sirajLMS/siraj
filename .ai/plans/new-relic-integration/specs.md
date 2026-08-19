# New Relic Integration — Requirements Specification

## Overview

Implement production Application Performance Monitoring (APM) using the New Relic Node.js agent with the Hybrid Agent approach for Next.js 16 App Router on Vercel serverless. The integration must provide full-stack observability: HTTP transactions, GraphQL resolver tracing via Pothos, database query visibility via Drizzle, distributed tracing, and optional browser RUM — all without impacting local development or test environments.

## Research Baseline (from docs MCP + online)

- **New Relic Hybrid Agent** officially supports Next.js 16+ on Vercel (confirmed via `newrelic` docs MCP library)
- The agent intercepts Next.js native OTel spans and synthesizes New Relic telemetry
- Config file MUST be `newrelic.cjs` (CommonJS) — **TypeScript is NOT supported** for the config file. The agent uses `require()` at startup. `NEW_RELIC_CONFIG_FILENAME` env var allows custom names but still must be `.js` or `.cjs`
- **`@pothos/tracing-newrelic`** is an official Pothos plugin that wraps resolvers with `newrelic.startSegment()`, adding field name, path, type, args, and source as custom span attributes
- Siraj already has `@pothos/plugin-tracing` installed and configured with `wrapResolver` for duration logging
- **Drizzle ORM** has built-in OpenTelemetry tracing support (currently disabled, but the Hybrid Agent intercepts OTel spans so DB queries will appear in traces if enabled)
- Vercel Drains support OTLP/HTTP export to New Relic as an alternative (no agent cold start overhead)
- `@vercel/otel` can be used alongside for native OTel, but New Relic Hybrid Agent supersedes this need
- New Relic is NOT in the Vercel Marketplace native integrations list for trace drains (unlike Sentry, Datadog, etc.) — custom OTLP/HTTP endpoint or full agent is required

## User Stories

### US-1: Production APM Visibility
As a **developer/ops engineer**, I want to see all production HTTP transactions, their response times, error rates, and throughput in New Relic APM, so that I can identify performance bottlenecks and diagnose production issues quickly.

### US-2: GraphQL Resolver Tracing
As a **backend developer**, I want to see GraphQL operation traces with field-level resolver timing in New Relic, so that I can identify slow resolvers, N+1 queries, and optimize the most expensive GraphQL fields.

### US-3: Database Query Visibility
As a **backend developer**, I want to see PostgreSQL query durations and patterns within New Relic transaction traces, so that I can identify slow queries and optimize database access patterns.

### US-4: Distributed Tracing
As a **developer/ops engineer**, I want end-to-end distributed traces from Apollo Client → Next.js Server → Pothos Resolver → Drizzle/PostgreSQL, so that I can see the full request waterfall and pinpoint latency at each layer.

### US-5: Zero Dev/Test Overhead
As a **developer**, I want New Relic to be completely inactive during local development, tests, and quality gates, so that it never slows down `bun run dev`, `bun test`, or `bun quality-gate`.

### US-6: Multi-Deployment Aggregation
As an **ops engineer**, I want telemetry from all production deployments aggregated under a single New Relic application entity while retaining per-deployment drill-down, so that I get a unified dashboard view.

## Acceptance Criteria (EARS Format)

### AC-1: Agent Loading
1. WHEN `process.env.NEXT_RUNTIME === 'nodejs'` AND `process.env.NODE_ENV === 'production'` THEN the system SHALL load the New Relic agent via `instrumentation.ts` `register()` function
2. WHEN `process.env.NEXT_RUNTIME !== 'nodejs'` (Edge runtime) THEN the system SHALL NOT load the New Relic agent
3. WHEN `process.env.NODE_ENV !== 'production'` THEN the system SHALL NOT load the New Relic agent
4. WHEN the agent is loaded THEN the system SHALL wait up to 8 seconds for agent connection before continuing, using a non-blocking timeout pattern

### AC-2: Hybrid Agent Configuration
5. WHEN the New Relic agent is active THEN `opentelemetry.enabled` SHALL be `true`
6. WHEN the New Relic agent is active THEN `instrumentation.http.enabled` SHALL be `false` (to avoid duplicate spans with Next.js OTel)
7. WHEN the New Relic agent is active THEN `instrumentation.next.enabled` SHALL be `false`
8. WHEN the New Relic agent is active THEN `instrumentation.undici.enabled` SHALL be `false`

### AC-3: Config File
9. WHEN the project is built THEN `newrelic.cjs` (CommonJS) SHALL exist at the project root containing the agent configuration
10. WHEN environment variables are set on Vercel THEN the agent SHALL read configuration from env vars (no `newrelic.cjs` needed in Vercel deployment)
11. The system SHALL NOT use a TypeScript config file — the agent loads config via `require()` which only supports `.js` or `.cjs`

### AC-4: Vercel Deployment
12. WHEN the project is deployed to Vercel THEN `outputFileTracingIncludes` in `next.config.ts` SHALL include `"./node_modules/newrelic/**/*"` to ensure the full agent is traced into serverless function bundles
13. WHEN the project is deployed to Vercel THEN the required environment variables SHALL be configured in the Vercel console (documented, not hardcoded)

### AC-5: Pothos GraphQL Tracing
14. WHEN the New Relic agent is active THEN Pothos GraphQL resolvers SHALL be wrapped with `@pothos/tracing-newrelic`'s `createNewrelicWrapper` to create `graphql.resolve` segments
15. WHEN a GraphQL resolver executes THEN the New Relic span SHALL include `field_name`, `field_path`, and `field_type` as custom attributes
16. WHEN `includeArgs` is enabled THEN resolver arguments SHALL be attached as span attributes (excluding sensitive fields)
17. WHEN the New Relic agent is NOT active (dev/test) THEN the Pothos tracing plugin SHALL fall back to the existing `wrapResolver` duration-logging behavior

### AC-6: Environment Safety
18. WHEN `NODE_ENV !== 'production'` THEN `import('newrelic')` SHALL NOT be called — the agent module must never load
19. WHEN running `bun test`, `bun run dev`, or `bun quality-gate` THEN zero New Relic overhead SHALL be measurable (no agent initialization, no network calls, no config parsing)

### AC-7: Multi-Deployment Naming
20. WHEN deployed to production THEN `NEW_RELIC_APP_NAME` SHALL support composite naming (e.g., `"Siraj-Deploy-1;Siraj-Production"`) for rollup aggregation
21. WHEN deployed to production THEN custom labels SHALL be attached via `NEW_RELIC_LABELS` (environment, tier, stack info)

### AC-8: Documentation
22. The system SHALL include a canonical reference doc at `docs/observability/new-relic-integration.md` covering setup, configuration, troubleshooting, and the hybrid agent architecture
23. Root `AGENTS.md` SHALL reference the new doc in its Important References section

## Constraints

- **Runtime**: Agent is Node.js-only — does not work in Edge runtime or with Bun locally (production Vercel = Node.js)
- **Config file**: MUST be `.cjs` (CommonJS) — TypeScript config is not supported by the agent's `require()` loader
- **Cold start**: Agent adds startup overhead (up to 8s connection wait) — acceptable for serverless but must be documented
- **No `console.*`**: All New Relic diagnostic logs must route through the project's `logger` (ESLint enforces this)
- **CSP**: Injecting the browser agent requires CSP header adjustments (if browser RUM is enabled)
- **No existing OTel conflict**: Siraj does not use `@vercel/otel` — no conflict with New Relic Hybrid Agent

## Non-Goals

- Browser RUM (New Relic browser agent injection) — documented as optional future enhancement
- Vercel Drains / OTLP export approach — documented as alternative but not implemented (Hybrid Agent is the primary approach)
- Sentry integration conflict resolution — Siraj does not currently use Sentry
- Local development monitoring — agent is production-only
