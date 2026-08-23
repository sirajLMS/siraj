# SQLite (libsql) Drizzle Migration - Progress

Multi-dialect (libsql/SQLite + PostgreSQL) migration of backend/db/schema/* from raw drizzle-orm/pg-core to the dialect-aware builders in __shared__/dialectAwareBuilder.ts (type-erasure via never).

## Strategy

Each schema file replaces pgTable/pg-* with createTable/*Column helpers. The helper branches on isSqlite(): PG branch returns the real PG column (provides TS type); SQLite branch returns the sqlite column cast as never (runtime-correct, type-erased). Enums (enums.ts) are already dialect-aware via createPgEnumFromEnum -> createEnum.

## Status

| Domain | Files | Status |
|--------|-------|--------|
| __shared__ (builder) | 2 | done (Phase 1a) + serialColumn added (Phase 1b) |
| custom-types | 1 | done (re-exports encryptedText) |
| enums | 1 | done (createPgEnumFromEnum -> createEnum) |
| users | 1 | done (Phase 1a reference) |
| shared (cache/settings/timezones) | 3 | done (Phase 1b) |
| permissions | 1 | pending |
| audit | 1 | pending |
| auth (impersonation) | 1 | pending |
| appearance | 1 | pending |
| parents | 1 | pending |
| students | 1 | pending |
| books | 1 | pending |
| communications | 1 | pending |
| cron | 1 | pending |
| whatsapp | 1 | pending |
| teachers | 6 | pending |
| classes | 6 | pending |
| meeting | 5 (+2 __shared__) | pending |
| storage | 3 (+1 __shared__) | pending |
| billing | 10 | pending |

## Verification gates

- After each domain: DB_PROVIDER=postgres bunx tsc --noEmit shows no NEW error categories beyond the pre-existing extras-callback noise.
- grep -rlE from "drizzle-orm/pg-core" backend/db/schema/<domain>/ returns empty (fully ported).
- End-state: DB_PROVIDER=sqlite bunx drizzle-kit generate --config=drizzle.config.sqlite.ts succeeds (currently fails: colBuilder.buildExtraConfigColumn is not a function, due to mixed pg/sqlite objects in the schema barrel).
- PG regression: DB_PROVIDER=postgres bunx drizzle-kit generate --config=drizzle.config.ts still succeeds.
