# 10. Testing Infrastructure & Quality Gate System — Siraj

Analysis of the testing patterns and quality-gate pipeline in the Siraj project, oriented toward a future certificate feature integration. All references are concrete file paths/line numbers.

---

## 1. Database Tests (`backend/db/test/`)

### 1.1 Directory Layout

```
backend/db/test/
├── AGENTS.md                  ← Backend DB test rules (20 rules)
├── test-utils.ts              ← runInRollback, testInRollback, RLS helpers, createTestUser (local)
├── entity-setup.ts            ← Entity creation helpers (createTestUser/Teacher/Parent/Student, setupStudent/Teacher, setupTestEntities, etc.)
├── const.ts
├── ensure-env.ts
├── logger-mock.ts
├── connection-strategy.test.ts
├── http-client.test.ts
├── logic/                     ← Business-logic / constraint / trigger / multi-entity workflow tests
└── repo/                      ← Repository isolation tests — MUST achieve 100% coverage
    ├── auth/ billing/ books/ classes/ complaints/
    ├── meeting/ notifications/ parents/ permissions/
    ├── scheduling/ shared/ storage/
    ├── students/ teachers/
    ├── supported-mobile-wallet.repository.test.ts
    ├── supported-online-account.repository.test.ts
    ├── supported-payment-link.repository.test.ts
    ├── user-payment-method.repository.test.ts
    └── user.repository.test.ts
```

Two-directory split is mandated by `backend/db/test/AGENTS.md` Rule 11:
- `logic/` — business logic workflows, constraints, triggers, complex multi-entity transactions
- `repo/` — 100% coverage isolation tests for individual repository methods

### 1.2 `runInRollback` — the core DB test wrapper

Defined in `backend/db/test/test-utils.ts:18`:

```typescript
export async function runInRollback(fn: (tx: DBTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}
```

