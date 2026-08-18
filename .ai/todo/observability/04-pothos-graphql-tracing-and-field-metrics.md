# TODO: Pothos GraphQL Tracing, Field Metrics & Resolver Diagnostics

## 📋 Metadata
- **Domain**: Backend GraphQL Performance & Resolver Optimization
- **Primary Library / Tool**: `@pothos/plugin-tracing`, `@pothos/plugin-dataloader`
- **Docs MCP Library**: `pothos`, `apollo-server`
- **Status**: Ready for Spec-Driven Development Plan
- **Target Environments**: All Environments (Production, Staging, Development)

---

## 🎯 Executive Summary & Objective

Enhance and standardize GraphQL telemetry by expanding the existing [`@pothos/plugin-tracing`](file:///home/ahmed/Projects/siraj/backend/graphql/gqlSchemaBuilder.ts#L145) implementation. The objective is to provide high-resolution field-level execution metrics, track DataLoader cache hit/batch rates, detect slow nested resolvers, and bridge GraphQL resolver timing directly into APM tools (New Relic / OpenTelemetry / Sentry spans) with zero disruption to type safety.

---

## 🏗️ Architecture & Requirements

### 1. Resolver Tracing & Span Instrumentation
- **Current Foundation**: [`backend/graphql/gqlSchemaBuilder.ts`](file:///home/ahmed/Projects/siraj/backend/graphql/gqlSchemaBuilder.ts) currently wraps root fields with basic duration logging.
- **Enhanced Telemetry**:
  * Create structured tracing spans for root Query/Mutation operations and opt-in expensive nested fields.
  * Integrate `@pothos/plugin-tracing` with OpenTelemetry `Tracer` / New Relic `startSegment` to display GraphQL field execution as child spans in distributed trace waterfalls.
  * Record field arguments (excluding passwords, PINs, and sensitive inputs) and parent types as span attributes.

### 2. DataLoader Batching & N+1 Diagnostics
- **Efficiency Monitoring**: Instrument [`@pothos/plugin-dataloader`](file:///home/ahmed/Projects/siraj/package.json#L101) instances to log batch execution sizes, cache hit ratios, and dispatch timing.
- **N+1 Alerting**: Detect when unbatched resolvers execute excessive database calls in a single GraphQL request and emit a diagnostic warning via `logger.warn`.

### 3. GraphQL Field Usage & Slow Query Telemetry
- **Slow Resolver Threshold**: Automatically flag resolvers exceeding a defined threshold (e.g. >200ms) with full context (`operationName`, `field`, `userId`, `duration`).
- **Error Context Enrichment**: Propagate request locale (`ctx.locale`) and error classification tags into the tracing context for localized error observability.

---

## 🧩 Affected Files & Integration Points

| File / Directory | Description |
| :--- | :--- |
| `backend/graphql/gqlSchemaBuilder.ts` | Pothos builder configuration (`tracing` plugin options and resolver wrapping). |
| `backend/graphql/pothos/` | Domain Pothos object definitions; opt-in tracing flags for heavy computed fields. |
| `backend/lib/logger/` | Structured logging format for resolver execution metrics. |
| `frontend/common/graphql/` | Apollo Client header propagation (`x-graphql-client-name`, `traceparent`). |

---

## ⚙️ Configuration & Schema Patterns

```typescript
// backend/graphql/gqlSchemaBuilder.ts (Conceptual Pattern)
tracing: {
  default: config => isRootField(config),
  wrap: (resolver, _options, config) =>
    wrapResolver(resolver, (error, duration) => {
      // 1. Log slow resolvers (> 200ms)
      if (duration > 200) {
        logger.warn(`Slow resolver detected: ${config.parentType}.${config.name} took ${duration}ms`);
      }
      // 2. Forward to APM / OpenTelemetry span
      recordResolverSpan(config.parentType, config.name, duration, error);
    }),
}
```

---

## 🧪 Verification & Acceptance Criteria (For SDD Plan)

1. [ ] **Resolver Timing Accuracy**: Executing a complex query produces accurate child spans matching backend service durations.
2. [ ] **DataLoader Verification**: Batched field resolvers group individual lookups into single repository calls without duplicate executions.
3. [ ] **Non-Interference with Schema Generation**: `bun run generate:gqlSchema` and `bun codegen` execute cleanly without schema drift or typing conflicts.
4. [ ] **Code Quality**: Passes all quality stages (`tsgo`, `oxlint`, `biome:check`, `lint:type-aware`, `check:duplicates`).

---

## 📚 Docs MCP Server Search Guide

When drafting the implementation plan, search the indexed `pothos` and `apollo-server` libraries:
```bash
# Search Pothos Tracing Plugin docs
# Query library: pothos
# Search terms: "plugin-tracing wrapResolver", "tracing with OpenTelemetry", "plugin-dataloader batching"
```
