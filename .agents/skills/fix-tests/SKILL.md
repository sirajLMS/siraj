---
name: fix-tests
description: >
  Fix failing tests across any domain in the codebase (database repositories,
  backend services, GraphQL integration, UI components, and E2E tests). Asks scoping
  questions to confirm targeted test files or domains, checks existing skills, executes
  log-captured test runs, applies domain-specific fixes, verifies code quality via per-file
  sub-loop (tsgo → oxlint → biome → lint:type-aware), and confirms clean type-checking. Use when any test fails
  or when asked to fix tests.
allowed-tools: shell
---

## Fix Tests Workflow

Follow this systematic workflow when resolving test failures across any layer in Siraj.

---

### Step 1: Check Existing Skills & Scoping

Before diagnosing or editing code:

1. **Check Existing Skills**:
   - `fix-db-tests`: Used specifically for database repository tests (`backend/db/test/`). `fix-tests` extends this to cover all domains.
   - `quality-loop`: Runs project quality gates repeatedly (`tsgo`, `oxlint`, `biome:check`, `lint`) plus file-scoped verification via `sub-loop.ts`.
   - `fix-codescene`: Used specifically for CodeScene health scan warnings.
   - `plan-review`: Used for reviewing architectural plans before large refactors.

2. **Ask Scoping Questions** (when target is ambiguous):
   If the user has not specified a specific test file, test class, or failure error message, ask an interactive scoping question using `ask_question`:
   - *"Which test domain or file do you want to target?"*
     Options:
     - `Backend Services` (`bun run test:services` / `backend/services/`)
     - `Database Repositories` (`bun run test:db` / `backend/db/test/`)
     - `GraphQL Integration` (`bun run test:graphql` / `frontend/common/graphql/test/`)
     - `UI Components` (`bun run test:ui:components` / `test/ui/components/`)
     - `UI End-to-End (E2E)` (`bun run test:ui:e2e` / `test/ui/e2e/`)
     - `All UI Tests` (`bun run test:ui`)

---

### Step 2: Run Tests with Log Capture (`run-test.ts`)

ALWAYS run test files using the project log capture runner instead of raw `bun test`:

```bash
# Run specific test file (captures full stdout/stderr to logs/<timestamp>/)
bun run scripts/run-test/run-test.ts <test-path>
```

Or run domain test suites:
- **DB Tests**: `bun run test:db`
- **Backend Services Tests**: `bun run test:services`
- **GraphQL Integration Tests**: `bun run test:graphql`
- **UI Component Tests**: `bun run test:ui:components`
- **UI E2E Tests**: `bun run build:test` (REQUIRED FIRST!), then `bun run test:ui:e2e`
- **UI Static Isolation Tests**: `bun run test:ui:static`

---

### Step 3: Inspect Logs & Trace Root Cause

NEVER form a diagnostic hypothesis without reading the empirical error log. Inspect the captured output:

```bash
# View last test result (AI-optimized formatting)
bun run scripts/run-test/run-test.ts --last <test-path>
```

Filter log output to focus on specific failing assertions:

```bash
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <test-path>
```

---

### Step 4: Apply Domain-Specific Fix Guidelines

Apply domain-specific rules based on where the test failure occurs:

#### 1. Database Repositories (`backend/db/test/`)
- **`runInRollback` Wrapper**: Wrap test bodies in `await runInRollback(async (txContext) => { ... })`.
- **`txContext` Propagation**: Pass `txContext` to EVERY repository method inside a transaction. Mixing `txContext` and raw `db` repository calls causes PostgreSQL connection deadlocks.
- **No `expect().rejects.toThrow()` inside `runInRollback`**: It swallows transaction context and deadlocks. Use a `try/catch` block that catches the error and asserts after or within the helper.
- **No Seed Data Dependencies**: Never query seed data directly — create test entities using `entity-setup.ts` helpers (e.g. `createTestUser`, `createTestStudent`).
- **Helper Signatures**: Check parameter signatures in `entity-setup.ts` before calling.

