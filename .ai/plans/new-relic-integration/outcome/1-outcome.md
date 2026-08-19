# Task 1: Install New Relic Dependencies

## Summary
Added New Relic dependencies to `package.json` and ran `bun install`.

## Files Modified
- `package.json` — Added to dependencies: `newrelic@^12.0.0`, `@pothos/tracing-newrelic@^0.1.0`; Added to devDependencies: `@types/newrelic@^9.0.0`

## Files NOT Modified
- No other files needed modification for this task

## Verification
- `bun install` succeeded (88 packages installed)
- Resolved versions: `newrelic@12.25.1`, `@pothos/tracing-newrelic@0.1.1`, `@types/newrelic@9.14.8`

## Carry-Forward Knowledge
- `@pothos/tracing-newrelic` imports `newrelic` at its top level — this is why conditional `require()` is needed in `gqlSchemaBuilder.ts`
- `@types/newrelic` does NOT expose the internal `agent` property — a type guard is needed in `newrelic-agent.ts`
- The `newrelic` package is large (~88 packages installed) — `outputFileTracingIncludes` in `next.config.ts` is critical for Vercel
