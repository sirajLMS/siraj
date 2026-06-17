# Backend Database Repository Layer Rules

- **Drizzle ORM**: This layer exclusively uses Drizzle ORM for PostgreSQL.
- **Query Guidelines**: When `findMany` with complex relations creates `SQL<unknown>` errors or TypeScript property missing errors, revert to standard `.select().from().leftJoin()` or manual ID-based mapping. This is the required pattern for this environment to avoid type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Repositories must not contain hardcoded user-facing error strings, messages, or warnings. Instead, use the next-intl library (via the backend translation helper `getBackendTranslations`), optionally accepting a `locale?: string` parameter to look up localized message templates.

