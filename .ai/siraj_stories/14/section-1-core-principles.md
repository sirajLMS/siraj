## Section 1: Core Principles & Strict Rules (Mandatory Checklist)

### 1.1 Service Layer Architecture

- [ ] **NO monolithic services** — Services are scoped to domain-driven concerns: `ComplaintService`, `SuggestionService`, `CommunicationService`.
- [ ] **Business logic centralization** — All orchestration, validation, permission gating, and communication dispatch resides in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle** — Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle-related module is **strictly forbidden**. All database access must go through repo methods.
- [ ] **Communication service pattern** — `CommunicationService` defines an interface with channel implementations (`OnAppChannel`, `EmailChannel`). Domain services (`ComplaintService`, `SuggestionService`) call the communication service for notification dispatch — they do NOT directly create `notificationDeliveries` records.

### 1.1b GraphQL Resolver Architecture

- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** — Pothos resolvers can ONLY depend on the service layer (`backend/services/`). Importing from `backend/db/repo/`, `backend/db/schema`, or any database module is **strictly forbidden**.
- [ ] **Resolvers are thin adapters** — Validate GraphQL input → call service method → return GraphQL result. No business logic, no direct data access.
- [ ] **Locale propagation** — All resolvers pass `ctx.locale` to service calls for localized error messages.

### 1.2 Type Safety — NO `any`, NO Casts

- [ ] **Strict Type Narrowing** — BANNED: `any`, `as any`, `as unknown as`. Find the actual types. Narrow using type guards.
- [ ] **No route param casts** — Use safety checks like `typeof params?.id === "string" ? params.id : ""`.
- [ ] **Generated GraphQL types first** — Before defining any custom type, check `frontend/graphql/generated/gql/graphql-types.ts`. Re-export generated types where available.

### 1.2b Task Ordering & Dependency Integrity

- [ ] **No forward dependencies** — A task MUST NOT depend on code, types, schemas, or modules introduced by a later task.
- [ ] **Incremental build order** — Migration → Repository → Service → Repo Tests → GraphQL → Documents → Type Extraction → GraphQL Tests + Storybook Migration → Stores → Views → i18n.
- [ ] **Self-contained tasks** — After completing each task, the project compiles and passes all quality gates.
- [ ] **Explicit dependency declaration** — Each task lists its dependencies (earlier task letters or "current project state only").
- [ ] **Test tasks immediately follow implementation** — DB/repo tests come directly after repos+services. GraphQL tests come directly after frontend documents.
- [ ] **Database Migration task protocol** — Add permissions to migration SQL → `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass.

### 1.3 Zero Incomplete Implementation Policy

| **Prohibited Pattern** | **Required Instead** | **Verification Command** |
|---|---|---|
| `// TODO`, `// FIXME`, `@todo` | Fully working implementation in same task | `rg -i "TODO\|FIXME" backend frontend` |
| `throw new Error("Not implemented")` | Complete service/repo method implementation | Manual code review |
| Handler calling only `logger.info` | Real GraphQL mutation + UI feedback | `rg "logger.info.*handle" backend` |
| Service importing from `drizzle-orm` or `backend/db/schema` | Service depends ONLY on `backend/db/repo/` | `rg "from ['\"]drizzle\|from ['\"]backend/db/schema" backend/services/` |
| GraphQL resolver importing from `backend/db/repo/` | Resolver depends ONLY on `backend/services/` | `rg "from ['\"]backend/db" backend/graphql/pothos/` |
| Mock store in production views | Real `useQuery` with `TypedDocumentNode` | `rg "mock.*Store" frontend/views --glob "!**/*.stories.tsx"` |
| Types defined in mock stores | Types extracted to `.types` files | `rg "export (type|interface)" frontend/stores/mock*.ts` |
| Story without MockedProvider | `MockedProvider` decorator with mock GraphQL responses | `rg "MockedProvider" frontend/views/**/*.stories.tsx` |
| Custom type when generated exists | Re-export from `graphql-types.ts` | Manual review |

### 1.4 SSR Compatibility

- [ ] **Services must work in Next.js Server Components** — No dependency on browser-only APIs.
- [ ] **No Apollo client in services** — Services must not depend on `@apollo/client`.

### 1.5 Data Persistence & Mock Migration

- [ ] **NO dummy data in production** — Replace all mock stores with real GraphQL-backed stores using `useQuery`.
- [ ] **Complete transaction boundaries** — Multi-table writes are atomic (`db.transaction()`).
- [ ] **Type extraction before migration** — Extract types from mock stores to `.types` files before container migration.
- [ ] **Generated GraphQL types first** — Re-export from `graphql-types.ts`; define UI-specific types only when no generated equivalent exists.
- [ ] **Storybook MockedProvider migration** — Stories use `MockedProvider`, mock data as constants with `__typename`, containers as top-level components.
- [ ] **Mock stores deleted after migration** — Once all containers and stories are migrated, mock store files are deleted.

### 1.6 Logging & Observability

- [ ] **Logger utility mandatory** — `import { logger } from '@/backend/lib/logger'` (backend) or `import { logger } from '@/frontend/utils/logger'` (frontend).
- [ ] **Console methods forbidden** — ESLint rejects `console.log/warn/error/debug`.
- [ ] **Diagnostic-only logging** — `logger.info` must NEVER substitute for user-facing functionality.

### 1.7 Testing Requirements

**Repository Tests** (`backend/db/test/repo/`):
- [ ] **100% line + function coverage** on all new repository methods.
- [ ] **Success AND failure paths** — Valid input, invalid input, not-found, transaction rollback.
- [ ] **IDOR protection tests** — Parent A cannot access Parent B's complaints. Admin CAN access any.

**GraphQL Integration Tests** (`frontend/graphql/test/`):
- [ ] **Authorized success + unauthorized denial** for every new query/mutation.
- [ ] **Security threat coverage** — Each threat from Section 4 has a corresponding test.

**Coverage Verification Command:**
```bash
bun run test:coverage backend/db/test/repo/<domain>.repository.test.ts
```

**Other:**
- [ ] `bun run test:db` after every repository change.
- [ ] `bun run test:graphql` after every GraphQL change.
- [ ] Storybook stories use `MockedProvider` with mock responses.