Key mechanics:
- Wraps the test body inside a Drizzle `db.transaction(...)`.
- Catches assertion errors and re-throws them *after* the rollback completes (so the rollback itself, which throws when `tx.rollback()` is called, doesn't mask test failures).
- Always rolls back — no test data ever persists.

There is also a `testInRollback(name, fn)` convenience wrapper (`test-utils.ts:41`) that registers a `bun:test` case and runs it inside `runInRollback`, reducing boilerplate and CodeScene structural-duplication scores.

### 1.3 `entity-setup.ts` — test entity creation

`backend/db/test/entity-setup.ts` exports a layered set of helpers. All accept `tx: DBTransaction` and an `overrides` partial for the relevant table's `$inferInsert` type:

| Helper | Signature | Purpose |
|---|---|---|
| `createTestUser` | `(tx, overrides?)` | Inserts a `users` row; defaults email `test-<uuid>@example.com`, timezone `IanaTimezone.UTC` |
| `createTestPermission` | `(tx, key, overrides?)` | Inserts a `permissions` row |
| `createTestTeacher` | `(tx, userId, overrides?)` | Inserts a `teachers` row linked to a user |
| `createTestParent` | `(tx, userId, overrides?)` | Inserts a `parents` row |
| `createTestStudent` | `(tx, parentId, overrides?)` | Inserts a `students` row; auto-creates a throwaway user when `userId` not supplied (LMS requires student login — see `entity-setup.ts:176`) |
| `setupTeacher` | `(tx, userOverrides?, teacherOverrides?)` | Returns `{ user, teacher }` |
| `setupStudent` | `(tx, userOverrides?, parentOverrides?, studentOverrides?)` | Returns `{ user, parent, student }` |
| `setupTestEntities` | `(tx, prefix, options?)` | Full rig: parent user + parent + student + teacher user + teacher + `teacherAssignments` + optional class instance |
| `createMockClassInstance` | `(tx, studentId, teacherId, overrides?)` | Class instance with future-dated scheduled start/end, `idempotencyKey: randomUUID()` |
| `createCompletedClassInstance` | wraps `createMockClassInstance` forcing `executionState=COMPLETED`, `outcome=TAKEN` |
| `createTestMeetingProvider` / `createTestMeetingConfig` / `createTestClassMeetingConfig` | Meeting-provider fixtures |
| `createTestCreditTransaction` / `createTestLessonReport` / `createTestTeacherDue` | Domain-row fixtures for billing/report workflows |
| `ensureTestSubjectId` | `(tx)` | Returns existing or creates category+subject |
| `loc(en, ar?)` | i18n JSONB column helper returning `{ ar, en }` |

`TestDb = DBTransaction | typeof db` (`entity-setup.ts:53`) lets helpers accept either a tx or the global db.

### 1.4 `backend/db/test/AGENTS.md` — the 20 rules (key ones)

1. **Every DB test must run inside `runInRollback`** and `tx` must be passed to *all* repo methods AND direct queries. Mixing `tx` with `db`-backed repo calls causes deadlocks/state pollution (Rule 1, `AGENTS.md:19`).
2. **Never use `expect(...).rejects.toThrow()` inside `runInRollback`** — it deadlocks. Use a `try/catch` `expectRepoError` helper (Rule 3, `AGENTS.md:31`). Assert on translated message *substrings* (`"not found"`, `"Version mismatch"`), never raw keys.
3. **Use `bun:test`** — `describe`, `test`, `it`, `beforeAll`, `afterAll`, `expect`. No Jest/Vitest imports (Rule 6, `AGENTS.md:62`).
4. **Always create test data** via entity-setup helpers; never query seed data (Rule 15, `AGENTS.md:102`).
5. **Verify helper signatures before calling** — e.g. `setupStudent(tx, userOverrides, parentOverrides, studentOverrides)` takes 4 args, not `(tx, parentId, overrides)` (Rule 17, `AGENTS.md:115`).
6. **Always check schema columns before inserting** — e.g. `storageFiles` only has `id, path, isProtected` (Rule 18, `AGENTS.md:122`).
7. **`repo/` tests require 100% coverage** — verify with `bun test --coverage <file>` or `bun run test:db:coverage` (Rule 14, `AGENTS.md:99`).
8. **Account for pre-existing data** when asserting counts — fetch `existingCount` first, assert `existingCount + n` (Rule 12, `AGENTS.md:82`).
9. **Type tx params as `DBTransaction`**, never `any` (Rule 1).
10. **Don't call `getServerTranslations` directly in tests** — use `expectRepoError` and assert on substrings (Rule 19).
11. **Types come from `backend/types/`** (e.g. `StudentSelectType`) — not test-specific defs (Rule 20).
12. Logger preference: `testLogger`, not `console.log` (Rule 4). External provider integration tests (`*.integration.test.ts`) live in `test/integration/`, NOT here.

---

## 2. Test Patterns

### 2.1 Framework

All tests use **Bun's built-in test runner** (`bun:test`). No separate Vitest/Jest config for the main suites — `package.json` "test" is:
```json
"test": "bun --env-file=.env.test test --timeout=60000"
```
(`package.json:23`)

Concrete test scripts:
- `test:db` → `bun --env-file=.env.test scripts/run-db-tests-parallel.ts`
- `test:services` → `... scripts/run-services-tests-parallel.ts`
- `test:graphql` → `bun --env-file=.env.test test frontend/common/graphql/test/ --timeout=120000`
- `test:ui:components` / `test:ui:e2e` / `test:ui:static`
- `test:integration` → `... scripts/run-integration-tests-parallel.ts`

### 2.2 Example: repository test (`repo/`)

`backend/db/test/repo/students/student.repository.test.ts:1-98` — typical patterns:

```typescript
import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { StudentRepository } from "@/backend/db/repo";
import { students } from "@/backend/db/schema";
import { setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { StudentStatus } from "@/backend/enum";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;
beforeAll(() => { tErrors = getServerTranslations("en").errorsTranslations; });

// Custom higher-order wrapper — compresses repetitive error-case boilerplate
// (satisfies CodeScene duplication detection, keeps domain logic in-file per AGENTS Rule 13)
async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try { await fn(); } catch (error) { errorCaught = error; }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function testVersionMismatch(name, action) {
  test(name, async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, `VM_${name.slice(0, 6)}`);
      const error = await expectRepoError(() => action(tx, student));
      expect(error.message).toContain("version mismatch");
    });
  });
}

describe("StudentRepository — setClassesRemaining", () => {
  test("throws studentNotFound for unknown studentId", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        StudentRepository.setClassesRemaining(randomUUID(), 5, tErrors, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  testVersionMismatch("throws on version mismatch (optimistic locking)",
    (tx, student) => StudentRepository.setClassesRemaining(student.id, 3, tErrors, student.version + 999, tx));
});
```

Note `tx` passed as the final arg to `setClassesRemaining(parentId, value, tErrors, expectedVersion, tx)` — positional variance is explicitly warned about in AGENTS Rule 16.

### 2.3 Example: connection-strategy (pure logic) test

`backend/db/test/connection-strategy.test.ts:1-60` — for pure-function tests (no DB), the pattern is env snapshots:
- `snapshotEnv()` / `restoreEnv()` bracket each case via `afterEach`.
- Used to validate `resolveConnectionStrategy`, `resolvePoolMax`, etc., across env-flag combinations.

### 2.4 Example: storage repository test

`backend/db/test/repo/storage/storage.repository.test.ts` exists (along with `learning-resource.test.ts`). Same `runInRollback` + entity-setup pattern.

---

## 3. Test Runner Script (`scripts/run-test/run-test.ts`)

A self-contained wrapper for `bun test` that captures full output to timestamped log files, designed for AI-agent workflows.

### 3.1 Behavior (`scripts/run-test/AGENTS.md` + source)

- **Run**: `bun run scripts/run-test/run-test.ts <test-path>` — spawns `bun --env-file=.env.test test <path> --timeout=60000` and saves `logs/<timestamp>/<relative-path>.log`.
- Uses the explicit Bun binary `~/.bun/bin/bun`.
- Sets `env: { ...process.env, DATABASE_URL: undefined, FORCE_COLOR: "0", NODE_ENV: "test" }` so `.env.test` is authoritative (`run-test.ts:143-148`).
- Script infra messages go to `process.stderr.write` (prefixed `[run-test]`); never `console.*` (fails ESLint).
- No external dependencies — Node built-ins + Bun APIs only (Rule 8).

### 3.2 Flags

| Flag | Purpose |
|---|---|
| `--last` | Re-parse the most recent saved log for the path and print a structured summary (Exit Code / Pass / Fail / Failed Tests) — "optimized for AI agent consumption" |
| `--focus <str>` | With `--last`: filter failed tests by case-insensitive substring match on test names |
| `--feedback <text>` / `--context <text>` | Save a markdown feedback entry to `scripts/run-test/feedback/feedback-<ts>.md` |
| `--list-feedback` | List open feedback items |

### 3.3 Log parser (`parseTestLog`, `run-test.ts:319`)

Strips ANSI, splits lines, scans for summary lines (`^\d+ (pass|fail|expect)$`) and `(fail)` result lines, and collects per-test error-detail blocks. `FAIL_INDICATORS = ["✗", "×", "FAIL", "(fail)"]` (`run-test.ts:203`). Output structure:
```
=== Last Test Result ===
Test File: <relative>
Exit Code: 0
Pass: N
Fail: M
Failed Tests:
  - <name> [FAIL]
    <error detail lines>
```

### 3.4 Script's own tests

`scripts/run-test/tests/`:
- `smoke.test.ts` — `--help`/`-h`/no-args/unknown-flag/`--focus` validation
- `monkey.test.ts` — chaos/edge cases
- `bun-features.test.ts` — Bun test feature coverage
- `failing-examples.test.ts` — intentional failures for parser verification

---

## 4. Parallel Test Execution

Two near-identical parallel runners (one for DB, one for services). Both are top-level-await scripts.

### 4.1 `scripts/run-db-tests-parallel.ts`

- Globs `backend/db/test/**/*.test.ts` via `Bun.Glob`.
- Concurrency = `min(availableParallelism(), queue.length, MAX_DB_WORKERS=8)`. Capped at 8 because each worker spawns a pg pool `max: 3` (test env) → 8×3=24 connections, leaving headroom under PostgreSQL `max_connections` (`run-db-tests-parallel.ts:40-43,57`).
- A simple work-stealing queue: `queue = [...files]`, N `worker()` async loops each `queue.shift()`.
- Per file: `Bun.spawn(["bun", "--env-file=.env.test", "test", file, "--timeout=60000"])`, env `{ ...process.env, FORCE_COLOR:"1", NODE_ENV:"test" }`, drops `DATABASE_URL` locally (but keeps it in CI `isTestCi()`) (`run-db-tests-parallel.ts:138-150`).
- Aggregates pass/fail/expect/test counts by parsing stdout+stderr (ANSI-stripped, summary regex `^\s*(\d+) (pass|fail|expect\(\) calls)`). Collected lines re-emitted with colored ✓/✗.
- On failure, prints a `Failures Summary` block with each file's STDOUT/STDERR.
- Final summary mirrors bun test format: `<n> pass`, `<m> fail`, `Ran N tests across F files. [t.ts]`.
- Exits 1 if any file failed, else 0.

### 4.2 `scripts/run-services-tests-parallel.ts`

Same architecture but globs `backend/services/**/*.test.ts`. Comment notes it "prevents Bun module registry/mock pollution across service test files" (`run-services-tests-parallel.ts:1`). Same `MAX_DB_WORKERS = 8` and DB-connection reasoning.

### 4.3 `scripts/run-integration-tests-parallel.ts`

Exists per `package.json:31` (`test:integration`) but not examined in detail — same family, for `test/integration/`. `test:integration:sequential` uses 120s timeout.

---

## 5. GraphQL Integration Tests (`frontend/common/graphql/test/`)

### 5.1 Layout & infra (flat, shared)

Documented in `frontend/common/graphql/test/AGENTS.md`. Infra files MUST stay flat (alias `@/frontend/common/graphql/test/<infra>`):

```
frontend/common/graphql/test/
├── AGENTS.md
├── helpers.ts            ← loginAndProvision, authenticatedRequest, provisionTestEntities, provisionTestSuperAdmin, ensureDemoUsersForTests, ensureTestSubjectId, cleanup helpers
├── lifecycle.ts          ← setupTestServerLifecycle (start/stop shared Next dev server, heartbeats)
├── testClient.ts         ← Apollo test client (cache-disabled, no-cache, errorPolicy all) + cookie jar
├── testPort.ts           ← dynamic port allocation (prefers 3001, scans 3020–3199, file locks under .graphql-test-ports/)
├── testServer.ts         ← spawn/kill Next.js dev server
├── shared-workers.ts     ← worker heartbeats so parallel bun-test processes share one server
└── <domain>/*.test.ts    ← auth/ billing/ classes/ complaints/ meeting/ notifications/
                            parents/ permissions/ profile/ reports/ resources/ scheduling/
                            students/ suggestions/ teachers/ translations/
```

Sub-directories contain only `*.test.ts` — no `index.ts` barrels (discovered by glob).

### 5.2 `testClient.ts` — the Apollo client

`frontend/common/graphql/test/testClient.ts:86` — a singleton `ApolloClient`:

```typescript
export const testClient = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost/__graphql_test_placeholder__/api/graphql",
    fetch: customFetch as unknown as typeof fetch,   // in-memory cookie jar + Bun.fetch
    headers: { "apollo-require-preflight": "true" },
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "all" },
    query:   { errorPolicy: "all", fetchPolicy: "no-cache" },  // never cached
    mutate:  { errorPolicy: "all" },
  },
});
```

- `errorPolicy: "all"` ⇒ GraphQL errors do **not** throw; assert against `result.error`, not `result.errors` (AGENTS Rule 5).
- `fetchPolicy: "no-cache"` ⇒ every query hits the server.
- `customFetch` merges an in-memory `cookieJar[]` with per-request `Cookie` headers and re-persists `Set-Cookie` after each response. `clearCookies()` empties the jar; `getTestCookie(name)` reads named cookies.

### 5.3 Server lifecycle (`lifecycle.ts`)

`setupTestServerLifecycle()` registers `beforeAll`/`afterAll`:
- First worker spawns the shared Next dev server on a dynamically allocated port; peers detect the running server and reuse it, registering a heartbeat so the owner waits for peers before tearing down (`lifecycle.ts:30-59`).
- Calls `ensureDemoUsersForTests()` (idempotent, shared in-flight promise) to provision canonical demo login users via a `test-helper` mutation.
- On suite completion, decrements `startedSuitesCount`; when zero, schedules `stopServerWhenPeersDone()` (2s debounce) which polls `anyPeerHeartbeatsAlive(ownerPid)` up to 60 rounds before `stopTestServer()`.

### 5.4 Port allocation (`testPort.ts:1-22`)

- `PREFERRED_PORT = 3001`; fallback scans `3020–3199` (PID-skewed ordering per AGENTS).
- `getTestServerPortCandidates()` returns `[3001, 3020, 3021, ...]`.
- Lock files under `.graphql-test-ports/<port>.lock` hold `pid` (released when the holder dies). Optional env `GRAPHQL_TEST_PORT` pins a port for debugging.
- `PROTECTED_APP_PORTS = [3000, 4000]` — never kill dev (3000) or prod start (4000).

### 5.5 Example test (`students/status-tracking.test.ts:1-120`)

```typescript
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { statusTrackingScheduleQueryDocument } from ".../scheduling/schedule.documents";
import { changeStudentStatusMutationDocument } from ".../students/student-lifecycle.documents";
import { authenticatedRequest, loginDemoUser, provisionTestEntities, provisionTestSuperAdmin, ensureTestSubjectId, cleanupTestSuperAdmin, createManualClassEntry } from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { testClient } from "@/frontend/common/graphql/test/testClient";

describe("GraphQL: statusTrackingSchedule query", () => {
  setupTestServerLifecycle();
  let adminToken; let studentId; let teacherId; let teacherToken; let superAdminToken; ...

  test("login as academy_admin and provision test entities", async () => {
    adminToken = await loginDemoUser("academy_admin");
    const entities = await provisionTestEntities(adminToken, "s10status");
    studentId = entities.studentId; teacherId = entities.teacherId; ...
  });

  // helper that encapsulates the login → query → assert-error pattern
  async function expectRoleDenied(role, date) {
    const token = await loginDemoUser(role);
    const result = await testClient.query({ query: ..., variables: {...}, context: { headers: { Authorization: `****** } } });
    expect(result.error).toBeDefined();
    expect(result.data?.statusTrackingSchedule).toBeFalsy();
  }
});
```

Key AGENTS rules:
- **Type-safe GraphQL**: pass imported `TypedDocumentNode`s (run `bun run generate:gqlSchema` + `bun codegen` first). No raw string queries or raw `fetch` POST (Rule 3).
- **Dynamic headers** via Apollo `context: { headers: { "Accept-Language": "en", Cookie: ... } }` (Rule 4).
- **Deduplicate setup** — never copy demo-login/seed logic; use `loginAndProvision` / `authenticatedRequest` from `helpers.ts` (Rules 6, 8).
- **Strict layer separation** — integration tests hit *only* the GraphQL API. Never import `db/repo/`, drizzle schemas (except seed files), or `backend/services/` (Rule 10).
- **Optional chaining**: prefer `result.data?.field` over `if (!result.data || !result.data.field)` (Rule 7).

---

## 6. UI Component Tests (`test/ui/`)

### 6.1 Layout & layers (`test/ui/AGENTS.md`)

All `test:ui*` run with `TEST_SERVER_MODE=production`, preloaded via `test/ui/test-env.ts`.

| Layer | Path | Server | Notes |
|---|---|---|---|
| Component | `test/ui/components/` | None | Happy DOM + mocked Apollo. No browser, no network. |
| E2E | `test/ui/e2e/` | Production (`next start`) | Playwright via `bun:test`. `setupBrowserLifecycle()` → `setupTestServerLifecycle()` |
| Static | `test/ui/mobile-desktop-isolation.test.ts` | None | Import-boundary scans |

`test/ui/components/` ≈ 40 files: `TestWrapper.tsx`, preloads (`happydom-preload.ts`, `next-dynamic-mock.ts`, `jest-dom.d.ts`), `fixtures/`, plus `*.test.tsx` for components (RequirePermission, SessionActivateButton.desktop/.mobile, dashboardContainer, studentHistoryContainer, navigationConfig variants, etc.).

### 6.2 `TestWrapper.tsx` — the mocked Apollo + providers wrapper

`test/ui/components/TestWrapper.tsx:39` — wraps a component for `@testing-library/react` `render()` with:
- `LocaleProvider` + `ThemeContext.Provider` + `CacheProvider` (Emotion LTR/RTL cache) + `ThemeProvider` (MUI) + `ViewportProvider` + `ApolloProvider`.
- `ApolloClient` with `MockLink(mocks)` (no real network), `errorPolicy: "all"`, `fetchPolicy: "no-cache"`.
- `useUserStore.setState({ permissions })` seeds permissions.
- Props: `locale` (default `"ar"`), `themeMode` (`"dark"`), `permissions`, `mocks` (MockedResponse[]), `viewport`.
- `renderWithWrapper(ui, options)` — convenience wrapper.

### 6.3 Example (`RequirePermission.test.tsx`)

```typescript
import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
expect.extend(matchers);
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "..."
import { useUserStore } from "@/frontend/common/stores/userStore";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

