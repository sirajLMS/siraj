# Task 6: Modify `backend/graphql/gqlSchemaBuilder.ts` — Pothos Tracing Integration

## Summary
Integrated `@pothos/tracing-newrelic` into the Pothos schema builder's tracing plugin, gated by `NODE_ENV === "production"`.

## Files Modified
- `backend/graphql/gqlSchemaBuilder.ts` — Modified `tracing.wrap` function

## Implementation Details
- **LOCKED APPROACH**: Conditional `require("@pothos/tracing-newrelic")` gated by `process.env.NODE_ENV === "production"`
- NOT dynamic `import()` — the Pothos builder is synchronous, `require()` is the only synchronous way
- NOT static `import` — would load `newrelic` at module evaluation time in dev/test (violates AC-6)
- In production: `createNewrelicWrapper({ includeArgs: true, includeSource: true })` wraps resolvers
- In dev/test: existing `wrapResolver` duration logging is used as fallback
- ESLint disable comment: `// eslint-disable-next-line @typescript-eslint/no-require-imports` — the ONE exception allowed by the plan, gated by NODE_ENV

## Why Conditional `require()` (Not `import()`)
1. `@pothos/tracing-newrelic` does `import newrelic from 'newrelic'` at its top level
2. A static `import` in `gqlSchemaBuilder.ts` would load `newrelic` in dev/test — violates AC-6
3. Dynamic `import()` is async — but `tracing.wrap` must return a resolver synchronously
4. `require()` is synchronous AND only executes when the `if` branch is taken (production only)
5. The `NODE_ENV` gate guarantees `newrelic` is never evaluated in dev/test

## Verification
- ✅ tsgo passed
- ✅ oxlint passed
- ✅ biome:check passed
- ✅ lint:type-aware passed
- ✅ check:duplicates passed
- ✅ codescene passed

## Carry-Forward Knowledge
- `createNewrelicWrapper()` RETURNS a wrap function — must call it with options, then invoke the returned function with `(resolver, _options, config)`
- `includeArgs: true` — resolver arguments attached as span attributes (sensitive fields should use `tracing: false`)
- `includeSource: true` — GraphQL field source AST attached as span attribute
- The `wrapResolver` import from `@pothos/plugin-tracing` stays — used in dev/test fallback path
- The ESLint disable comment is the ONLY exception in the codebase for `no-require-imports`
