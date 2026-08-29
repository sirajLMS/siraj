# Database Availability: Fail-Fast + Full-Screen Error Page

## Problem

When PostgreSQL is unreachable (container down, hung Docker network, stalled
Neon endpoint), page loads used to wait on sockets with **no timeouts** until
the OS killed the connection (`ECONNRESET`) — minutes of white screen, then
Next.js' default unthemed error UI.

## Solution Layers

### 1. Pool timeouts (fail fast)

`backend/db/factory.ts` configures both pool types (`pg.Pool`,
`@neondatabase/serverless` Pool) with:

- `connectionTimeoutMillis: 5_000` — bounds connection acquisition (the
  dominant outage mode; still comfortable for Neon cold-start wakeups of a
  few hundred ms).
- `query_timeout: 30_000` — bounds a hung in-flight query without breaking
  legitimately slow report queries.

The Neon HTTP path (`backend/db/http-client.ts`) sets
`neonConfig.fetchFunction` once with a per-request `AbortSignal.timeout(8s)`
(a single shared signal would abort all later queries after firing — a fresh
signal per request is required).

### 2. `DatabaseUnavailableError`

`backend/lib/errors.ts` — a `DomainError` subclass with
`extensions.code = "DATABASE_UNAVAILABLE"` and a `digest` sentinel
(`DATABASE_UNAVAILABLE_DIGEST` from `@/shared/constants`). The digest is the
only property that survives Next.js production error serialization into
client error boundaries.

`toDatabaseUnavailableError()` in `backend/lib/retry.ts` classifies rejected
operations: transient driver/network errors (`ECONNRESET`, `ETIMEDOUT`,
`ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`, "connection terminated", …) become
`DatabaseUnavailableError` (original kept as `cause`); anything else returns
`null` so callers surface the original error unchanged. `isTransientError()`
now also recurses into `error.cause` (depth-capped), so driver wrappers like
`DrizzleQueryError` are classified by their real socket-level failure — this
keeps existing `retryTransient` / `failOpen` call sites working when the error
no longer arrives as a bare `ECONNRESET`.

### 3. Pool-level translation (no implicit retry)

`applyFailFastResilience()` in `backend/db/factory.ts` wraps `pool.query` so
every caller (RSC pages, GraphQL resolvers) sees `DatabaseUnavailableError`
on transient failures with zero per-callsite work. Transaction paths
(`pool.connect`) are bounded by `connectionTimeoutMillis` instead. Deliberately **no automatic retry** at this layer: query
idempotency is unknowable here, so retry policy stays at explicit call sites
(`retryTransient`, e.g. the login flow). Callback-style legacy `query()`
invocations pass through untouched.

### 4. Root error boundaries (UI)

- `app/error.tsx` — catches errors from all route-group layouts/pages
  (including `(dashboard)/layout.tsx`). Renders `FullScreenErrorView` inside
  the root layout: theme (dark/light), direction (RTL/LTR) and translations
  stay intact, but the dashboard chrome (header/sidebar) is not rendered.
  The database-unavailable variant is selected by a reachability probe of
  `GET /api/health/db` — the authoritative signal, because driver layers
  (Drizzle re-wraps pool errors in `DrizzleQueryError`) make error identity
  unreliable across layers. The `DATABASE_UNAVAILABLE` digest sentinel
  serves as a zero-latency fast path when it survives serialization.
  Anything else gets confidential generic copy.
  Uses Next.js 16's `retry()` prop (re-fetches + re-renders the segment at
  the same URL — retrying lands the user back on the page they originally
  requested).
- `frontend/common/views/errors/FullScreenErrorView.tsx` — the shared
  full-screen view. The database variant auto-retries by polling
  `GET /api/health/db` on a backoff schedule (5s → 10s → 20s → 30s cap) and
  calls `retry()` as soon as the probe answers 200.
- `app/global-error.tsx` — last-resort boundary for root-layout failures.
  Own `<html>/<body>`, no providers, tiny inline en/ar copy map. Intentionally
  minimal.

### 5. Health probe

`app/api/health/db/route.ts` — `GET` runs `SELECT 1` via `queryDb()` with a
3s race timeout; 200 `{status:"ok"}` / 503 `{status:"unavailable"}`,
`Cache-Control: no-store`, no auth, no sensitive payload. Consumed by the
auto-retry loop; usable for uptime monitors.

## Operational Notes

- Worst-case per-query latency during an outage is bounded (~5s connect +
  ~30s in-flight), and pages fail visibly instead of hanging.
- GraphQL consumers see `errors[].extensions.code === "DATABASE_UNAVAILABLE"`
  via the standard DomainError channel (`docs/graphql/domain-error-extensions-code.md`).
- The Neon HTTP path (`queryDb()` bare reads on Vercel) has the fetch timeout;
  transient failures there classify through `cause` unwrapping for retries,
  and the error page detects the outage via the health probe either way.
- Neon cold starts are transient: the pool retries a waking compute implicitly
  through short connect timeouts + the page-level auto-retry loop.

## Tests

- `backend/lib/test/db-unavailable.test.ts` — error class + classification.
- `test/ui/components/errors/FullScreenErrorView.test.tsx` — both variants,
  retry behavior, confidential-copy guarantee.

## Related

- `docs/backend/login-cold-start-resilience.md` — login-flow transient
  handling (`retryTransient`, `SERVICE_UNAVAILABLE`); unchanged by this work.
- `docs/backend/serverless-cold-start-optimization.md` — singletons, pre-warm.