test("renders children when user has permission", () => {
  renderWithWrapper(<RequirePermission permissions={[AppPermission.DashboardSearch]}>...</RequirePermission>, { permissions: [AppPermission.DashboardSearch] });
  expect(screen.getByText("Protected Content")).toBeVisible();
});
```

- Uses `@testing-library/jest-dom` matchers extended onto bun `expect`.
- `cleanup()` + store reset in `afterEach`.
- `bun:test` test functions (not jest/vitest).

### 6.4 Preloads (component tests)

`test:ui:components` (`package.json:36`) sets:
```
--preload ./test/ui/test-env.ts
--preload ./test/ui/components/happydom-preload.ts
--preload ./test/ui/components/next-dynamic-mock.ts
```

### 6.5 Static isolation test

`test/ui/mobile-desktop-isolation.test.ts:1-57` — runtime safety net for ESLint boundary rules. Scans `frontend/mobile/views/` and `frontend/desktop/views/` for:
- `.mobile.tsx` files importing `.desktop` files (and vice versa)
- `.mobile.tsx`/`.desktop.tsx` importing `useMediaQuery` from `@mui/material`
Comment-stripping before regex to avoid false positives. This guards against a broken ESLint config letting violations through.

---

## 7. E2E Tests (Playwright via `bun:test`)

### 7.1 Lifecycle (`test/ui/e2e/lifecycle.ts:1-51`)

```typescript
import { chromium } from "playwright";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { getTestBaseUrl } from "..."

