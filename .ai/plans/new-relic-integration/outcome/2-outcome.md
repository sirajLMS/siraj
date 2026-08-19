# Task 2: Create `newrelic.cjs` Config File

## Summary
Created `newrelic.cjs` at project root with all required New Relic agent settings.

## Files Created
- `newrelic.cjs` — CommonJS config file (agent loads config via `require()`, TypeScript not supported)

## Config Settings
- `app_name`: `NEW_RELIC_APP_NAME` env var (Vercel overrides)
- `license_key`: `NEW_RELIC_LICENSE_KEY` env var
- `opentelemetry.enabled`: `true` (Hybrid Agent mode)
- `instrumentation.http.enabled`: `false` (Next.js provides native OTel)
- `instrumentation.next.enabled`: `false` (avoid double instrumentation)
- `instrumentation.undici.enabled`: `false` (avoid conflicts with Next.js fetch)
- `logging.level`: `info`
- `distributed_tracing.enabled`: `true`

## Verification
- `.cjs` files are NOT linted by project ESLint config (only `.ts`/`.tsx` files are)
- ESLint `no-undef` on `exports` is expected for CommonJS — not a real error

## Carry-Forward Knowledge
- Config file MUST be `.cjs` — agent loads config via `require()`, TypeScript not supported
- On Vercel, environment variables override this file at runtime
- OTel must be enabled for Hybrid Agent mode (intercepts Next.js native OTel spans)
- http/next/undici instrumentation must be disabled to avoid double instrumentation
