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
| permissions | 1 | done |
| audit | 1 | done |
| auth (impersonation) | 1 | done |
| appearance | 1 | done |
| parents | 1 | done |
| students | 1 | done |
| books | 1 | done |
| communications | 1 | done |
| cron | 1 | done |
| whatsapp | 1 | done |
| teachers | 6 | done |
| classes | 6 | done |
| meeting | 5 (+2 __shared__) | done |
| storage | 3 (+1 __shared__) | done |
| billing | 10 | done |

## Verification gates

- After each domain: DB_PROVIDER=postgres bunx tsc --noEmit shows no NEW error categories beyond the pre-existing extras-callback noise.
- grep -rlE from "drizzle-orm/pg-core" backend/db/schema/<domain>/ returns empty (fully ported).
- End-state: DB_PROVIDER=sqlite bunx drizzle-kit generate --config=drizzle.config.sqlite.ts succeeds (currently fails: colBuilder.buildExtraConfigColumn is not a function, due to mixed pg/sqlite objects in the schema barrel).
- PG regression: DB_PROVIDER=postgres bunx drizzle-kit generate --config=drizzle.config.ts still succeeds.
