# Backend Service Layer Rules

- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern (e.g., `PermissionsService`, `ScheduleService`).
- **NO Monolithic Services**: Do not create generic, monolithic services (like a single `DashboardService` handling everything).
- **Business Logic Hub**: This layer should contain all business rules, orchestration, and complex permission gating before calling the repository layer.
- **Single-Orchestrator Write Pattern**: When one user action writes multiple related rows, ONE service method owns the entire transaction (advisory locks, in-tx re-validation, idempotency keys, post-commit notifications) — never split the write across services.
- **Replay Pre-Check Ordering (idempotent transactions)**: Inside a locked idempotent transaction, the idempotency replay pre-check must run immediately after acquiring the lock, BEFORE any state-dependent guards (existence, balance, sufficiency). A replay must return the originally persisted row even when the state that guarded the first write has since moved; running guards first makes legitimate retries throw.
- **SSR Usage**: Services can be used directly by Next.js Server Components (SSR) or Server Actions, so they must not rely on GraphQL-specific contexts unless passed explicitly.
- **i18n / Localized Error Messages**: All user-facing error messages, alerts, and feedback generated in services must use the compile-time TypeScript translation system via `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter). Hardcoded strings for exceptions or responses are forbidden. The legacy `getBackendTranslations` helper from `@/backend/lib/intl` is deprecated and must not be used.
- **Type Definition Pattern**: Services should import and use types from `backend/types/` (e.g., `{Entity}ReturnType`, `{Entity}SubmitInput`, `DBTransaction`) rather than creating ad-hoc type definitions or directly referencing schema types. These types should be imported from `@/backend/types` and used for function parameters, return types, and data transformations.
- **Service-layer `.types.ts` files are prohibited.** All types live in `backend/types/`. If a service file contains both types and runtime code, split: types → `backend/types/`, runtime → stays in the service layer with a non-`.types` filename (e.g., `.helpers.ts`, `.constants.ts`).
- **Batch Service Methods for DataLoader**: Services that are called from GraphQL field resolvers MUST expose batch versions of single-entity lookup methods to support Pothos DataLoader batching. Batch methods accept `ids: string[]` (or equivalent key arrays) and return `Map<string, T | null>`.
- **Shared Helpers / Duplication**: When multiple service files share identical helper functions (auth preludes, config upserts, insert payload builders, session creators), extract them into `__shared__/` modules (or a shared base class) rather than duplicating them.
- **Resolver-driven callers**: Services that receive permission checks from the GraphQL layer MUST accept the caller's permission context as a parameter instead of re-querying permissions from within the service.

## Seed services (`backend/services/seed/`)

- **Not production domain services.** Modules here provision demo/seed data and test fixtures. They must never be imported from GraphQL resolvers, API routes, or production request handlers.
- **Naming:** `*SeedService` namespaces with `seed*` write methods.
- **Production safety:** All writes must go through the seed bootstrap gate (`assertSeedWriteAllowed()`) so they are blocked on real production and allowed only in local dev and CI test servers.

## Testing (`backend/services/**/*.test.ts`)

Service tests live next to the code they cover (`*.test.ts` or `test/` subdirectories). Run via `bun run test:services`.

### No real external APIs (mandatory)

Service tests **must never** make real network calls to third-party providers (email, SMS, push, comms channels, caches, external data feeds, etc.). Mock or spy on outbound integrations (`spyOn` on the service/dispatch entry points, or mock the channel facades/adapters) before exercising the service under test.

If a test needs to confirm a live provider is wired, add a **single smoke** under `test/integration/` and run `bun run test:integration` — not here.

### Provider integration tests belong in `test/integration/`

**Do NOT add `*.integration.test.ts` or live external-API smokes under `backend/services/`** (including subdirectories). Live provider smokes belong in `test/integration/<domain>/`, are run with `bun run test:integration` (and the domain-specific live-test scripts), and each integration file gets **one** smoke test (single API call) to confirm the adapter reaches the live provider — not full service or app behaviour.

## Transactions & Concurrency (CRITICAL)

- When a service method accepts a caller transaction (`tx`), it MUST skip acquiring its own advisory locks (`advisoryLock: tx == null` pattern) — a callee acquiring locks inside a caller that already holds locks deadlocks (ABBA).
- Cross-table row locks taken by mutually-racing code paths MUST follow a single canonical lock order; mismatched ordering deadlocks (PG 40P01).
- Idempotency keys derived from user free text MUST hash the RAW input while persisting the SANITIZED value.