let browser: Browser | null = null;
export function setupBrowserLifecycle() {
  setupTestServerLifecycle();             // reuse GraphQL test server (prod mode under test/ui)
  beforeAll(async () => { browser = await chromium.launch({ headless: true }); });
  afterAll(async () => { if (browser) { await browser.close(); browser = null; } });
}

export async function createContext(viewport = { width:1280, height:720 }): Promise<BrowserContext> {
  const ctx = await browser.newContext({ baseURL: getTestBaseUrl(), viewport });
  ctx.setDefaultTimeout(30_000);
  ctx.setDefaultNavigationTimeout(60_000);
  return ctx;
}
export async function createMobileContext() {
  return browser.newContext({ baseURL: getTestBaseUrl(), viewport: { width:375, height:812 }, isMobile:true, hasTouch:true });
}
```

- Built **on top of** the GraphQL test harness — `setupTestServerLifecycle()` is reused. Under `test/ui/`, `testPort.ts` switches `getTestServerMode()` to production → `testServer.ts` spawns `next start` (not `next dev`).
- Requires `bun run build:test` first → `.next-test-prod` bundle (override with `TEST_SERVER_DIST_DIR`).

### 7.2 Login helpers (`test/ui/e2e/helpers.ts`)

- `DEMO_USERS` map of `{academyAdmin, teacher, parent, supervisor, staff, student}` → `{ email, password: "12345678", groupSlug }` sourced from `@/shared/demo-users`.
- `loginAsDemoUser(page, context, groupSlug)` — authenticates via `Bun.fetch` POST to `/api/graphql` with `demoLogin` mutation (NOT Playwright `context.request`), parses `Set-Cookie`, asserts the required auth cookies `["session_id","refresh_token","access_token"]` are present, adds them to the context, then navigates to `/dashboard` + `waitForDashboardReady`.
- Retries on `429` (rate limit) and navigation errors; exponential backoff.
- `AUTH_COOKIE_SECURE=false` required in `.env.test` so cookies work over `http://localhost`.
- Other helpers: `authenticateDemoUser`, `gotoAppRoute`, `closeE2eSession` (5s-close-timeout), `assertElementVisible/Hidden`, `createMobileContext` (390×844 iPhone).

