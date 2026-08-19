# Task 7: Create `docs/observability/new-relic-integration.md`

## Summary
Created canonical reference document for the New Relic APM integration.

## Files Created
- `docs/observability/new-relic-integration.md` — 103 lines

## Sections
- Overview (Hybrid Agent architecture, production-only, GraphQL tracing)
- Architecture (component flow, all files involved)
- Configuration (env vars table, config file settings)
- Agent Loading Flow (step-by-step from instrumentation.ts)
- GraphQL Resolver Tracing (require() vs import() rationale)
- Vercel Deployment (outputFileTracingIncludes)
- Zero Dev/Test Overhead
- Troubleshooting

## Verification
- ✅ tsgo passed
- oxlint skipped (expected for .md files)
- No fixes needed

## Carry-Forward Knowledge
- Documentation files don't need oxlint/biome verification (they skip non-code files)
- The doc serves as the canonical reference for future New Relic-related work
