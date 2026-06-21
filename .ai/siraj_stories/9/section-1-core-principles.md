## Section 1: Core Principles & Strict Rules (Mandatory Checklist)

See [Section 0](./section-0-metadata.md) for story scope and [Section 5](./section-5-prerequisites.md) for prerequisite verification before executing any task.

---

### 1.1 Service Layer Architecture
- [ ] **NO monolithic services** — Scoped strictly to domain-driven services: `BillingManagementService` (billing domain), `StudentLifecycleService` (student domain), `NotificationSyncService` (system domain).
- [ ] **Business logic centralization** — All orchestration, validation, and permission checks reside in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle** — Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle-related module is **strictly forbidden**. All database access must go through repo methods. This rule is explicitly enforced in every service-layer task in Section 6.

### 1.1b GraphQL Resolver Architecture
- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** — Pothos resolvers can ONLY depend on the service layer (`backend/services/`). Importing from `backend/db/repo/`, `backend/db/schema`, or any database module is **strictly forbidden**. Resolvers are thin adapters: validate GraphQL input → call service method → return GraphQL result. No business logic, no direct data access.

### 1.2 Type Safety — NO `any`, NO Casts
- [ ] **Strict Type Narrowing** — BANNED: `any`, `as any`, and `as unknown as`. Find the actual types. Narrow them using type guards.
- [ ] **No route param casts** — Instead of `useParams() as { id: string }`, use safety checks like `typeof params?.id === "string" ? params.id : ""`.

### 1.2b Task Ordering & Dependency Integrity
- [ ] **No forward dependencies** — A task MUST NOT depend on code, types, schemas, or modules introduced by a later task.
- [ ] **Incremental build order** — Tasks flow: Database/Schema → Repository → **DB/Repo Tests** → Service → GraphQL (Backend) → GraphQL Documents (Frontend) → **GraphQL Tests** → Frontend Views → i18n.
- [ ] **Self-contained tasks** — After completing each task, the project must compile and pass all quality gates.
- [ ] **Explicit dependency declaration** — Each task lists its dependencies in its Dependencies field.
- [ ] **Test tasks immediately follow implementation** — DB/repo tests come directly after repository task. GraphQL tests come directly after frontend GraphQL documents task.
- [ ] **Database Migration task protocol** — Migration task (Task A) MUST add new permissions to `backend/db/migration/3-system_permissions_and_groups.sql`, then run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass.

### 1.3 Zero Incomplete Implementation Policy

The following patterns are **strictly prohibited**:

| **Prohibited Pattern** | **Required Instead** | **Verification Command** |
|---|---|---|
| `// TODO`, `// FIXME`, `@todo` | Fully working implementation in same task | `rg -i "TODO\|FIXME" backend frontend` |
| `throw new Error("Not implemented")` | Complete service/repo method implementation | Manual code review |
| Handler calling only `logger.info` | Real GraphQL mutation + UI feedback | Grep for `logger.info.*handle` patterns |
| Service importing from `drizzle-orm` or `backend/db/schema` | Service depends ONLY on `backend/db/repo/` | `rg "from ['\"']drizzle\|from ['\"']backend/db/schema" backend/services/` |
| GraphQL resolver importing from `backend/db/repo/` | Resolver depends ONLY on `backend/services/` | `rg "from ['\"']backend/db" backend/graphql/pothos/` |
| Mock store in production views | Real `useMutation` / `useQuery` with `TypedDocumentNode` | `rg "mockAdminBillingStore\|mocKAdminManualInvoiceStore" frontend/views --glob "!**/*.stories.tsx"` |
| `globalThis.confirm()` | MUI `<Dialog>` component with localized text | `rg "globalThis.confirm\|window.confirm" frontend/views` |

### 1.4 SSR Compatibility (when applicable)
- [ ] **Services must work in Next.js Server Components** — Services can be used directly by SSR or Server Actions without GraphQL-specific context dependencies.
- [ ] **No Apollo client in services** — Services must not depend on `@apollo/client`, Apollo cache, or browser-only APIs.

### 1.5 Data Persistence & Mock Migration
- [ ] **NO dummy data in production** — Replace all mock stores (`mockAdminBillingStore`, `mocKAdminManualInvoiceStore`) with real GraphQL-backed mutations using `useMutation` and generated `TypedDocumentNode`.
- [ ] **Complete transaction boundaries** — Multi-table writes (e.g., create invoice + notification sync) must be atomic where required.
- [ ] **Mock stores preserved for Storybook** — `*.stories.tsx` files MUST keep dummy data via mock store aliases. Production containers use real stores.

### 1.6 Logging & Observability
- [ ] **Logger utility mandatory** — Use `import { logger } from '@/backend/lib/logger'` (backend).
- [ ] **Console methods forbidden** — ESLint will reject `console.log/warn/error/debug` usage.
- [ ] **Diagnostic-only logging** — `logger.info` must NEVER substitute for implementing user-facing functionality.

### 1.7 Testing Requirements

**Repository Tests** (`backend/db/test/repo/`):
- [ ] **100% line + function coverage** on all new/modified repository methods. Run `bun run test:coverage backend/db/test/repo/billing.repository.test.ts` and `bun run test:coverage backend/db/test/repo/student.repository.test.ts` to verify.
- [ ] **Success AND failure paths** — Every repo method must have tests for: valid input success, invalid input rejection, not-found handling, transaction rollback on failure.
- [ ] **IDOR protection tests** — Repository methods that modify data must verify cross-user access denial.

**Security Logic Tests** (`backend/db/test/logic/`):
- [ ] **Student status transition tests** — Verify `fn_enforce_student_status_transition` DB trigger allows valid transitions (`REGULAR → SUSPENDED`, `REGULAR → ON_LEAVE`, `SUSPENDED → REGULAR`, etc.) and blocks invalid ones (`GRADUATED → anything`).
- [ ] **Invoice immutability tests** — Verify paid invoices (`status = PAID`) cannot be re-marked or re-edited via the repo layer.

**GraphQL Integration Tests** (`frontend/graphql/test/`):
- [ ] **Authorized success + unauthorized denial** — Every new GraphQL mutation must have at least one test for authorized success and one for unauthorized denial.
- [ ] **Security threat coverage** — Each threat from [Section 4](./section-4-security-threats.md) must have a corresponding GraphQL-level test case.

**Coverage Verification Commands** (run after every repository task):
```bash
bun run test:coverage backend/db/test/repo/billing.repository.test.ts
bun run test:coverage backend/db/test/repo/student.repository.test.ts
```
Output must show 100% line + function coverage on touched methods.

**Other:**
- [ ] **Database test suite** — Run `bun run test:db` after every repository change.
- [ ] **Storybook stories** — Mock stores in `*.stories.tsx` files; production containers fully wired to real data.