### 7.3 Example (`test/ui/e2e/admin-dashboard.test.ts:1-75`)

```typescript
import { afterEach, describe, expect, test } from "bun:test";
import { closeE2eSession, DEMO_USERS, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();
let context: BrowserContext; let page: Page;
afterEach(async () => { await closeE2eSession(page, context); ... });

describe.serial("Admin Dashboard E2E", () => {
  test("Admin sees search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    const textbox = page.getByRole("textbox");
    await textbox.first().waitFor({ state: "visible" });
    expect(await textbox.first().isVisible()).toBe(true);
  });
  // ... timezone columns, search filter, mobile viewport variants
});
```

Conventions (AGENTS):
- `describe.serial` for ordered suites.
- No `happydom-preload` in E2E (conflicts with Playwright).
- No `waitForTimeout` / `networkidle` — use Playwright auto-waiting assertions.
- Bilingual selectors: `/search schedule availability|البحث عن توفر الجدول/i`.

---

## 8. Quality Gate Pipeline (`scripts/quality-gate.ts`)

### 8.1 Stages — strict order, persisted

`scripts/quality-gate.ts:16-23,148` defines four sequential stages with state persisted to `.quality-gate-state.json`:

```
BASIC_CHECKS   → CODESCENE   → SONAR_SCAN   → SONAR_RESULTS
```

| Stage | Runs | Failure owner |
|---|---|---|
| BASIC_CHECKS | `bun tsgo` → `bun biome:check` → `bun lint` (lint = lint queue client) | quality-gate |
| CODESCENE | `bun codescene` (`scripts/health/codescene/main.ts --scan`) | codescene |
| SONAR_SCAN | `bun sonar-scan` (`scripts/health/sonar/ts/main.ts --scan`); `--skip-sonar` bypasses | sonar-manager |
| SONAR_RESULTS | `checkSonarResults()` → `bun scripts/sonar-manager.ts list-duplicates` + `list-files` | sonar-manager |

- `performStage()` (`quality-gate.ts:112`) runs each stage; on failure it `saveState(stage, owner, "NEED_CONFIRM")` and `process.exit(1)`.
- `runQualityGate()` (`quality-gate.ts:201`) supports `--fresh` (clear state + delete `.scannerwork/sonar-result.json`). If lifecycle is `DONE`, it auto-starts a fresh `BASIC_CHECKS` round.
- `recoverOwnership()` (`quality-gate.ts:150`) — when `state.owner !== "quality-gate"`, re-runs the owning tool to confirm issues are resolved before reclaiming.
- Optional `--timeout=<ms>` hard kill switch.
- On success: `saveState("BASIC_CHECKS","quality-gate","DONE")` + banner `✨✨ ALL QUALITY GATES PASSED! ✨✨`.

### 8.2 Per-file sub-loop (`scripts/health/sub-loop.ts`)

For AI subagents dispatched per-file. Strict progressive order, **short-circuits at the first failure**:

```
tsgo (project-wide, filtered for this file) → biome:check (file) → lint (queue client, file) → codescene --file
```

- `--lifecycle <tsgo|biome|lint|codescene|sonar-results>` controls depth (`LIFECYCLE_ORDER`).
- **Subagents NEVER run Sonar** — hardcoded exclusion in the sub-loop; "no flag to enable it" (`sub-loop.ts:14-15`). Sonar is reserved for the orchestrator (cost).
- `printApplicableRuleFiles()` maps the target file to applicable `.agents/instructions/*.instructions.md` + layer-specific `AGENTS.md` files, plus the root `AGENTS.md`, and prints a "Fix-Or-Report" rule (fix in-file only; cross-file deps get reported up).
- Exit codes: 0 pass, 1 stopped at failure, 2 invalid args / queue server unavailable.

### 8.3 CodeScene health checker (`scripts/health/codescene/`)

- `main.ts` — CLI (`--scan`, `--file <path>`, `--full`, `--reset`, `--update`, `--help`). Installs/verifies `cs` binary, loads token from `token.txt` or `CS_ACCESS_TOKEN` env (Windows registry fallback), verifies token by `cs check` on a sample file.
- `checker.ts:142` `runHealthCheck()` — globs `**/*.{ts,tsx}` under project root, honoring `tsconfig.json` `exclude` + base ignores (`**/.*/**`, `node_modules`, `dist`). Uses an mtime-based incremental cache (`.cache/`); only changed + previously-erroring files are rescanned.
- Concurrency pool `pool(items, concurrency, fn)` capped at `os.cpus().length - 1` (default 4, override `CS_CONCURRENCY`).
- Retries license/network errors up to 3× with exponential backoff.
- Result classification: `perfect` / `warning` / `error`; prints summary table + file lists. On clean result, `updateQualityStateIfOwned()` transfers ownership back to `quality-gate` and advances to `SONAR_SCAN`.
- `config.ts:46` `resolveCodesceneBin()` — resolves `cs` from PATH via `which`/`where.exe` (security: explicit searchCmd), caching the result.

### 8.4 SonarQube runner (`scripts/health/sonar/ts/`)

`main.ts` — `--scan` / `--fresh` / `--result` / `--full` / `--reset`. Orchestrates:
- `docker.ts` — `checkDocker`, `checkDockerCompose`, `startSonarQube` (local SonarQube via Docker Compose — `scripts/health/sonar/docker-compose.yml`).
- `sonarqube-api.ts` — `waitForSonarQube`, `createProject`, `changeAdminPassword`, `generateToken`, `writeConnectionInfo`.
- `scanner.ts` — `installScanner` (`@sonar/scan`), `runAnalysis`.
- `results.ts` — `fetchAndDisplayResults`, `waitForAnalysisProcessing`.
- `cache.ts` — `saveProjectFingerprint`, `isProjectChanged` (skips scan if the project fingerprint is unchanged).
- `state.ts` — `resetSetup`.
- `sonar-project.properties` (root) drives the scanner config.

### 8.5 Sonar results manager (`scripts/sonar-manager.ts`)

