## Section 1: Core Principles & Strict Rules (Mandatory Checklist)

### 1.1 Service Layer Architecture
- [ ] **NO monolithic services** - Scoped strictly to domain-driven services (e.g. `ReportService`, `LearningResourceService`).
- [ ] **Business logic centralization** - All orchestration, validation, and permission checks reside in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle** - Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle-related module is **strictly forbidden**. All database access must go through repo methods.

### 1.1b GraphQL Resolver Architecture
- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** - Pothos resolvers can ONLY depend on the service layer (`backend/services/`). Importing from `backend/db/repo/`, `backend/db/schema`, or any database module is **strictly forbidden**. Resolvers are thin adapters: validate GraphQL input → call service method → return GraphQL result. No business logic, no direct data access.

### 1.2 Type Safety - NO `any`, NO Casts
- [ ] **Strict Type Narrowing** - BANNED: `any`, `as any`, and `as unknown as`. You must find the actual types. Narrow them using type guards.
- [ ] **No route param casts** - Instead of `useParams() as { id: string }`, use safety checks like `typeof params?.id === "string" ? params.id : ""`.

### 1.2b Task Ordering & Dependency Integrity
- [ ] **No forward dependencies** - A task MUST NOT depend on code, types, schemas, or modules introduced by a later task. Tasks can only depend on the current project state or on earlier tasks.
- [ ] **Incremental build order** - Tasks must be ordered so the dependency chain flows naturally: Database/Schema → Repository → Service → **DB/Repo Tests** → GraphQL (Backend) → GraphQL Documents (Frontend) → **Type Extraction** → **GraphQL Tests** + **Storybook Migration** → Frontend Stores → Frontend Views. Tests immediately follow the layer they verify. Type extraction happens before stores/views so types are available. Storybook migration happens before container migration so stories are ready when containers switch to `useQuery`.
- [ ] **Self-contained tasks** - After completing each task, the project must compile and pass all quality gates. No task should leave the project in a broken state waiting for a later task to fix it.
- [ ] **Explicit dependency declaration** - Each task must list its dependencies (earlier task letters or "current project state only") in its Dependencies field.
- [ ] **Test tasks immediately follow implementation** - DB/repo/service tests come directly after the DB/repo/service implementation task. GraphQL tests come directly after the frontend GraphQL documents task. Tests are never deferred to the end.
- [ ] **Database Migration task protocol** - Migration tasks MUST add new permissions to `backend/db/migration/3-system_permissions_and_groups.sql`, then run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass before the task is complete.

### 1.3 Zero Incomplete Implementation Policy
The following patterns are **strictly prohibited**:

| **Prohibited Pattern** | **Required Instead** | **Verification Command** |
|---|---|---|
| `// TODO`, `// FIXME`, `@todo` | Fully working implementation in same task | `rg -i "TODO\|FIXME" backend frontend` |
| `throw new Error("Not implemented")` | Complete service/repo method implementation | Manual code review |
| Handler calling only `logger.info` | Real GraphQL mutation + UI feedback | Grep for `logger.info.*handle` patterns |
| Service importing from `drizzle-orm` or `backend/db/schema` | Service depends ONLY on `backend/db/repo/` | `rg "from ['\"]drizzle\|from ['\"]backend/db/schema" backend/services/` |
| GraphQL resolver importing from `backend/db/repo/` | Resolver depends ONLY on `backend/services/` | `rg "from ['\"]backend/db" backend/graphql/pothos/` |
| Mock store in production views | Real `useQuery` with `TypedDocumentNode` | `rg "mock.*Store" frontend/views --glob "!**/*.stories.tsx"` |
| Types defined in mock stores | Types extracted to `types.ts`, mock stores re-import | `rg "export (type\|interface)" frontend/stores/mock*.ts` |
| Story without MockedProvider | `MockedProvider` decorator with mock GraphQL responses | `rg "MockedProvider" frontend/views/**/*.stories.tsx` |
| Custom type when generated exists | Re-export from `graphql-types.ts` | Manual review of `types.ts` files |

