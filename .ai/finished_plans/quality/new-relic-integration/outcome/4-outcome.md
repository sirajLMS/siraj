# Task 4: Modify `instrumentation.ts` — Load New Relic in Production

## Summary
Modified `instrumentation.ts` to load the New Relic agent after env validation, gated by production + nodejs.

## Files Modified
- `instrumentation.ts` — Added New Relic agent loading section

## Implementation Details
- Agent loading is gated by `NODE_ENV === "production"` AND `NEXT_RUNTIME === "nodejs"`
- Uses dynamic `import("./backend/lib/newrelic-agent")` (Next.js instrumentation requires dynamic imports)
- Wrapped in try/catch — agent failure is logged but never blocks server startup
- On failure, logs via `logger.error()` from `@/backend/lib/logger`
- Existing `ensureEnvironmentValidated()` call is preserved and runs first

## Verification
- ✅ tsgo passed
- ✅ oxlint passed
- ✅ biome:check passed
- ✅ lint:type-aware passed
- ✅ check:duplicates passed
- ✅ codescene passed

## Carry-Forward Knowledge
- `instrumentation.ts` runs on every server startup — agent loading must be fast and non-blocking
- Dynamic `import()` is required for Next.js instrumentation (Edge runtime analyzes the file)
- The `NEXT_RUNTIME === "nodejs"` guard prevents Edge runtime from loading the agent
- The `NODE_ENV === "production"` guard prevents dev/test from loading the agent
- Agent loading failure is non-fatal — server must start even if New Relic fails
