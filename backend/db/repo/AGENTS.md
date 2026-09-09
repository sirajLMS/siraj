# Backend Database Repository Layer

## Purpose

This directory contains Drizzle ORM repository classes — the **only** layer that touches the database directly. Each `.repository.ts` file exposes a `namespace` of pure data-access functions (no business logic, no permission checks). Files are grouped by domain, mirroring the `backend/graphql/`, `backend/types/`, and `backend/enum/` sub-directory layouts.

## Layout

```
backend/db/repo/
├── index.ts             (top-level barrel — re-exports every sub-directory)
├── AGENTS.md            (this file)
│
├── shared/              cross-cutting infra: cache, ratelimit, session, signedUrl, soft-delete, system-settings
├── audit/               audit trail
├── auth/                impersonation (auth-related)
├── users/               user
├── permissions/         permission-management
├── billing/             billing
├── books/               book, report
├── classes/             class-category, class-performance, class-subject, group-class, dst-migration, subject-resource
├── scheduling/          scheduling (nested sub-package, pre-existing — has its own internal layout)
├── parents/             parent, suggestion
├── students/            student, student-history
├── teachers/            teacher, teacher-availability, teacher-banking, teacher-notes, staff-profile
├── notifications/       notification, notification-preferences
├── complaints/          complaint, complaint-response
├── storage/             storage, learning-resource
└── utils/               repo-internal helpers
```

Each sub-directory (except `scheduling/` and `utils/` which pre-date this refactor and have their own internal barrels) contains its own `index.ts` barrel that re-exports every `*.repository.ts` file in that sub-directory. The top-level `backend/db/repo/index.ts` re-exports every sub-directory barrel.

## Rules

- **Neon HTTP Client for Bare Reads (CRITICAL)**: All non-transactional read methods in database repositories MUST use `queryDb(tx)` from `@/backend/db`. When Neon HTTP mode is eligible, reads execute statelessly over HTTP POST; when `tx` is passed or HTTP mode is disabled, it falls back seamlessly to transaction/TCP handles. See `docs/drizzle/neon-http-client.md` for complete architecture, rules, and examples.
- **Prepared Statements (CRITICAL)**: Simple read-only repository methods that execute on TCP mode may use Drizzle Prepared Statements 2.0 (`sql.placeholder(...)`) defined at module level. Module-level prepared statements MUST be removed if replaced by `queryDb(tx)` on non-tx read branches. See `docs/drizzle/prepared-statements.md` for the complete pattern reference.
- **`inArray` + Prepared Statements PROHIBITED**: Queries using `inArray(column, sql.placeholder("ids"))` MUST NOT use prepared statements. PostgreSQL's prepared statement protocol treats `$1` as a single scalar — it cannot expand array parameters for `IN` clauses. Use dynamic queries (`db.select()...where(inArray(col, ids))`) instead. This is a PostgreSQL protocol limitation, not a Drizzle bug.
- **Batch Lookup Methods for DataLoader**: Repositories that support GraphQL DataLoader batching MUST expose batch lookup methods (e.g., `findByUserIds(userIds: string[], tx?)`) returning `Map<string, T | null>`. Use `inArray(column, ids)` with a plain array (NOT `sql.placeholder`). Pre-initialize the map with all requested keys mapped to `null`, then fill in matches from query results. See `docs/graphql/dataloader-batching.md`.
- **Query Guidelines**: When `findMany` with complex relations creates `SQL<unknown>` errors or TypeScript property missing errors, revert to standard `.select().from().leftJoin()` or manual ID-based mapping. This is the required pattern for this environment to avoid type resolution issues.
- **Version Self-Increment (Optimistic Locking)**: Versioned update methods MUST self-increment the `version` column inside the same guarded `UPDATE` (`SET version = version + 1 ... WHERE id = ? AND version = ?`) — a version column that never increments makes the optimistic lock inert.
- **Batch Lock Reads (`getByIdsForUpdate`)**: `FOR UPDATE` batch lookups MUST sort the id array before querying and `ORDER BY id` (deterministic lock order = deadlock avoidance), require a `tx` argument (a lock outside a transaction is meaningless), and apply the same soft-delete exclusion (`isNull(deletedAt)`) as every other read path in the module.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Repositories must not contain hardcoded user-facing error strings, messages, or warnings. Instead, use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter) to look up localized message templates. The legacy `getBackendTranslations` helper is deprecated and must not be used.
- **Conditional Aggregation**: When performing conditional aggregation (e.g., `CASE WHEN` with `SUM`/`COUNT`), Drizzle does not provide a native query builder DSL. Instead, use the `sql` template literal with generic typing (e.g., `sql<number>`) and chain `.mapWith(Number)` to cast returned values safely to JavaScript numbers. Avoid raw database-specific casts (like `CAST(... AS INTEGER)`) in SQL.
- **Type Definition Pattern**: Repository functions should use types defined in `backend/types/` (e.g., `{Entity}SelectType`, `{Entity}InsertType`) rather than directly referencing schema types. Define input/output types in the corresponding `backend/types/<subdir>/<entity>.types.ts` files using Drizzle's `$inferSelect` and `$inferInsert` types with custom transformations as needed.
- **Directory Role Filtering**: `resolveRoleCondition` in `staff-profile.repository.ts` maps `roleFilter` values to `ilike` patterns on `permission_groups.slug`. `"admin"` and `"manager"` both match `%admin%`; `"supervisor"` matches `%supervisor%`. See `docs/auth/manager-role-mapping.md`.