Works *only* against existing `.scannerwork/sonar-result.json` — never triggers a new scan. Resolution order (from the embedded AI prompt):
1. `list-duplicates` → fix duplication groups (assign all files in a group to **one** sub-agent).
2. Once duplicates empty: `list-files` → `list-issues --file <path>` → fix → `delete --file <path>` (one sub-agent per file).
3. `--all-duplicates` clears the duplication list in one shot.

JSON shapes: `SonarIssue`, `DuplicationBlock { refPath, from, to, size }`, `DuplicationGroup`, `DuplicatedBlocksDetail`. On empty issues+duplicates, `updateQualityStateIfOwned` reclaims ownership to `quality-gate` and sets `stage=SONAR_RESULTS, lifecycle=NEED_CONFIRM`.

### 8.6 State machine summary

```
QualityState { stage, owner: "quality-gate"|"codescene"|"sonar-manager", lifecycle: "FRESH"|"NEED_CONFIRM"|"DONE", lastRun }
```

Persisted in `.quality-gate-state.json`. Each health tool can hand back ownership when its slice is clean; the orchestrator resumes from `state.stage`.

---

## 9. Lint Queue Server / Client

A serialized-ESLint HTTP server to safely run eslint once at a time when multiple AI subagents run in parallel.

### 9.1 `scripts/lint-queue-config.ts`

Single source of truth:
- `LINT_QUEUE_PORT = 4777` (env `LINT_QUEUE_PORT` overrides).
- `PORT`, `BASE_URL = http://localhost:${PORT}`, `STATUS_URL`, `LINT_URL`.

### 9.2 `scripts/lint-queue-server.ts`

- HTTP server: `POST /lint` and `GET /status`.
- FIFO queue (`queue[]`) gated by a single `running` flag → only **one** eslint process at a time.
- `runLint(files[])` (`server.ts:105`): invokes `~/.bun/bin/bun x eslint --cache --cache-location .eslintcache --concurrency=4 <files>` via `exec` with `NODE_OPTIONS="-r ./scripts/ts6-eslint-patch.cjs"`. No `--fix` (report-only; use `bun run lint:fix` for fixes, which bypasses the queue).
- Request body `{ id: string, files?: string[] }` — `id` is arbitrary caller id for log correlation; `files` empty/omitted ⇒ full-repo lint (eslint invoked with **no file args** so it honors the `files`/`ignores` block in `eslint.config.mjs` — the only fully-ignore-honoring full-repo mode; passing `"."` would bypass some ignores).
- Response `{ success, output, exitCode }`.
- Timeouts: 5min (`300000`) file-scoped, 20min (`1200000`) full-repo (eslint over the whole repo can take 5+ min). Override `LINT_QUEUE_TIMEOUT_MS`.
- `GET /status` → `{ running, queueLength }`.
- Env overrides: `LINT_QUEUE_CONCURRENCY` (default `4`), `LINT_QUEUE_PORT`, `LINT_QUEUE_TIMEOUT_MS`.

### 9.3 `scripts/lint-queue-client.ts`

Typed helpers:
- `requestLint(id, files = [])` — POST, blocks until lint completes, returns `LintResult`.
- `requestFullRepoLint(id)` ⇒ `requestLint(id, [])`.
- `getQueueStatus()` → `{ running, queueLength }`.

### 9.4 Wiring into `package.json`

```json
"lint": "bun -e \"const{requestFullRepoLint}=require('./scripts/lint-queue-client.ts');const r=await requestFullRepoLint('cli');process.stdout.write(r.output||'');process.exit(r.exitCode??0)\""
```
So `bun run lint` **IS** the queue client. Requires the server running: `bun run lint:server` (`~/.bun/bin/bun run scripts/lint-queue-server.ts`).
`lint:fix`: `eslint . --fix --concurrency=auto --cache` — bypasses the queue (only legitimate direct caller of `--fix`).
`ts6-eslint-patch.cjs` is applied via `NODE_OPTIONS` to bridge TS6/TS7 (`@typescript/native-preview`) with eslint (`package.json:56` `postinstall` rewrites `typescript` to v7 fork).

### 9.5 File-scoped lint for tests

Per `backend/db/test/AGENTS.md` Rule 4, for a single file:
```bash
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"db-test","files":["<file>"]}'
```

---

## 10. Biome Configuration (`biome.json`)

Schema `2.5.6`. Key settings (`biome.json`):

- **VCS**: enabled, git, uses ignore file.
- **Files includes** everything except: `frontend/common/graphql/generated`, `**/.ai`, `**/.agents`, `.next*`, `public`. Notably `.storybook/**` IS linted.
- **Formatter** (enabled): `indentStyle: space`, `indentWidth: 2`, `lineWidth: 120`, `lineEnding: lf`, `bracketSpacing: true`.
- **JavaScript formatter**: `quoteStyle: double`, `trailingCommas: es5`, `semicolons: always`, `arrowParentheses: asNeeded`, `bracketSameLine: false`, `quoteProperties: asNeeded`. Parser `unsafeParameterDecoratorsEnabled: true` (for decorators).
- **Linter** (recommended preset) with overrides:
  - `suspicious.noDeprecatedImports: error`
  - `style.useTemplate: off`
  - `correctness.useExhaustiveDependencies: error`, `correctness.useHookAtTopLevel: error` (React rule guardrails).
- **Assist**: `organizeImports: "on"` (import sorting applied).

Scripts (`package.json`): `format` (`biome format --write .`), `biome:check` (`biome check --write --unsafe .`), `biome:lint`, `biome:imports`.

`tsgo` script restores `next-env.d.ts` then runs `tsgo -b --noEmit` — the TS6/7 native-preview type-check gate (`package.json:18`).

---

## 11. ESLint Configuration (`eslint.config.mjs`)

A `defineConfig` flat config composing many layers.

### 11.1 Plugins / extends
- `@eslint/js` recommended, `eslint-config-next` (core-web-vitals + typescript), `react-hooks`, `react-refresh`, `eslint-plugin-sonarjs` (recommended), `eslint-plugin-storybook` (flat/recommended), `typescript-eslint` (recommended, applied to `**/*.{ts,tsx}`).
- `@cspell/eslint-plugin` is **disabled** for performance (commented out).