#### 2. Backend Services (`backend/services/`)
- **Process Isolation**: Backend service tests rely on `scripts/run-services-tests-parallel.ts` for process isolation. Running multiple service test files in a single Bun process mutates module exports and causes barrel `SyntaxError`s (like `Export named 'users' not found in module`).
- **Spy Mocks**: Unit tests mock repository and service methods using `spyOn(Repository, "method")`. Restore spies in `afterEach`.
- **Permission Gating**: Mock `PermissionsService.hasPermission` and `PermissionsService.hasAnyPermission` (`mockResolvedValue(true)` for authorized paths).
- **Valid UUID Formats**: Always use valid RFC 4122 UUID strings (e.g., `00000000-0000-0000-0000-000000000001` or `randomUUID()`). Invalid UUID strings (e.g., `"actor-user-1"`) cause Postgres `22P02` syntax errors when queried.
- **Notification Contact Info**: When testing services that call `dispatchWithPreferences`, mock `UserRepository.findSafeById` to return `{ email: "...", phone: "..." }` so email/sms payloads pass through without being dropped as contactless.

#### 3. GraphQL Integration (`frontend/common/graphql/test/`)
- **Server Harness**: CI runs with `TEST_SERVER_MODE=production` against `.next-test-prod`.
- **GraphQL Documents**: Place documents in `frontend/common/graphql/sharedDocuments/`.
- **Always Include `id`**: Every queried object type MUST include the `id` field for Apollo Client cache normalization.
- **`testClient` Helper**: Use `testClient` rather than raw `fetch`.

#### 4. UI Components (`test/ui/components/`)
- **Preloads**: Executed with Happy DOM + preloads (`test-env.ts`, `happydom-preload.ts`, `next-dynamic-mock.ts`).
- **MUI & Theme**: Wrap rendered components in theme and locale providers if testing standalone components.
- **Store Reset**: Reset Zustand store states between test cases.

#### 5. End-to-End (E2E) (`test/ui/e2e/`)
- **Build First**: ALWAYS run `bun run build:test` before running E2E tests.
- **Test Server Ports**: Test servers use ports `3001` / `3020–3199`.
- **Stuck Server Recovery**: If test ports are occupied, run `bun run test:ui:kill` (NEVER kill dev port 3000 or start port 4000).

---

### Step 5: Code Quality & Per-File Verification Loop

Follow the project's **code quality rules** after making any code edits:

1. **Per-File Verification**:
   Before running the full test suite, verify modified files using:
   ```bash
   bun tsgo                      # Type check (safe to run concurrently)
   bun run biome:check           # Biome format & lint
   ```
2. **Sub-Loop Verification** (preferred over manual lint):
   For file-scoped progressive verification (tsgo → oxlint → biome → lint → duplicates → codescene):
   ```bash
   bun run scripts/health/sub-loop.ts <modified-file-path> --lifecycle lint
   ```
   This runs tsgo, oxlint, biome, and ESLint (type-aware) in order, short-circuiting at first failure.
   The script also prints which instruction files and AGENTS.md files apply to the target file.
3. **Lint Service (in-process, no HTTP server)**:
   For direct file-scoped lint without the full sub-loop:
   ```bash
   bun run scripts/lint-service.ts -f <file> --id fix-tests
   ```
   The former HTTP-based lint queue (`lint-queue-server.ts`, `LINT_QUEUE_PORT`, curl) is GONE.
   All lint is now in-process via `scripts/lint-service.ts`.
4. **No Symptom Masking**:
   NEVER resolve errors by masking symptoms, swallowing exceptions, returning dummy fallbacks, commenting out assertions, or deleting failing tests. Trace and fix the root cause.
5. **No `oxlint-disable` comments**:
   NEVER add `oxlint-disable` comments — fix the root cause instead. See AGENTS.md "Oxlint Rules" section.

---

### Step 6: Re-Run & Verify Clean Pass

Re-run the test command to verify a clean pass ("wall of green"):

```bash
bun run scripts/run-test/run-test.ts <test-path>
```

Run final type checking:

```bash
bun tsgo
```

When all tests pass cleanly with 0 TypeScript and lint errors, report the summary to the user.