### Import Convention
- Consumers of repositories import from the top-level barrel: `import { TeacherRepository } from "@/backend/db/repo";` or via the `Repository` namespace. This keeps move/refactor churn contained to the barrel.
- Deep imports (`@/backend/db/repo/teachers/teacher.repository`) are also valid for cases that need a specific repo and want to avoid pulling in transitive side-effects; the top-level barrel is the recommended entry point.
- Within a `.repository.ts` file, use `@/` aliases for cross-layer dependencies (types, schema, sibling repositories) — relative imports only for siblings in the same sub-directory.

### File Organization
- Group related repositories for the same domain in the same sub-directory.
- File naming: `backend/db/repo/<subdir>/<entity>.repository.ts` (e.g. `backend/db/repo/teachers/teacher.repository.ts`).
- One `namespace` per repository file — the namespace name is the canonical export `{Entity}Repository`.
- Pre-existing nested sub-packages (`scheduling/scheduling-queries.repository/`, `utils/`) keep their internal structure; only the top-level `scheduling/index.ts` barrel is re-exported here.

### Adding New Repositories
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<entity>.repository.ts` in that sub-directory; expose a `export namespace <Entity>Repository { ... }`.
3. Add `export * from "./<entity>.repository";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add the sub-directory re-export to the top-level `backend/db/repo/index.ts`.
5. Wired types live in `backend/types/<subdir>/<entity>.types.ts`; wired GraphQL exposure lives in `backend/graphql/pothos/<subdir>/`.

## Important References

- `docs/drizzle/neon-http-client.md` - Neon HTTP Client & Provider-Agnostic Stateless Queries reference
- `docs/drizzle/prepared-statements.md` - Drizzle Prepared Statements 2.0 pattern reference
- `docs/graphql/dataloader-batching.md` - Pothos DataLoader batching pattern reference
- `docs/services/meeting-providers.md` - Meeting provider adapter/factory pattern reference
- `docs/billing/quota-system.md` - Quota System architecture reference
- `docs/backend/billing-repo-factory.md` - Billing repo factory with configurable hooks pattern reference
- `docs/backend/schema-helpers.md` - Schema column and junction table helpers pattern reference
- `docs/backend/whatsapp-configuration.md` - WhatsApp singleton-config repository pattern (transaction-scoped advisory lock + FOR UPDATE upsert)
- `docs/quality/linting-rules.md` - Oxlint & ESLint/sonarjs fix recipes


## Billing Repository Factory (Duplication Elimination)

Billing repositories (supported-online-accounts, supported-mobile-wallets, supported-payment-links) share identical CRUD/list/deactivate/query structure. Use `makeBillingRepo<TRow, TSelect, TInsert, TUpdate, TFilters>()` from `__shared__/billingRepoFactory.ts`. Entity-specific insert defaults (e.g., `identifierLabel ?? name`) go in the `prepareInsert` hook — NOT in the factory. See `docs/backend/billing-repo-factory.md` for the complete pattern reference.

## Schema Helpers (Duplication Elimination)

Schema tables sharing identical column configurations (timestamps, slugs, active flags) or junction table patterns use helpers from `__shared__/columnHelpers.ts` and `__shared__/junctionTableHelper.ts`. See `docs/backend/schema-helpers.md` for the complete pattern reference.

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.