### 11.2 Global ignores (`globalIgnores`)
All dot-directories anywhere (`**/.*/**`) **except `.storybook`**, plus `.next*`, `node_modules`, `out`, `build`, `dist`, `logs`, `storage`, `scratch`, `draft`, `storybook-static`, `docs`, `*.d.ts`, `next-env.d.ts`, `*.lock`, `*.log`, all `*.md`, `*.html`, `messages/**`, `frontend/common/graphql/generated/**`, `unRefactored_tests/**`.

### 11.3 Core rules (TS/React files)
- React: `react-hooks/recommended` + `react-hooks/set-state-in-effect: off`; `react-refresh/only-export-components: warn`.
- TS: `no-throw-literal: off`; `@typescript-eslint/only-throw-error: off`; `@typescript-eslint/no-unused-vars: error` with all `^_` prefix ignore patterns (args, vars, caught, destructured array).
- `@typescript-eslint/no-non-null-assertion: error` — bans `!`.
- `@typescript-eslint/no-explicit-any: error` — bans `any` (use `unknown`).
- `no-console: error` — use `logger` utility (relaxed for `frontend/utils/logger.ts`, `scripts/**`, `backend/db/scripts/**`, `backend/db/test/**`, `next.config.ts`).
- SonarJS: `no-nested-conditional: off`; `sonarjs/no-unused-vars: off` (strict subset of the TS rule, honors no `^_` pattern → disabled to avoid duplicate false positives; SonarQube Server still surfaces S1481 via scanner).

### 11.4 Architecture-enforcing custom rules (the important ones for a new feature)

**Path alias enforcement**: relative `./` or `../` imports are **banned** outside `index.ts` barrels (and `.storybook`). Use the `@/` alias:
```javascript
"no-restricted-syntax": ["error", {
  selector: "ImportDeclaration[source.value=/^\\.\\.?\\//]",
  message: "Imports must use @/ path alias, not relative ./ or ../ — see AGENTS.md",
}]
```
(file scope: `app/`, `backend/`, `frontend/`, `shared/`, `test/`, `scripts/`, `.storybook/` — **this includes new test files for a cert feature**).

**Layer isolation**:
- `shared/**` must not import `@/frontend/**`, `@/backend/**`, `@/app/**`.
- `frontend/**` must not import `@/backend/**` (use GraphQL/shared/server entry points).
- `backend/**` must not import `@/frontend/**`.
- `backend/db/seeds/**` must not import the DB layer directly — call backend services (bootstrap methods) instead.

**MUI DataGrid/Table restriction** (frontend): banned raw `DataGrid`, `Table*`, `Pagination` everywhere except the owned `*AppDataGrid` wrappers (`appDataGridShared.tsx`, `DesktopAppDataGrid.tsx`, `MobileAppDataGrid.tsx`). Must use `AppDataGrid` + `paginationOptions` or `MobileCardList`.

**Mobile/desktop isolation**:
- `*.mobile.tsx` must not import `*.desktop.tsx` (regex `\.desktop(\\.tsx?)?$`) and vice versa.
- Both tiers must not import `useMediaQuery` or `useViewport` — they are pure presentation; the viewport tier is decided by the parent switcher.

**Person picker rule** (`views/**`): views must use tier `userSelect` Autocompletes + hooks, not directory queries from `sharedDocuments` (`teachersQueryDocument`, `studentsDirectoryQueryDocument`, `parentsDirectoryQueryDocument`, `staffDirectoryQueryDocument`) and not common `*Autocomplete` facades.

**Lazy-translation rules** (Phase 4):
- Tier views (`*.mobile.tsx`/`*.desktop.tsx` outside shared tier UI) must receive labels via props from the ViewModel — no `useAppTranslation` in tier views.
- Client product code (`frontend/**`, `app/**`) must not import `messagesByLocale` directly.
- Product code imports `@/shared/locale` barrel only — no deep `old/` or `beta/` paths.

**Next.js special files**: `react-refresh/only-export-components: off` for `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`, `route.ts`.

**Test relaxations**: UI test files (`test/ui/**`) have `react-refresh/only-export-components: off`. Backend DB tests, scripts, and config have `no-console: off` plus several Sonar rules relaxed (`no-nested-functions`, `no-os-command-from-path`, `no-hardcoded-ip`, `sql-queries`, `no-unnecessary-condition`).

### 11.5 Custom ESLint rules directory

`scripts/eslint-rules/` exists (not opened in detail — likely project-local rule plugins). `scripts/ts6-eslint-patch.cjs` bridges eslint with the TS6/TS7 native-preview parser.

---

## 12. Storybook

**Yes**, Storybook is configured at `.storybook/` (v10.x via `@storybook/nextjs-vite`). `frontend/stores/` is empty/absent in this checkout — Storybook lives at the repo root under `.storybook/` and stories are co-located beside components.

### 12.1 `.storybook/main.ts`

```typescript
const config: StorybookConfig = {
  stories: ["../frontend/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "msw-storybook-addon",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: { alias: { "react-leaflet/package.json": ..., "@": path.resolve(__dirname, "..") } },
      optimizeDeps: { exclude: ["react-leaflet", "@react-leaflet/core"] },
    });
  },
};
```

### 12.2 `.storybook/preview.tsx`

- Global types (toolbar): `locale` (ar/en), `theme` (light/dark), `viewport` (mobile/tablet/desktop). Defaults `ar` / `dark` / `desktop`.
- `loaders: [mswLoader(...)]` — starts an MSW `setupWorker` per story with `onUnhandledRequest: "bypass"`.
- `parameters.msw.handlers: mswHandlers` (from `.storybook/msw-handlers.ts`).
- `parameters.a11y.test: "todo"` — shows a11y violations in UI only (not CI-failing yet).
- `parameters.nextjs.appDirectory: true`.
- `decorators: [withAllProviders]` wrapping every story in `StoryWrapper`.

### 12.3 `.storybook/StoryWrapper.tsx`

Full provider stack mirroring the app:
- `LocaleProvider` + `ThemeContext.Provider` + Emotion `CacheProvider` (LTR/RTL caches `sb-ltr`/`sb-rtl`) + MUI `ThemeProvider` (CSS-vars theme `createAppCssVarsTheme`, `modeStorageKey="sb-theme"` to isolate from the app localStorage key).
- `StorybookColorSchemeBridge` syncs Storybook globals → MUI `useColorScheme()` + DOM `data-theme`/`data-mui-color-scheme`/`dir`/`lang` attributes.
- Seeds `useUserStore` with a mock admin user + ~50 admin AppPermissions (so every story has full permission visibility).
- `isUiComponent` detection (from `frontend/components/ui/` or titles starting `UI/`/`Form/`) wraps content in a centered `Box` with viewport-based `maxWidth`.

