# Task 5: Modify `next.config.ts` — Add `outputFileTracingIncludes`

## Summary
Added `outputFileTracingIncludes` to `next.config.ts` to ensure the full `newrelic` package is traced into Vercel serverless function bundles.

## Files Modified
- `next.config.ts` — Added `outputFileTracingIncludes: { "/*": ["./node_modules/newrelic/**/*"] }`

## Implementation Details
- Property added after `serverExternalPackages` and before `turbopack`
- The glob pattern `"/*"` applies to all routes
- The include pattern `"./node_modules/newrelic/**/*"` ensures all newrelic files are traced
- Without this, `@vercel/nft` may tree-shake parts of the agent that are dynamically loaded

## Verification
- ✅ tsgo passed
- ✅ oxlint passed
- ✅ biome:check passed
- ✅ lint:type-aware passed
- ✅ check:duplicates passed
- ✅ codescene passed

## Carry-Forward Knowledge
- `outputFileTracingIncludes` is required for any package that uses dynamic loading patterns
- The `newrelic` package dynamically loads instrumentation modules — tree-shaking would break it
- This setting has no effect in dev/test (only affects production builds)
- The glob pattern `"/*"` is the catch-all for all routes in Next.js
