# Backend Database Repository Layer

## Purpose

This directory contains Drizzle ORM repository classes — the **only** layer that touches the database directly. Each `.repository.ts` file exposes a `namespace` of pure data-access functions (no business logic, no permission checks). Files are grouped by domain sub-directory, mirroring the `backend/graphql/`, `backend/types/`, and `backend/enum/` layouts. Each sub-directory contains its own `index.ts` barrel re-exporting its `*.repository.ts` files; the top-level `backend/db/repo/index.ts` re-exports every sub-directory barrel. Pre-existing nested sub-packages (e.g. `scheduling/`, `utils/`) keep their own internal structure.

## Rules

- **Neon HTTP Client for Bare Reads (CRITICAL)**: All non-transactional read methods in database repositories MUST use `queryDb(tx)` from `@/backend/db`. When Neon HTTP mode is eligible, reads execute statelessly over HTTP POST; when `tx` is passed or HTTP mode is disabled, it falls back seamlessly to transaction/TCP handles.
- **Prepared Statements (CRITICAL)**: Simple read-only repository methods that execute on TCP mode may use Drizzle Prepared Statements 2.0 (`sql.placeholder(...)`) defined at module level. Module-level prepared statements MUST be removed if replaced by `queryDb(tx)` on non-tx read branches.
- **`inArray` + Prepared Statements PROHIBITED**: Queries using `inArray(column, sql.placeholder("ids"))` MUST NOT use prepared statements. PostgreSQL's prepared statement protocol treats `$1` as a single scalar — it cannot expand array parameters for `IN` clauses. Use dynamic queries (`db.select()...where(inArray(col, ids))`) instead. This is a PostgreSQL protocol limitation, not a Drizzle bug.
- **Batch Lookup Methods for DataLoader**: Repositories that support GraphQL DataLoader batching MUST expose batch lookup methods (e.g., `findByUserIds(userIds: string[], tx?)`) returning `Map<string, T | null>`. Use `inArray(column, ids)` with a plain array (NOT `sql.placeholder`). Pre-initialize the map with all requested keys mapped to `null`, then fill in matches from query results.
- **Query Guidelines**: When `findMany` with complex relations creates `SQL<unknown>` errors or TypeScript property missing errors, revert to standard `.select().from().leftJoin()` or manual ID-based mapping. This is the required pattern for this environment to avoid type resolution issues.
- **Version Self-Increment (Optimistic Locking)**: Versioned update methods MUST self-increment the `version` column inside the same guarded `UPDATE` (`SET version = version + 1 ... WHERE id = ? AND version = ?`) — a version column that never increments makes the optimistic lock inert.
- **Batch Lock Reads (`getByIdsForUpdate`)**: `FOR UPDATE` batch lookups MUST sort the id array before querying and `ORDER BY id` (deterministic lock order = deadlock avoidance), require a `tx` argument (a lock outside a transaction is meaningless), and apply the same soft-delete exclusion (`isNull(deletedAt)`) as every other read path in the module.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Repositories must not contain hardcoded user-facing error strings, messages, or warnings. Instead, use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter) to look up localized message templates. The legacy `getBackendTranslations` helper is deprecated and must not be used.
- **Conditional Aggregation**: When performing conditional aggregation (e.g., `CASE WHEN` with `SUM`/`COUNT`), Drizzle does not provide a native query builder DSL. Instead, use the `sql` template literal with generic typing (e.g., `sql<number>`) and chain `.mapWith(Number)` to cast returned values safely to JavaScript numbers. Avoid raw database-specific casts (like `CAST(... AS INTEGER)`) in SQL.
- **Type Definition Pattern**: Repository functions should use types defined in `backend/types/` (e.g., `{Entity}SelectType`, `{Entity}InsertType`) rather than directly referencing schema types. Define input/output types in the corresponding `backend/types/<subdir>/<entity>.types.ts` files using Drizzle's `$inferSelect` and `$inferInsert` types with custom transformations as needed.
- **Shared Schema/Repo Helpers**: Tables sharing identical column configurations (timestamps, slugs, active flags) or junction table patterns must reuse the helpers under `__shared__/` rather than duplicating the definitions.
- **Never `oxlint-disable`**: Never add oxlint suppression comments — fix the root cause of lint warnings instead.

### Import Convention
- Consumers of repositories import from the top-level barrel: `import { TeacherRepository } from "@/backend/db/repo";` or via the `Repository` namespace. This keeps move/refactor churn contained to the barrel.
- Deep imports (`@/backend/db/repo/teachers/teacher.repository`) are also valid for cases that need a specific repo and want to avoid pulling in transitive side-effects; the top-level barrel is the recommended entry point.
- Within a `.repository.ts` file, use `@/` aliases for cross-layer dependencies (types, schema, sibling repositories) — relative imports only for siblings in the same sub-directory.

### File Organization
- Group related repositories for the same domain in the same sub-directory.
- File naming: `backend/db/repo/<subdir>/<entity>.repository.ts` (e.g. `backend/db/repo/teachers/teacher.repository.ts`).
- One `namespace` per repository file — the namespace name is the canonical export `{Entity}Repository`.

### Adding New Repositories
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<entity>.repository.ts` in that sub-directory; expose a `export namespace <Entity>Repository { ... }`.
3. Add `export * from "./<entity>.repository";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add the sub-directory re-export to the top-level `backend/db/repo/index.ts`.
5. Wired types live in `backend/types/<subdir>/<entity>.types.ts`; wired GraphQL exposure lives in `backend/graphql/pothos/<subdir>/`.