### 12.4 Other `.storybook/` files
- `manager.ts` — Storybook manager customization.
- `msw-handlers.ts` — MSW handlers stubbing GraphQL/REST for isolated stories.
- `tsconfig.json` — Storybook-specific TS config.

### 12.5 Scripts (`package.json`)
```json
"storybook": "NODE_OPTIONS='--no-deprecation' storybook dev -p 6006",
"build-storybook": "NODE_OPTIONS='--no-deprecation' storybook build",
```
Storybook is **linted explicitly** (`.storybook/**` is the only dot-dir not in ESLint/Biome ignores) and uses sibling-relative imports within `.storybook/` (the `no-restricted-syntax` path-alias rule is disabled for `.storybook/` files — `eslint.config.mjs:319`). There is a `storybook-static/` directory (build output, ignored from both linters).

devDependencies of note: `storybook@^10.5.5`, `@storybook/nextjs-vite`, addons (a11y, docs, mcp, onboarding, themes, vitest), `@chromatic-com/storybook`, `msw`, `msw-storybook-addon`. Playwright is present (used for E2E + `@vitest/browser-playwright`).

---

## 13. Putting It Together — Certificate Feature Integration Pointers

For a new "certificate" feature, the established patterns to follow:

1. **DB schema** goes in `backend/db/schema/`; repository in `backend/db/repo/`; **100% coverage** repo tests in `backend/db/test/repo/<domain>/` using `runInRollback` + `entity-setup.ts` helpers (extend `entity-setup.ts` with `createTestCertificate`-style helpers as needed). Add `logic/` tests for certificate-issuance workflows.
2. **Backend services** tests in `backend/services/<cert>/` — covered by the parallel services runner (file-isolation prevents Bun module-registry/mock pollution).
3. **GraphQL** documents in `frontend/common/graphql/sharedDocuments/<cert>/` (run `bun run generate:gqlSchema` + `bun codegen`); integration tests in `frontend/common/graphql/test/<cert>/` using `testClient`, `setupTestServerLifecycle`, `loginDemoUser`/`provisionTestEntities`/`authenticatedRequest` from `test/helpers.ts`.
4. **UI components** (.mobile/.desktop tier variants + shared): unit tests in `test/ui/components/` with `renderWithWrapper` + `MockLink`; ensure the mobile/desktop isolation ESLint rules (and the static isolation test) stay satisfied. Add `.stories.tsx` files co-located for Storybook (ar/en, dark/light, mobile/tablet/desktop globals).
5. **E2E** in `test/ui/e2e/` using `setupBrowserLifecycle` + `loginAsDemoUser` + Playwright auto-waiting assertions (no `waitForTimeout`/`networkidle`); run after `bun run build:test`.
6. **Quality gate**: per-file loop via `bun run scripts/health/sub-loop.ts <path> --lifecycle codescene`; full gate via `bun run quality-gate` (tsgo → biome → lint → codescene → sonar). Keep a `lint:server` running for the queue.
7. **Conventions**: `@/` alias only (no relative imports outside barrels), `bun:test` (never jest/vitest globals), `expect(...).toBeVisible()` with `@testing-library/jest-dom`, RTL/Arabic-bilingual selectors in E2E, no `console.*`, no `any`/`!`. Assert error substrings on the *translated* message (never raw i18n keys), and pass `tx` to every repo call inside `runInRollback`.

---

## Key File Index

| Concern | File |
|---|---|
| DB test rules | `backend/db/test/AGENTS.md` |
| `runInRollback` / `testInRollback` / RLS | `backend/db/test/test-utils.ts` |
| Entity-setup helpers | `backend/db/test/entity-setup.ts` |
| Sample repo test | `backend/db/test/repo/students/student.repository.test.ts` |
| Pure-logic test | `backend/db/test/connection-strategy.test.ts` |
| Test runner wrapper | `scripts/run-test/run-test.ts` |
| Test runner rules | `scripts/run-test/AGENTS.md` |
| Parallel DB runner | `scripts/run-db-tests-parallel.ts` |
| Parallel services runner | `scripts/run-services-tests-parallel.ts` |
| Quality-gate orchestrator | `scripts/quality-gate.ts` |
| Per-file sub-loop | `scripts/health/sub-loop.ts` |
| CodeScene checker | `scripts/health/codescene/{main,checker,config}.ts` |
| Sonar runner | `scripts/health/sonar/ts/main.ts` |
| Sonar results manager | `scripts/sonar-manager.ts` |
| Lint queue server | `scripts/lint-queue-server.ts` |
| Lint queue client | `scripts/lint-queue-client.ts` |
| Lint queue config | `scripts/lint-queue-config.ts` |
| Biome config | `biome.json` |
| ESLint config | `eslint.config.mjs` |
| GraphQL test rules | `frontend/common/graphql/test/AGENTS.md` |
| Apollo test client + cookies | `frontend/common/graphql/test/testClient.ts` |
| Test server lifecycle | `frontend/common/graphql/test/lifecycle.ts` |
| Dynamic port allocation | `frontend/common/graphql/test/testPort.ts` |
| GraphQL test helpers | `frontend/common/graphql/test/helpers.ts` |
| Sample GraphQL test | `frontend/common/graphql/test/students/status-tracking.test.ts` |
| UI test rules | `test/ui/AGENTS.md` |
| Component test wrapper | `test/ui/components/TestWrapper.tsx` |
| Sample component test | `test/ui/components/RequirePermission.test.tsx` |
| Mobile/desktop isolation test | `test/ui/mobile-desktop-isolation.test.ts` |
| E2E lifecycle (Playwright) | `test/ui/e2e/lifecycle.ts` |
| E2E login helpers | `test/ui/e2e/helpers.ts` |
| Sample E2E test | `test/ui/e2e/admin-dashboard.test.ts` |
| Storybook config | `.storybook/main.ts` |
| Storybook preview | `.storybook/preview.tsx` |
| Storybook story wrapper | `.storybook/StoryWrapper.tsx` |
| Test scripts | `package.json` (scripts: test*) |