### 1.4 SSR Compatibility (when applicable)
- [ ] **Services must work in Next.js Server Components** — Services can be used directly by SSR or Server Actions without GraphQL-specific context dependencies.
- [ ] **No Apollo client in services** — Services must not depend on `@apollo/client`, Apollo cache, or browser-only APIs.

### 1.5 Data Persistence & Mock Migration
- [ ] **NO dummy data in production** — Replace all mock stores (`mockXxxStore`) with real GraphQL-backed stores using `useQuery` and generated `TypedDocumentNode`.
- [ ] **Complete transaction boundaries** — Multi-table writes must be atomic (wrapped in `db.transaction()`).
- [ ] **Type extraction before migration** — Before migrating any container from mock stores, extract all shared types (interfaces, type aliases, union types, constants) from the mock store file into a dedicated `types.ts` file in the view component's directory. Mock stores then re-import from the `types.ts` file for backward compatibility with Storybook stories.
- [ ] **Generated GraphQL types first** — Before defining any custom type in a `types.ts` file, check `frontend/graphql/generated/gql/graphql-types.ts` for the generated equivalent. If the generated type matches the UI's needs, re-export it from the `types.ts` file and use it directly. Only define UI-specific types when the generated type is missing fields, has incompatible nullability, or doesn't exist yet.
- [ ] **Storybook MockedProvider migration** — When a container migrates from mock stores to `useQuery`, its `*.stories.tsx` file MUST be updated to:
  1. Use `MockedProvider` from `@apollo/client/testing` as a decorator
  2. Define mock GraphQL responses as constants within the story file (using `__typename` and generated type shapes)
  3. Keep the container as the top-level story component
  4. Mock permission gates (e.g., `<RequirePermission>`) via decorators or store state overrides
  5. Provide multiple story variants (Default, Empty, Loading) where applicable
- [ ] **Mock stores preserved for Storybook** — `*.stories.tsx` files MUST keep dummy data available, but the delivery mechanism changes from Zustand store imports to `MockedProvider` mock responses. The mock store files themselves retain their mock data arrays for backward compatibility with any remaining imports.

### 1.6 Logging & Observability
- [ ] **Logger utility mandatory** — Use `import { logger } from '@/frontend/utils/logger'` (frontend) or `import { logger } from '@/backend/lib/logger'` (backend).
- [ ] **Console methods forbidden** — ESLint will reject `console.log/warn/error/debug` usage.
- [ ] **Diagnostic-only logging** — `logger.info` must NEVER substitute for implementing user-facing functionality.

### 1.7 Testing Requirements

**Repository Tests** (`backend/db/test/repo/`):
- [ ] **100% line + function coverage** on all new/modified repository methods. Run `bun run test:coverage backend/db/test/repo/<domain>.repository.test.ts` to verify.
- [ ] **Success AND failure paths** — Every repo method must have tests for: valid input success, invalid input rejection, not-found handling, transaction rollback on failure.
- [ ] **IDOR protection tests** — If a repo method accesses user-scoped data, tests must verify: User A cannot access User B's data, admin CAN access any user's data, unauthenticated user is rejected.

**Security Logic Tests** (`backend/db/test/logic/`):
- [ ] **DB trigger tests** — Every database trigger must have dedicated tests in `backend/db/test/logic/`.
- [ ] **State transition tests** — If the story modifies entity state machines, tests must cover every allowed transition.
- [ ] **Security regression suite** — When extending prior sprint security work, add new test cases to the existing security test file.

**GraphQL Integration Tests** (`frontend/graphql/test/`):
- [ ] **Authorized success + unauthorized denial** — Every new GraphQL query/mutation must have at least one test for authorized success and one test for unauthorized denial.
- [ ] **Security threat coverage** — Each threat from Section 4 must have a corresponding GraphQL-level test case.

**Coverage Verification Command** (run after every repository task):
```bash
bun run test:coverage backend/db/test/repo/<domain>.repository.test.ts
```
Output must show 100% line + function coverage on touched methods.

**Other:**
- [ ] **Database test suite** — Run `bun run test:db` after every repository change.
- [ ] **Storybook stories** — Stories use `MockedProvider` with mock GraphQL responses; containers are top-level components; permission gates are mocked; no production store imports.
