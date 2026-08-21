# Task 3: Create `backend/lib/newrelic-agent.ts` + Barrel Export

## Summary
Created agent loading helper with dynamic import, 8s timeout, production-only gate. Added barrel export to `backend/lib/index.ts`.

## Files Created
- `backend/lib/newrelic-agent.ts` — `loadNewRelicAgent()` async function

## Files Modified
- `backend/lib/index.ts` — Added `export * from "./newrelic-agent"` (alphabetical, after "logger")

## Implementation Details
- Dynamic `import("newrelic")` — module never loaded if function not called
- Production gate: `NODE_ENV === 'production'` AND `NEXT_RUNTIME === 'nodejs'`
- 8s timeout for agent connection — logs warning on timeout, resolves anyway
- Listens for `'started'` and `'errored'` events on `newrelic.agent`
- Agent failure is caught and logged — never blocks server startup
- Type guard `hasAgent()` used to safely access `agent` property (not in `@types/newrelic`)

## Fixes Applied During Quality Loop
1. **tsgo TS2339**: `newrelic.agent` doesn't exist on `@types/newrelic` → Added `NewRelicModule` interface with `agent` property
2. **tsgo TS2352**: Intersection cast `as typeof import("newrelic") & NewRelicModule` failed (insufficient overlap) → Used type guard `hasAgent(value: unknown): value is NewRelicModule` with separate `unknown`-typed `moduleRef`
3. **oxlint `no-unsafe-type-assertion`**: Double-cast `as unknown as` triggered oxlint → Type guard approach satisfies both tsgo and oxlint

## Verification
- ✅ tsgo passed
- ✅ oxlint passed
- ✅ biome:check passed
- ✅ lint:type-aware passed
- ✅ check:duplicates passed
- ✅ codescene passed

## Carry-Forward Knowledge
- `@types/newrelic` doesn't expose the internal `agent` property — type guard pattern is the correct approach
- The `newrelic` module exports an API object with `this.agent` internally, but types don't reflect this
- Type guards (`value is Type`) are the universal escape hatch for `no-unsafe-type-assertion` (per AGENTS.md)
- Barrel export uses `./` prefix (not `@/`), alphabetical order, `export *` pattern
