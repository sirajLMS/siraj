---
applyTo: "backend/**/*.ts"
---

# Backend Rules

### Architecture & Layer Separation

- 6-layer data flow: Schema -> Types -> Repo -> Service -> GraphQL -> Test
- Schema (`backend/db/schema/`): Drizzle table definitions + enums
- Types (`backend/types/`): canonical type definitions per entity
- Repo (`backend/db/repo/`): data-access ONLY - no business logic, no permission checks, no hardcoded error strings
- Service (`backend/services/`): business logic, permissions, data transformations, orchestrates repos
- GraphQL (`backend/graphql/pothos/`): resolvers delegate to services (NEVER repos), propagate `ctx.locale`
- Test (`backend/db/test/`): `repo/` = 100% coverage of individual methods, `logic/` = multi-entity workflows
- Server Components call services directly (not GraphQL) - services must not rely on GraphQL-specific contexts
- Domain-driven services (e.g., `PermissionsService`, `ScheduleService`) - no monolithic services like `DashboardService`

### Type Definition Pattern (CRITICAL)

- ALL types from `@/backend/types` - NEVER local definitions in Pothos files
- Import with `@/backend/types` alias, never relative paths (`../../types/...`)
- Foundation types from Drizzle:
  ```ts
  export type {Entity}SelectType = typeof {entityTable}.$inferSelect;
  export type {Entity}InsertType = typeof {entityTable}.$inferInsert;
  ```
- ReturnType pattern - Omit forbidden fields, re-apply enums, add resolved optionals:
  ```ts
  export type {Entity}ReturnType = Omit<{Entity}SelectType,
    | "deletedAt"
    | "internalNotes"
  > & {
    status: StatusEnum;          // re-apply proper enum type
    role: RoleEnum;               // re-apply proper enum type
    resolvedProperty?: string;    // joined/computed fields
  };
  ```
- Input type: `{Entity}SubmitInput` for mutation/filter inputs
- NEVER create local types in Pothos files: `{Entity}Definition`, `<Entity>SimpleDefinition`
- Single canonical GraphQL object type per entity - clients select fields they need
- Types must be compatible with Pothos object implementations
- Update `backend/types/index.ts` when adding new entity types
- Frontend stores must not redefine types that exist in GraphQL generated types

### Pothos / GraphQL

- `nullable: true` REQUIRED for nullable TypeScript types (Pothos defaults non-nullable)
- Object ref always uses ReturnType:
  ```ts
  import type { EntityReturnType } from "@/backend/types";
  const {Entity}Ref = gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>");
  export const {Entity}PothosObject = {Entity}Ref.implement({
    fields: t => ({
      id: t.exposeString("id"),
      name: t.exposeString("name"),
    }),
  });
  ```
- Input types from `backend/types/` (e.g., `{Entity}SubmitInput`)
- Exception: input types and collection wrapper types (paginated results) allowed as separate definitions
- Complex computed/derived types that don't map to a single table may need custom definitions - but still import base types from `backend/types/`
- `id` field on all GraphQL objects (Apollo cache normalization)
- Error translation: direct errors in resolvers must use `getBackendTranslations`
- Resolvers must propagate `ctx.locale` to service and repository calls

### i18n / Localized Errors

- All error messages via `getBackendTranslations` from `next-intl`
- Accept `locale?: string` parameter in services and repositories
- GraphQL resolvers propagate `ctx.locale` to service/repo calls
- Never hardcode error strings, messages, or warnings - in any layer

### Logging

