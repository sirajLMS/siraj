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
└── utils/               repo-internal helpers (e.g. resolve-localized)
```

Each sub-directory (except `scheduling/` and `utils/` which pre-date this refactor and have their own internal barrels) contains its own `index.ts` barrel that re-exports every `*.repository.ts` file in that sub-directory. The top-level `backend/db/repo/index.ts` re-exports every sub-directory barrel.

## Rules

- **Drizzle ORM**: This layer exclusively uses Drizzle ORM for PostgreSQL.
- **Query Guidelines**: When `findMany` with complex relations creates `SQL<unknown>` errors or TypeScript property missing errors, revert to standard `.select().from().leftJoin()` or manual ID-based mapping. This is the required pattern for this environment to avoid type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Repositories must not contain hardcoded user-facing error strings, messages, or warnings. Instead, use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter) to look up localized message templates. The legacy `getBackendTranslations` helper is deprecated and must not be used.
- **Conditional Aggregation**: When performing conditional aggregation (e.g., `CASE WHEN` with `SUM`/`COUNT`), Drizzle does not provide a native query builder DSL. Instead, use the `sql` template literal with generic typing (e.g., `sql<number>`) and chain `.mapWith(Number)` to cast returned values safely to JavaScript numbers. Avoid raw database-specific casts (like `CAST(... AS INTEGER)`) in SQL.
- **Type Definition Pattern**: Repository functions should use types defined in `backend/types/` (e.g., `{Entity}SelectType`, `{Entity}InsertType`) rather than directly referencing schema types. Define input/output types in the corresponding `backend/types/<subdir>/<entity>.types.ts` files using Drizzle's `$inferSelect` and `$inferInsert` types with custom transformations as needed.

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
