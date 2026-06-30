---
applyTo: "backend/**/*.ts"
---

# Backend Rules

## Layer Separation

- Business logic lives in services only — repos are data-access only, resolvers delegate to services
- Services are domain-driven (e.g., `PermissionsService`), never monolithic
- Server Components call services directly, not GraphQL
- Services must not rely on GraphQL-specific contexts unless passed explicitly

## Type Imports

- ALL types from `@/backend/types` — never create local type definitions in Pothos files
- Single canonical GraphQL object type per entity (no ad-hoc `{Entity}Definition` types)
- Naming: `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`
- Foundations use Drizzle `$inferSelect` / `$inferInsert`

## Logging

- NEVER use `console.*` — ESLint will error
- Use `import { logger } from '@//backend/lib/logger'`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`

## i18n / Localized Errors

- All user-facing error messages must use `next-intl` via `getBackendTranslations`
- Accept optional `locale?: string` parameter in services/repositories
- Never hardcode error strings

## Database Access

- Drizzle ORM only for all PostgreSQL access
- When `findMany` with complex relations causes type errors, use `.select().from().leftJoin()` or manual ID-based mapping
- Conditional aggregation: use `sql<number>` template with `.mapWith(Number)`, not raw DB casts

## Type Definition Pattern

- Define types in `backend/types/{entity}.types.ts`
- Use `Omit` to exclude forbidden fields (e.g., `deletedAt`)
- Add resolved/joined properties as optional fields on `{Entity}ReturnType`