- NEVER use `console.*` - ESLint will error
- `import { logger } from '@/backend/lib/logger'`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`

### Repository Layer

- Drizzle ORM only for PostgreSQL
- When `findMany` with complex relations causes `SQL<unknown>` errors or missing TypeScript properties, use `.select().from().leftJoin()` or manual ID-based mapping
- Conditional aggregation: `sql<number>` template with `.mapWith(Number)` - not raw DB casts like `CAST(... AS INTEGER)`:
  ```ts
  sql<number>`CASE WHEN ${table.status} = 'ACTIVE' THEN 1 ELSE 0 END`.mapWith(Number)
  ```
- No hardcoded error strings - use `getBackendTranslations` with `locale?: string`
- Repos use `{Entity}SelectType` / `{Entity}InsertType` from `backend/types/`, not raw schema references
- Repos must NOT contain business logic, permission checks, or complex orchestration (service layer only)

### Service Layer

- Business logic hub: all business rules, complex permission gating, orchestration before calling repos
- Data transformations between types (e.g., `SubmitInput` -> `InsertType`, `SelectType` -> `ReturnType`)
- Import types from `@/backend/types` for function signatures - no ad-hoc type definitions
- Never call other services outside your domain boundary - each domain owns its own service
- SSR-compatible: must not rely on GraphQL-specific contexts unless passed explicitly
- Treat `locale` as optional parameter - pass from GraphQL context or Server Component as needed

### Seeds (CRITICAL)

- Every table has its own `seedOrGet` function in dedicated file (e.g., `seed-classes.ts`, `seed-class-instances.ts`)
- Do NOT combine distinct domains in one seeder file - one seeder per table
- `seedOrGet` must be idempotent: `onConflictDoUpdate` / `onConflictDoNothing` - safe to re-run without creating duplicates
- Check constraints before seeding (e.g., `class_instances_state_machine_chk`) - read `backend/db/schema/*.ts`
- Match PostgreSQL enums EXACTLY from `backend/db/schema/enums.ts` or `shared/lib/enum.ts` - never guess valid statuses (e.g., use `"ACTIVATED"` not `"ACTIVE"`, `"REGULAR"` not `"NORMAL"`)
- Schema changes: MUST run `bun run scripts/dbActions.ts push` before `bun run db seed`
- Return seeded entities for downstream seeders - other seeders should not need to re-query
- Dependencies passed via controller context (`index.ts`) - call other `seedOrGet` functions or accept as parameter
- If strict Entity types unavailable: create new types in `backend/types/`, update `index.ts` - never use `any` or inline types
- Favor `db.select().from(table).where(...)` over `db.query.table.findFirst()` if strict typing issues with relational queries
- If seeder exceeds ~70-80 lines, extract distinct steps (e.g., `upsertStudent()`, `ensureTeacherAssignments()`)

### GraphQL Schema Generation

- After modifying Pothos schema files, run: `~/.bun/bin/bun run generate:gqlSchema`
- After modifying documents or schema, also run: `~/.bun/bin/bun codegen`
- Both steps required for consistent frontend-backend type integration

### Database Access Patterns

- Services used by Server Components must not rely on GraphQL-specific contexts - passed explicitly if needed
- Drizzle `$inferSelect` / `$inferInsert` as foundation for all entity types
- Database schema relations: `students.id` (PK), `teachers.userId` -> `users.id`, `classInstances.studentId` -> `students.id`, `classInstances.teacherId` -> `teachers.id`
- Custom setup in services: always insert `teacherAssignments` before booking a class (scheduling repo validates)
- Use `React.cache()` wrappers for Server Component data sharing - placed in `backend/lib/auth/` or similar shared location

### Database Testing Keys

- DB tests in `backend/db/test/` - use `runInRollback` wrapper, pass `tx` to all repo calls
- See `tests.instructions.md` for comprehensive test rules

### Bun

- Always `bun` / `~/.bun/bin/bun` - never npm/yarn/pnpm
- Install: `~/.bun/bin/bun install` / `~/.bun/bin/bun add <pkg>` / `~/.bun/bin/bun remove <pkg>`
- Run scripts: `~/.bun/bin/bun run <script-name>`
- Execute files: `~/.bun/bin/bun <file-path>`
- Build: `~/.bun/bin/bun build`
- Scaffold: `~/.bun/bin/bun create`
- Database: `~/.bun/bin/bun run db` or `~/.bun/bin/bun run scripts/dbActions.ts push`

### Code Style

- No nested ternary operators - extract into if/else or separate functions (SonarJS code smell)
