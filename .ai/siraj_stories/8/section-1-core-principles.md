# Section 1: Core Principles & Strict Rules (Mandatory Checklist)

## 1.1 Service Layer Architecture
- [ ] **NO monolithic services** — Scoped strictly to domain-driven services: `ParentProfileService`, `BillingHistoryService`, `ParentDocumentService`, and extended `StudentManagementService`.
- [ ] **Business logic centralization** — All orchestration, validation, and permission checks reside in services, NOT in repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle** — Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle-related module is **strictly forbidden**. All database access must go through repo methods. This rule must be explicitly checked in every service layer task.

## 1.1b GraphQL Resolver Architecture
- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** — Pothos resolvers can ONLY depend on the service layer (`backend/services/`). Importing from `backend/db/repo/`, `backend/db/schema`, or any database module is **strictly forbidden**. Resolvers are thin adapters: validate GraphQL input → call service method → return GraphQL result. No business logic, no direct data access.

## 1.2 Type Safety — NO `any`, NO Casts
- [ ] **Strict Type Narrowing** — BANNED: `any`, `as any`, and `as unknown as`. You must find the actual types. Narrow them using type guards.
- [ ] **No route param casts** — Instead of `useParams() as { id: string }`, use: `typeof params?.id === "string" ? params.id : ""`.

## 1.2b Task Ordering & Dependency Integrity
- [ ] **No forward dependencies** — A task MUST NOT depend on code, types, schemas, or modules introduced by a later task.
- [ ] **Incremental build order** — Tasks flow: Migration/Enum → Repository → **DB/Repo Tests** → Services → GraphQL (Backend) → GraphQL Documents (Frontend) → **GraphQL Tests** → Frontend Stores → Frontend Views → i18n.
- [ ] **Self-contained tasks** — After completing each task, the project must compile and pass all quality gates. No task should leave the project in a broken state.
- [ ] **Explicit dependency declaration** — Each task must list its dependencies in its Dependencies field.
- [ ] **Test tasks immediately follow implementation** — Repo tests come directly after the repo task. GraphQL tests come directly after the frontend documents task.
- [ ] **Database Migration task protocol** — Must run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass before the task is complete.

## 1.3 Zero Incomplete Implementation Policy

The following patterns are **strictly prohibited**:

| **Prohibited Pattern** | **Required Instead** | **Verification Command** |
|---|---|---|
| `// TODO`, `// FIXME`, `@todo` | Fully working implementation in same task | `rg -i "TODO\|FIXME" backend frontend` |
| `throw new Error("Not implemented")` | Complete service/repo method implementation | Manual code review |
| Handler calling only `logger.info` | Real GraphQL mutation + UI feedback | Grep for `logger.info.*handle` patterns |
| Service importing from `drizzle-orm` or `backend/db/schema` | Service depends ONLY on `backend/db/repo/` | `rg "from ['\"]drizzle\|from ['\"]backend/db/schema" backend/services/` |
| GraphQL resolver importing from `backend/db/repo/` | Resolver depends ONLY on `backend/services/` | `rg "from ['\"]backend/db" backend/graphql/pothos/` |
| Mock store in production views | Real `useQuery` with `TypedDocumentNode` | `rg "mock.*Store" frontend/views --glob "!**/*.stories.tsx"` |

## 1.4 SSR Compatibility
- [ ] **Services must work in Next.js Server Components** — Services can be used directly by SSR or Server Actions without GraphQL-specific context dependencies.
- [ ] **No Apollo client in services** — Services must not depend on `@apollo/client`, Apollo cache, or browser-only APIs.

## 1.5 Data Persistence & Mock Migration
- [ ] **NO dummy data in production** — Replace all mock stores (`mockXxxStore`) with real GraphQL-backed stores using `useQuery` and generated `TypedDocumentNode`.
- [ ] **Complete transaction boundaries** — Multi-table writes must be atomic (wrapped in `db.transaction()`).
- [ ] **Mock stores preserved for Storybook** — `*.stories.tsx` files MUST keep dummy data via mock store aliases. Production containers use real stores.

## 1.6 Logging & Observability
- [ ] **Logger utility mandatory** — Use `import { logger } from '@/frontend/utils/logger'` (frontend) or `import { logger } from '@/backend/lib/logger'` (backend).
- [ ] **Console methods forbidden** — ESLint will reject `console.log/warn/error/debug` usage.
- [ ] **Diagnostic-only logging** — `logger.info` must NEVER substitute for implementing user-facing functionality.

## 1.7 Testing Requirements

**Repository Tests** (`backend/db/test/repo/`):
- [ ] **100% line + function coverage** on all new/modified repository methods. Run `bun run test:coverage backend/db/test/repo/<domain>.repository.test.ts` to verify.
- [ ] **Success AND failure paths** — Every repo method must have tests for: valid input success, invalid input rejection, not-found handling.
- [ ] **IDOR protection tests** — For `deactivateParent` and `setClassesRemaining`, tests must verify: Admin can access any parent/student, Teacher role is rejected, unauthenticated user is rejected.

**GraphQL Integration Tests** (`frontend/graphql/test/`):
- [ ] **Authorized success + unauthorized denial** — Every new query/mutation must have at least one authorized success test and one unauthorized denial test.
- [ ] **Security threat coverage** — Each threat from Section 4 must have a corresponding GraphQL-level test case.

**Coverage Verification Command** (run after every repository task):
```bash
bun run test:coverage backend/db/test/repo/parent.repository.test.ts
bun run test:coverage backend/db/test/repo/billing.repository.test.ts
```
Output must show 100% line + function coverage on touched methods.

**Mandatory Quality Gate Checklist** (MUST appear in every task's Success Criteria):

```
Quality Gate — Per-File Validation:
- [ ] bun tsgo on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] bun biome:check on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] bun lint on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] bun codescene on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] loop over tsgo, biome:check, lint, codescene on working files till no issues at all

Quality Gate — Task Completion Validation:
- [ ] bun tsgo on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] bun biome:check on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] bun lint on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] bun codescene on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] loop over tsgo, biome:check, lint, codescene on working files till no issues at all
```
