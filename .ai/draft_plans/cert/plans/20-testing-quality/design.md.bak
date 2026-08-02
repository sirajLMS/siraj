# Plan 20 — Testing & Quality: Design

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Testing & Quality Assurance |
| Plan # | 20 |
| Depends On | Plans 1–19 (all prior plans) |
| Related Docs | `MASTER_ARCHITECTURE.md`, `siraj_analysis/10-testing-quality-patterns.md`, `siraj_analysis/01-db-schema-patterns.md` |
| Requirements | `requirements.md` (same directory) |

---

## 1. Architecture Overview

### Layer Position

This plan does not introduce new application code — it tests code built across Plans 1–19. The test artifacts are distributed across all existing test layers:

```
┌─────────────────────────────────────────────────────────┐
│                    E2E (Playwright)                       │
│  test/ui/e2e/cert/ — production server, full lifecycle    │
├─────────────────────────────────────────────────────────┤
│              UI Component Tests (Happy DOM)               │
│  test/ui/components/cert/ — mocked Apollo, no server      │
├─────────────────────────────────────────────────────────┤
│           GraphQL Integration Tests                        │
│  frontend/common/graphql/test/cert/ — shared dev server   │
├─────────────────────────────────────────────────────────┤
│              Service Tests (Bun:test)                     │
│  backend/services/cert/test/ — parallel runner, mocked DB │
├─────────────────────────────────────────────────────────┤
│           DB Repository Tests (runInRollback)             │
│  backend/db/test/repo/cert/ — 100% coverage, real DB     │
│  backend/db/test/logic/cert/ — transaction workflows      │
├─────────────────────────────────────────────────────────┤
│              Entity Setup Helpers                         │
│  backend/db/test/entity-setup.ts — cert helpers added     │
├─────────────────────────────────────────────────────────┤
│              Storybook Stories                            │
│  frontend/**/cert/**/*.stories.tsx — visual canvas        │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Entity Setup Helpers (entity-setup.ts)
    ↓ used by
DB Repository Tests (runInRollback, real DB, tx passed to all methods)
    ↓ validates
Repository Layer (backend/db/repo/cert/)
    
Service Tests (mocked repos or real DB via runInRollback)
    ↓ validates
Service Layer (backend/services/cert/)

GraphQL Integration Tests (testClient → shared Next.js dev server)
    ↓ validates
GraphQL API (backend/graphql/pothos/ → services → repos → DB)

UI Component Tests (renderWithWrapper + MockLink, no server)
    ↓ validates
Frontend Components (frontend/views/dashboard/certificates/)

E2E Tests (Playwright → production Next.js server)
    ↓ validates
Full Stack (browser → Next.js → GraphQL → services → repos → DB)
```

---

## 2. Design Decisions

### DD-1: Entity-Setup Helper Extension Pattern

**Decision**: Add certificate-specific helpers to the existing `backend/db/test/entity-setup.ts` file rather than creating a separate `cert-entity-setup.ts`.

**Rationale**: Siraj convention (per `siraj_analysis/10-testing-quality-patterns.md` §1.3) mandates all entity creation helpers in a single `entity-setup.ts` file. Helpers accept `tx: DBTransaction` as first parameter and an `overrides` partial for `$inferInsert`. Test files use the `TestDb = DBTransaction | typeof db` union type so helpers work inside and outside transactions.

**Alternatives Considered**:
- Separate `cert-entity-setup.ts` file — rejected: breaks Siraj convention, complicates imports, ESLint path-alias rules require `@/` alias anyway
- Inline test data in each test — rejected: leads to CodeScene duplication, violates Rule 8 (deduplicate setup)

### DD-2: DB Repository Test Structure

**Decision**: Create one test file per repository in `backend/db/test/repo/cert/`, following the existing domain-directory pattern (matching `repo/students/`, `repo/billing/`, etc.).

**Rationale**: `backend/db/test/AGENTS.md` Rule 11 mandates the `repo/` directory for 100% coverage isolation tests and `logic/` for business-logic workflows. Each test file wraps every test in `runInRollback` and passes `tx` to all repository methods.

**Test File Layout**:
| Test File | Repository Under Test | Key Test Categories |
|-----------|----------------------|---------------------|
| `certificate.repository.test.ts` | `CertificateRepository` | CRUD, pagination, search, filters, softDelete, version mismatch, idempotency |
| `template.repository.test.ts` | `TemplateRepository` | CRUD, version chain, status transitions, softDelete |
| `template-element.repository.test.ts` | `TemplateElementRepository` | CRUD, findByTemplateId, ordering, type-specific fields |
| `template-variable.repository.test.ts` | `TemplateVariableRepository` | CRUD, findByTemplateId, type-specific, default values |
| `recipient-group.repository.test.ts` | `RecipientGroupRepository` | CRUD, student assignment, variable values, bulk |
| `verification.repository.test.ts` | `VerificationRepository` | createLog, findByCertificateId, result variants |
| `category.repository.test.ts` | `CategoryRepository` | CRUD, tree operations, reorder, cascading soft delete |

### DD-3: Error Assertion Pattern

**Decision**: Use the `expectRepoError` helper pattern (try/catch wrapper) for all error-path tests in `runInRollback` blocks. Assert on translated message substrings from `getServerTranslations("en").certificatesTranslations.errors`.

**Rationale**: `backend/db/test/AGENTS.md` Rule 3 bans `expect(...).rejects.toThrow()` inside `runInRollback` because it deadlocks the transaction. The helper catches the error, asserts its existence, and returns it for message substring assertions. Substring matching (e.g., `"not found"`, `"version mismatch"`) avoids coupling tests to complete message text while verifying the correct error path.

**Error Assertion Flow**:
1. Import `getServerTranslations` from `@/shared/locale/server-graphql`
2. In `beforeAll`, initialize `tErrors` with `getServerTranslations("en").certificatesTranslations.errors`
3. For error tests, wrap the call in `expectRepoError` helper
4. Assert `error.message` contains expected substring from translated message

### DD-4: Service Test Isolation

**Decision**: Service tests live in `backend/services/cert/test/` and run via the parallel services runner (`scripts/run-services-tests-parallel.ts`). Each service test file is isolated by Bun's module registry (file-level isolation prevents mock pollution).

**Rationale**: The parallel services runner spawns each test file as a separate Bun process, preventing `bun:test` module-registry/mock pollution across service test files (per `siraj_analysis/10-testing-quality-patterns.md` §4.2). Service tests use either:
- **Real DB via `runInRollback`**: For services that primarily orchestrate repos (generation pipeline, verification logging)
- **Mocked repository namespaces**: For services with complex business logic where DB state is not under test (template version snapshots, cache invalidation logic)

**Mocking Strategy**:
| Service | Test Approach | Mocks Used |
|---------|--------------|------------|
| Generation pipeline | Real DB via `runInRollback` | PDF render function mocked (verify call params) |
| Verification | Real DB via `runInRollback` | None (full DB round-trip) |
| Template management | Real DB via `runInRollback` | None (version snapshot tests need DB state) |
| Entity cache | Mocked repository namespace | Repository methods memoized, cache TTL controlled |

### DD-5: GraphQL Integration Test Architecture

**Decision**: Certificate GraphQL tests live in `frontend/common/graphql/test/cert/` and reuse the existing shared test infrastructure (`testClient`, `setupTestServerLifecycle`, `loginDemoUser`, `provisionTestEntities`).

**Rationale**: Per `frontend/common/graphql/test/AGENTS.md`, all GraphQL integration tests must use `testClient` (Apollo with `errorPolicy: "all"`, `fetchPolicy: "no-cache"`), not raw `fetch` POST. The shared Next.js dev server is started by `setupTestServerLifecycle()` and reused across concurrent Bun test processes via the heartbeat mechanism.

**Test Infrastructure Reuse**:
| Infrastructure | Source | Purpose |
|----------------|--------|---------|
| `testClient` | `test/testClient.ts` | Apollo client with cookie jar, no-cache |
| `setupTestServerLifecycle` | `test/lifecycle.ts` | Before/afterAll server start/stop |
| `loginDemoUser` | `test/helpers.ts` | Authenticate as demo user, get session |
| `provisionTestEntities` | `test/helpers.ts` | Create test student/teacher/parent |
| `authenticatedRequest` | `test/helpers.ts` | Wrap query with auth headers |
| `cleanupTestSuperAdmin` | `test/helpers.ts` | Cleanup provisioned super admin |

**Auth Scope Test Pattern**:
- Login as role with permission → assert mutation succeeds
- Login as role without permission → assert `result.error` is defined and `result.data` is falsy
- No login (unauthenticated) → assert public verification query returns data, but private queries return error

### DD-6: DataLoader Test Verification

**Decision**: DataLoader N+1 prevention tests assert on the _query count_ by instrumenting the test server's DB query logger, not by inspecting SQL logs.

**Rationale**: Siraj's DataLoader pattern (per `docs/graphql/dataloader-batching.md`) wraps repository `findById` calls in a `DataLoader` that batches by ID. To verify N+1 prevention:
1. Execute a list query returning N certificates
2. The resolver resolves each certificate's template via `ctx.dataLoaders.templates.load(templateId)`
3. The DataLoader batches all N template IDs into a single `findByIds` call
4. Assert that the query log shows exactly 1 additional query for templates, not N

**Alternative Considered**: Assert on response time (batch should be faster) — rejected: flaky in CI, not deterministic.

### DD-7: UI Component Test Architecture

**Decision**: Use the existing `TestWrapper.tsx` + `renderWithWrapper` pattern with `MockLink` for mocked Apollo responses. No real server is started. Component tests run with Happy DOM preload.

**Rationale**: Per `test/ui/AGENTS.md`, component tests use `@testing-library/react` with `bun:test`, wrapped in `TestWrapper` which provides `LocaleProvider`, `ThemeProvider`, `ApolloProvider` with `MockLink`. This isolates component rendering and interaction from backend state. Mocked responses are defined per-test using `MockedResponse[]`.

**Mock Structure**:
| Component Test | Mocked GraphQL Operations | States Tested |
|----------------|--------------------------|---------------|
| Template list | `certificateTemplatesQueryDocument` (success, error, empty) | rendering, filters, pagination, loading, error, empty |
| Certificate list | `certificatesQueryDocument` (success with N rows, error, empty) | rendering, bulk select, status badges, filters, pagination |
| Generation dialog | `generateCertificateMutationDocument` (success, error), `recipientGroupsQueryDocument` | form interaction, submit, progress, success, error |
| Verification page | `verifyCertificateQueryDocument` (valid, revoked, expired, not-found, loading) | all result states, bilingual RTL/LTR, share |

### DD-8: E2E Test Architecture

**Decision**: E2E tests use `setupBrowserLifecycle` (Playwright + production Next.js server) and `loginAsDemoUser` for authentication. Tests run in `describe.serial` order. Requires `bun run build:test` first.

**Rationale**: Per `test/ui/AGENTS.md` and `siraj_analysis/10-testing-quality-patterns.md` §7, E2E tests:
- Use Playwright via `bun:test` (not Vitest)
- Reuse `setupTestServerLifecycle` from GraphQL test harness but in production mode
- Use `loginAsDemoUser` helper (Bun.fetch POST to `/api/graphql`, not Playwright `context.request`)
- Use Playwright auto-waiting assertions (no `waitForTimeout`, no `networkidle`)
- Use bilingual selectors: `/search schedule availability|البحث عن توفر الجدول/i`
- `closeE2eSession(page, context)` in `afterEach`
- `describe.serial` for ordered test suites

**E2E Test Flow**:
1. `setupBrowserLifecycle()` → starts production Next.js server, launches Chromium
2. `createContext()` / `createMobileContext()` → new browser context with base URL
3. `loginAsDemoUser(page, context, groupSlug)` → authenticate via GraphQL, set cookies
4. Navigate to certificate routes, perform interactions
5. Auto-waiting assertions (Playwright `expect` + `getByRole`/`getByText`)
6. `closeE2eSession(page, context)` → close page and context

### DD-9: Storybook Story Design

**Decision**: Stories are co-located beside components as `*.stories.tsx` files. Stories provide visual canvas for interactive design review and regression baseline.

**Rationale**: Per `.storybook/main.ts` (`siraj_analysis/10-testing-quality-patterns.md` §12.1), Storybook globs `../frontend/**/*.stories.@(js|jsx|mjs|ts|tsx)`. Stories use MSW for mocking GraphQL (via `.storybook/msw-handlers.ts`). Each story provides `ar`/`en` locale and `light`/`dark` theme variants.

**Story Variants Per Component**:
| Story | Variants | Decorators |
|-------|----------|------------|
| Template list | populated / empty / loading / error | `withAllProviders` (auto) |
| Certificate list | populated / empty / loading / error | `withAllProviders` |
| Generation dialog | open-form / open-submitting / open-success / open-error | `withAllProviders` |
| Verification page | valid / revoked / expired / not-found | `withAllProviders` |
| Visual canvas | with-elements / empty / grid-on / grid-off | `withAllProviders` |
| Element editor | text / image / qr / shape | `withAllProviders` |
| Variable manager | with-variables / empty / type-specific | `withAllProviders` |
| Status badge | draft / pending / issued / revoked / expired | `withAllProviders` |

---

## 3. Test Data Strategy

### 3.1 Entity-Setup Helper Architecture

Certificate test entity helpers follow the existing `entity-setup.ts` pattern. All helpers:
- Accept `tx: DBTransaction` as the first parameter (the `TestDb` union type allows `typeof db` for non-transactional use)
- Accept an optional `overrides` partial typed as the table's `$inferInsert` type
- Default all required columns with sensible values (UUIDs via `randomUUID()`, timestamps via `new Date()`)
- Return the inserted row (full `$inferSelect` type)
- `setupCertificateTestEntities` composes individual helpers to create a full test rig

**Helper Composition**:
```
setupCertificateTestEntities(tx, prefix)
  ├── createTestCertificateCategory(tx) → { category }
  ├── createTestCertificateTemplate(tx, { categoryId: category.id }) → { template }
  ├── createTestTemplateElement(tx, template.id) × 2 → { element1, element2 }
  ├── createTestTemplateVariable(tx, template.id) × 2 → { variable1, variable2 }
  ├── createTestRecipientGroup(tx, template.id) → { group }
  ├── createTestRecipientGroupItem(tx, group.id) → { groupItem } (auto-creates student)
  ├── createTestCertificate(tx, template.id, student.id) → { certificate }
  └── createTestVerificationLog(tx, certificate.id) → { verification }
  returns: { category, template, element1, element2, variable1, variable2, group, groupItem, student, certificate, verification }
```

### 3.2 Test Data Isolation

- All DB tests use `runInRollback` — no test data persists beyond the transaction
- All entity data is created within the transaction via helpers — never queries seed data
- Pre-existing data is accounted for by fetching `existingCount` before asserting (Rule 12)
- `setupStudent` / `setupTeacher` from existing `entity-setup.ts` are reused inside `setupCertificateTestEntities`

### 3.3 Localization Helper

The existing `loc(en, ar?)` helper from `entity-setup.ts` is reused for certificate JSONB localized columns (e.g., `certificate_categories.name` which stores `{ en, ar }`).

---

## 4. Mocking Strategy

### 4.1 Service Test Mocking

| Layer | Mock Strategy | Rationale |
|-------|--------------|-----------|
| PDF render function | Mocked: verify called with template ID + certificate data | PDF rendering (Plan 6) is slow and tested separately; service tests verify orchestration |
| Storage upload | Mocked: verify signed URL returned | File I/O is slow and unreliable in tests |
| Email notification | Mocked: verify called with recipient + subject | External SMTP integration tested separately |
| Repository layer | Real DB via `runInRollback` for pipeline/verification; mocked for cache logic | Pipeline tests need real DB state transitions; cache tests need deterministic cache behavior |

### 4.2 GraphQL Integration Test Mocking

No mocking at the service/repository level — integration tests exercise the full stack from GraphQL resolver through service, repository, and real database. The shared dev server connects to the test database. Data cleanup happens via `cleanupTestSuperAdmin` and idempotent test entity creation.

### 4.3 UI Component Test Mocking

| Layer | Mock Strategy |
|-------|--------------|
| Apollo Client | `MockLink` with `MockedResponse[]` per test — each mock defines query, variables, and response |
| Router | Implicit via Happy DOM (no real routing) |
| User store | `useUserStore.setState({ permissions })` seeded in `TestWrapper` |
| Clipboard | `navigator.clipboard.writeText` mocked via `vi` or bun mock for share button tests |

### 4.4 E2E Test Mocking

No mocking — E2E tests execute against the real production build. The only setup is authentication via `loginAsDemoUser` and entity provisioning via GraphQL mutations.

---

## 5. Error Handling Strategy

### 5.1 DB Repository Test Errors

All repository error paths tested via the `expectRepoError` try/catch helper:
1. Call the repository method with invalid parameters (e.g., unknown ID)
2. Catch the thrown error
3. Assert error exists (`expect(error).not.toBeNull()`)
4. Assert error message contains translated substring (e.g., `expect(error.message).toContain("not found")`)
5. Never use `expect(...).rejects.toThrow()` (deadlocks `runInRollback`)

### 5.2 Service Test Errors

Service tests verify error handling by:
1. Calling the service method with invalid inputs
2. Wrapping in try/catch (same pattern as repo tests)
3. Asserting the error message contains the expected translated substring
4. Asserting no side effects occurred (e.g., no certificate created on error path)

### 5.3 GraphQL Integration Test Errors

Integration tests assert on Apollo `result.error`:
1. Execute mutation/query via `testClient`
2. Assert `result.error` is defined for auth scope failures
3. Assert `result.data?.<field>` is falsy when errors occur
4. Assert error message content from the GraphQL error response

### 5.4 UI Component Test Errors

Component tests assert on error rendering:
1. Provide a mocked Apollo response with `errors` array
2. Assert error state component is visible (`screen.getByText(...)`)
3. Assert error message text matches expected translated content

---

## 6. i18n Design

### 6.1 Namespace Structure

Test-specific translations live in the existing `certificates.errors` namespace defined by Plans 3–4. The test suite loads these via `getServerTranslations("en")` for error substring assertions.

**Translation keys used in test assertions** (from REQ-i18n in requirements.md):

| Key | Used In | Assertion Substring |
|-----|---------|---------------------|
| `notFound` | DB repo tests, GraphQL tests | `"not found"` |
| `templateNotFound` | DB repo tests, service tests | `"not found"` |
| `versionMismatch` | DB repo tests | `"version mismatch"` |
| `alreadyRevoked` | Service tests, GraphQL tests | `"already revoked"` |
| `notPublished` | Service tests | `"not published"` |
| `expiredCode` | Verification service test | `"expired"` |
| `invalidCode` | Verification service test | `"invalid"` |
| `missingRequiredVariable` | Generation service test | `"required variable"` |
| `groupEmpty` | Generation service test | `"empty"` |
| `alreadyGenerated` | Generation service test | `"already generated"` |

### 6.2 Locale in Tests

- DB tests: `getServerTranslations("en")` for English error substrings (deterministic)
- UI component tests: `TestWrapper` defaults to `locale="ar"` (Arabic RTL); also test `locale="en"` for LTR
- E2E tests: bilingual selectors `/English text|النص العربي/i`; test both `ar` and `en` locales for verification page
- Storybook stories: both `ar` and `en` locale variants, `light` and `dark` theme variants

---

## 7. Quality Gate Integration

### 7.1 Per-File Quality Loop

Every test file created in this plan must pass the per-file quality loop before being committed:

**For DB test files** (`backend/db/test/repo/cert/*.test.ts`, `backend/db/test/logic/cert/*.test.ts`):
1. `bun tsgo` — type check
2. `bun biome:check` — format + lint
3. Lint queue client for the specific file (via `curl` POST to `http://localhost:${LINT_QUEUE_PORT}/lint`)
4. `bun codescene --file <path>` — CodeScene health (if available)

**For service test files** (`backend/services/cert/test/*.test.ts`):
Same loop as DB test files.

**For GraphQL test files** (`frontend/common/graphql/test/cert/*.test.ts`):
Same loop. Additionally, `bun run generate:gqlSchema` + `bun codegen` must be up to date (document imports must resolve).

**For UI test files** (`test/ui/components/cert/*.test.tsx`):
Same loop.

**For E2E test files** (`test/ui/e2e/cert/*.test.ts`):
Same loop.

**For Storybook stories** (`frontend/**/*.cert.stories.tsx`):
Same loop.

### 7.2 Full Quality Gate

After all test files are created, run the full quality gate:
1. `bun quality-gate` — orchestrates tsgo → biome → lint → codescene → sonar sequentially
2. If CODESCENE fails: run `bun run codescene --file <path>` for flagged files
3. If SONAR_RESULTS fails: use `bun scripts/sonar-manager.ts` (read-only, no new scan)
4. Re-run `bun quality-gate` to resume from last failed stage

### 7.3 Test Execution Verification

After all test files are created, verify the test suites pass:
1. `bun run test:db` — DB repository tests (parallel runner)
2. `bun run test:services` — Service tests (parallel runner)
3. `bun run test:graphql` — GraphQL integration tests (shared dev server)
4. `bun run test:ui:components` — UI component tests (Happy DOM)
5. `bun run build:test` then `bun run test:ui:e2e` — E2E tests (production build)
6. `bun run build-storybook` — Storybook build (visual stories)

---

## 8. AGENTS.md & Instruction File Mapping

### 8.1 Files Created by This Plan and Their Applicable Rules

| File Pattern | AGENTS.md Files | Instruction Files |
|---------------|----------------|-------------------|
| `backend/db/test/repo/cert/*.test.ts` | `AGENTS.md` (root), `backend/db/test/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| `backend/db/test/logic/cert/*.test.ts` | `AGENTS.md` (root), `backend/db/test/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| `backend/db/test/entity-setup.ts` (modified) | `AGENTS.md` (root), `backend/db/test/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| `backend/services/cert/test/*.test.ts` | `AGENTS.md` (root), `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| `frontend/common/graphql/test/cert/*.test.ts` | `AGENTS.md` (root), `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md`, `tests.instructions.md` |
| `test/ui/components/cert/*.test.tsx` | `AGENTS.md` (root), `test/ui/AGENTS.md` | `frontend.instructions.md`, `tests.instructions.md` |
| `test/ui/e2e/cert/*.test.ts` | `AGENTS.md` (root), `test/ui/AGENTS.md` | `frontend.instructions.md`, `tests.instructions.md` |
| `frontend/**/cert/**/*.stories.tsx` | `AGENTS.md` (root), `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |

### 8.2 Key Rules to Enforce

From `backend/db/test/AGENTS.md`:
1. Every DB test must run inside `runInRollback` (Rule 1)
2. Never use `expect(...).rejects.toThrow()` inside `runInRollback` — use `expectRepoError` (Rule 3)
3. Use `bun:test` only — no Jest/Vitest imports (Rule 6)
4. Always create test data via entity-setup helpers — never query seed data (Rule 15)
5. Verify helper signatures before calling (Rule 17)
6. Always check schema columns before inserting (Rule 18)
7. `repo/` tests require 100% coverage (Rule 14)
8. Account for pre-existing data when asserting counts (Rule 12)
9. Type `tx` params as `DBTransaction`, never `any` (Rule 1)
10. Don't call `getServerTranslations` directly in tests — use `expectRepoError` and assert substrings (Rule 19)

From `frontend/common/graphql/test/AGENTS.md`:
1. Pass imported `TypedDocumentNode`s (Rule 3)
2. Use dynamic headers via Apollo `context` (Rule 4)
3. Deduplicate setup — use `loginAndProvision` / `authenticatedRequest` (Rules 6, 8)
4. Strict layer separation — hit only GraphQL API (Rule 10)
5. `errorPolicy: "all"` — assert against `result.error` (Rule 5)

From `test/ui/AGENTS.md`:
1. Component tests use Happy DOM + mocked Apollo, no server
2. E2E tests use Playwright via `bun:test`, production server
3. No `waitForTimeout` / `networkidle` — Playwright auto-waiting assertions
4. Bilingual selectors in E2E
5. `describe.serial` for ordered E2E suites
6. Mobile/desktop isolation test must still pass

---

## 9. Data Model References

### Tables Touched by Test Files

| Test Category | Tables Under Test | Repositories Under Test |
|---------------|-------------------|------------------------|
| DB repo tests | `certificate_categories`, `certificate_templates`, `certificate_template_elements`, `certificate_template_variables`, `certificate_recipient_groups`, `certificate_recipient_group_items`, `certificates`, `certificate_verifications` | `CertificateCategoryRepository`, `CertificateTemplateRepository`, `CertificateTemplateElementRepository`, `CertificateTemplateVariableRepository`, `CertificateRecipientGroupRepository`, `CertificateRepository`, `CertificateVerificationRepository` |
| DB logic tests | All above + `students` (for recipient assignment) | All above (transactional workflows) |
| Service tests | All above (via repos) | All above (via repos) + PDF render, storage, email mocks |
| GraphQL tests | All above (via full stack) | All above (via full stack) |
| UI component tests | None (mocked Apollo) | None (mocked Apollo) |
| E2E tests | All above (via production server) | All above (via production server) |

### Existing Tables Reused

| Table | Usage in Tests | Helper |
|-------|----------------|--------|
| `users` | Teacher/admin authentication in DB and logic tests | `createTestUser`, `setupTeacher` |
| `teachers` | Template creator / certificate issuer | `createTestTeacher`, `setupTeacher` |
| `students` | Recipient in recipient groups and certificates | `createTestStudent`, `setupStudent` |
| `parents` | Student's parent (required by `setupStudent`) | `createTestParent` |
| `permissions` | Permission scoping in GraphQL and service tests | `createTestPermission` |

---

## 10. Outcome & Knowledge Transfer Protocol

### 10.1 What This Plan Learns

During test creation, the implementer discovers:
- Whether entity-setup helper signatures match repository method signatures (positional `tx` variance per AGENTS Rule 16)
- Whether GraphQL resolver auth scopes correctly match AppPermission entries
- Whether DataLoader batch sizes are correct for N+1 prevention
- Whether E2E selectors need bilingual variants (Arabic-first default locale)

### 10.2 What This Plan Documents

- Test directory structure added to AGENTS.md files
- Entity-setup helper signatures documented inline (JSDoc)
- Test execution commands verified and documented
- Known test limitations (e.g., PDF rendering mocked in service tests)

### 10.3 Knowledge Propagation

All knowledge propagation tasks are deferred to Plan 21 (Knowledge Propagation). This plan focuses on test creation only. Plan 21 will:
- Update `backend/db/test/AGENTS.md` with cert test directory refs
- Update `frontend/common/graphql/test/AGENTS.md` with cert test directory ref
- Update `test/ui/AGENTS.md` with cert test refs
- Create `.ai/draft_plans/cert/plans/20-testing-quality/outcome/cert-testing-learnings.md` with outcomes from this plan (per the spec-driven-development skill outcome-protocol; `cert-testing-learnings.md` is a cross-task summary outcome doc)

---

## Reality Check Notes

Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **Test directories & naming**:
  - `backend/db/test/repo/<domain>/*.test.ts` (e.g. existing `student.repository.test.ts`, `user.repository.test.ts`) — plan's `backend/db/test/repo/cert/<entity>.repository.test.ts` matches the `{entity}.repository.test.ts` convention.
  - `backend/db/test/logic/<domain>/*.test.ts` (e.g. existing `billing/billing-safeguards.test.ts`, `billing/payment-idempotency.test.ts`) — plan's `backend/db/test/logic/cert/*.test.ts` matches.
  - `backend/services/<domain>/test/` subdir convention exists (`auth/test/`, `billing/test/`, etc.) — plan's `backend/services/cert/test/*.test.ts` matches.
  - `frontend/common/graphql/test/<domain>/*.test.ts` (existing `auth/`, `billing/`, `classes/`, … dirs) — plan's `frontend/common/graphql/test/cert/*.test.ts` matches.
  - `test/ui/components/` and `test/ui/e2e/` exist with the exact conventions documented in `test/ui/AGENTS.md`. Plan's `test/ui/components/cert/*.test.tsx` and `test/ui/e2e/cert/*.test.ts` match.
- **Test runner scripts** (verified against `package.json`): `test:db` (parallel via `scripts/run-db-tests-parallel.ts`), `test:services` (parallel), `test:graphql` (shared dev server, dev mode), `test:ui:components` (Happy DOM, preloads `test-env.ts`/`happydom-preload.ts`/`next-dynamic-mock.ts`), `test:ui:e2e` (production server, **requires `build:test` first**), `build:test`. Plan's command usage (T26/PhaseE) is accurate.
- **`runInRollback`**: exported from `@/backend/db/test/test-utils` (verified). Plan correctly wraps all DB repo/logic tests in it.
- **GraphQL test helper exports** all verified to exist in `frontend/common/graphql/test/`: `testClient` (`testClient.ts`), `setupTestServerLifecycle` (`lifecycle.ts`), `loginDemoUser`, `provisionTestEntities`, `loginAndProvision` (`helpers.ts`), `assertOperationDenied`, `expectMutationError`. Plan's import statements are valid.
- **UI test helper exports** all verified to exist: `TestWrapper` + `renderWithWrapper` (`test/ui/components/TestWrapper.tsx`), `setupBrowserLifecycle` + `createContext` + `createMobileContext` (`test/ui/e2e/lifecycle.ts`), `loginAsDemoUser` + `DEMO_USERS` + `closeE2eSession` + `authenticateDemoUser` (`test/ui/e2e/helpers.ts`). Plan's E2E imports (T23/T24/T25) are valid.
- **`build:test` before E2E**: Plan correctly prescribes `bun run build:test` then `bun run test:ui:e2e` (matches `test/ui/AGENTS.md` "E2E tests DO require build:test").
- **AGENTS.md / instruction file references**: all referenced files exist (`backend/db/test/AGENTS.md`, `backend/db/repo/AGENTS.md`, `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `test/ui/AGENTS.md`, `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md`, `frontend/views/AGENTS.md` — which exists at the top level).
- **Entity-setup helpers** `createTestCertificate` / `setupCertificateTestEntities` referenced by T2 are NEW helpers to be ADDED to `backend/db/test/entity-setup.ts` (T2 modifies that file); the generic `setupTestEntities` already exists there. This is intentional (additive), not a path mismatch.

### Corrections Made
1. **Knowledge-propagation outcome path**: `design.md` §10.3 and `tasks.md` Phase G referenced a non-existent `.ai/learnings/cert-testing-learnings.md`. `.ai/learnings/` does not exist and is not part of the established convention. Changed to `.ai/draft_plans/cert/plans/20-testing-quality/outcome/cert-testing-learnings.md`, aligning with the **spec-driven-development skill outcome-protocol** (which mandates per-feature `<plan-dir>/outcome/<...>-outcome.md` docs). This keeps cross-task learnings inside the feature's own outcome directory.

### Notes
- `frontend/views/AGENTS.md` references in this plan are CORRECT (that top-level file exists) — not changed.
- This plan correctly does NOT reference the non-existent `frontend/stores/` path.


---

## SWE Expert Review Notes

> Review performed 2026-08-02 against the actual codebase at `/home/ahmed/Projects/siraj-cert/`.

### Coverage

1. **All layers tested — GOOD.** Repo, service, GraphQL, UI component, E2E, Storybook are all covered. The layered diagram (design.md §1) is accurate against the verified test dirs (`backend/db/test/repo/`, `backend/db/test/logic/`, `backend/services/<domain>/test/`, `frontend/common/graphql/test/`, `test/ui/components/`, `test/ui/e2e/`).
2. **Edge cases — GAPS (P1).** The plan lists happy paths + auth-scope + DataLoader N+1, but the following edges are **not enumerated** as test cases anywhere:
   - **Empty template** (a template with zero elements) → render / generation should fail fast (`groupEmpty`/`missingRequiredVariable` is covered, but "template has no elements" is distinct).
   - **Missing variable values** in a recipient group item (key present in template but absent in item) → covered by `missingRequiredVariable` — confirm explicit test exists.
   - **Storage failure during generation** (signed URL issuance fails, or upload returns 5xx) → service must roll back the certificate insert. No test is named for storage-failure rollback.
   - **Idempotency re-entry**: same idempotency key submitted twice concurrently (race) → only one cert created. Not listed.
   - **Verification of a soft-deleted certificate** → must still return its last-known status (or `NOT_FOUND`?) — decision untested.
   - **Rate-limited verification** returns `RATE_LIMITED` extension → assert Apollo error link parses `retryAfter` (UI component test on VerificationView should cover this; listed under "verification page: valid/revoked/expired/not-found/loading" but **rate-limited state is missing** from the component-test mock list).
   **Fix:** add explicit edge-case rows to the repo/service/component test tables (§DD-2 table, DD-7 mock table) for storage-failure-rollback, idempotency race, empty-template, and rate-limited-UI.
3. **E2E comprehensiveness — ADEQUATE but light on negative paths.** T23/T24/T25 cover generation, verification, template mgmt. **Missing E2E:** (a) verification of a revoked cert shows revoked UI; (b) expired cert shows expired UI; (c) manual code entry `/verify` → submit redirects to result. Only "valid" is implied. **Fix:** enumerate the status permutations as E2E assertions within T24.

### Test Patterns

4. **`runInRollback` + `tx` propagation — CORRECT** and matches `backend/db/test/AGENTS.md` Rules 1, 3 (verified the AGENTS.md content). DD-3's `expectRepoError` helper matches the AGENTS.md pattern verbatim.
5. **`testClient` for GraphQL — CORRECT** and matches `frontend/common/graphql/test/AGENTS.md` (verified `testClient.ts`, `lifecycle.ts`, `helpers.ts` exist with the named exports). Import aliases in DD-5 are valid.
6. **`TestWrapper` + `renderWithWrapper` for UI — CORRECT** (verified `test/ui/components/TestWrapper.tsx`). DD-7 is accurate.
7. **tx position variance — RISK (P2).** `tests.instructions.md` explicitly warns "tx position VARIES per repo method — read signature before calling" and listsexamples. The plan's composition helper `setupCertificateTestEntities` calls `createTestCertificate(tx, templateId, studentId)` with `tx` first — this matches the entity-setup convention (`createTestStudent(tx, parentId, overrides)`), but the plan does **not** warn that the new cert **repo methods** under test might have `tx` NOT in first position (Plan 3 repos). **Fix:** add a note: "Before writing repo tests, confirm each `Certificate*Repository` method's `tx` parameter position from Plan 3 source — do not assume first position."
8. **`getServerTranslations` ban in tests — CORRECTLY FOLLOWED.** `tests.instructions.md` Rule prohibits calling it directly (loader hangs). DD-3 says "import `getServerTranslations` from `@/shared/locale/server-graphql`" and use in `beforeAll` to seed `tErrors`. **CONTRADICTION (P1):** this directly violates the instruction-file rule "NEVER call `getServerTranslations` from `@/shared/locale/server-graphql` directly in tests - causes the i18n loader to hang". The AGENTS.md (Rule 3) allows substring matching but the instruction file bans the direct call. **Fix:** reconcile — the established pattern uses `expectRepoError` with hard-coded English substrings (e.g. `"not found"`, `"version mismatch"`) WITHOUT importing translations, OR uses a separate non-hanging translation reader. Plan 20 must defer to the instruction file: do **not** import `getServerTranslations` in `backend/db/test/` tests; instead assert against literal English substrings documented in §6.1 (the substring table already provides them). Remove the `beforeAll` `tErrors` initialization step.

### Quality Gates

9. **tsgo, biome, lint, codescene, sonar — ALL REFERENCED.** §7.1 per-file loop lists tsgo → biome → lint queue → codescene. §7.2 full gate runs `bun quality-gate` (tsgo → biome → lint → codescene → sonar). All five present. **Verify:** the per-file loop is correctly specified (it is — matches other plans).
10. **Per-task quality loop — INCONSISTENT (P2).** design.md §7.1 says "Every test file created in this plan must pass the per-file quality loop before being committed" — but `tasks.md` tasks (T2–T27) only list `bun tsgo` + `bun biome:check` + lint queue line per task and **omit `bun codescene --file`** at the per-task level (codescene appears only in the final gate §7.2). **Fix:** add `bun codescene --file <path>` to each test-file-producing task's quality loop, or explicitly state codescene runs only at the plan-level gate (and reconcile with §7.1 which claims per-file codescene).
11. **Sonar subagent prohibition — CORRECTLY NOTED** (`tasks.md` T27: "Never run: `bun sonar-scan` — subagent prohibition"). Good.

### Test Data

12. **Entity-setup helpers — CORRECT and additive (P0 none).** Verified `backend/db/test/entity-setup.ts` exists with `createTestUser/Student/Teacher/Parent`, `setupStudent/Teacher`, `setupTestEntities`, `loc`. Plan 20 T2 ADDS cert helpers to this same file — matches `tests.instructions.md` "Entity Setup Helpers" guidance and `backend/db/test/AGENTS.md` Rule 2.
13. **Seed-data isolation — CORRECTLY STATED** (§3.2: "All entity data is created within the transaction via helpers — never queries seed data"). Matches `backend/db/test/AGENTS.md` Rule 4/15.
14. **Composition helper arg variance — RISK (P2).** `setupCertificateTestEntities(tx, prefix)` exposes `student` in its return, but the inner `createTestRecipientGroupItem(tx, group.id)` "auto-creates student" — this duplicates the `createTestStudent`/`setupStudent` chain. Confirm the helper does NOT create two students (one via `setupStudent`, one via the group-item auto-create) which would break referential integrity (recipient group items should reference the SAME student used for the certificate). **Fix:** specify `createTestRecipientGroupItem` accepts an explicit `studentId` parameter (no auto-create), so composition reuses the already-created student. This matches the existing `createTestStudent(tx, parentId, overrides)` explicit-parent pattern.
15. **`prefix` parameter — INCONSISTENT (P2).** `setupCertificateTestEntities(tx, prefix)` takes a `prefix` but the existing `setupTestEntities` does not (verified signature). The `prefix` is used for unique emails/keys — but `backend/db/test/AGENTS.md` Rule 2 says "Generate unique emails, names, and idempotency keys using `randomUUID()` or distinct prefixes". `prefix` is acceptable but should be documented as the convention for cert helpers; or drop it in favor of `randomUUID()` everywhere. **Minor.**

### Reality-Check Corrections to Apply

A. **Remove `getServerTranslations` import from DB tests** (issue #8 / instruction-file contradiction). Use literal English substrings from §6.1.
B. **Add edge-case tests**: storage-failure-rollback, idempotency concurrent re-entry, empty-template, soft-deleted-cert verification, rate-limited UI state (issue #2).
C. **Add E2E status permutations** (revoked/expired/manual-entry) to T24 (issue #3).
D. **Confirm `tx` position variance** for new cert repo methods before writing tests (issue #7).
E. **Make `createTestRecipientGroupItem` take explicit `studentId`** to avoid double-student creation (issue #14).
F. **Reconcile per-task codescene** inclusion (issue #10).

### Remaining Risks

- **Test runtime**: 3 E2E suites (T23–T25) each require `bun run build:test` first. The plan does not state whether the build is shared (one build for all 3) or per-suite. State "build once, run all 3 E2E suites against the single bu".
- **GraphQL tests depend on dev server lifecycle**: `setupTestServerLifecycle` uses a heartbeat for concurrency. If cert tests are heavy (DataLoader, full stack) they may time out the shared server's idle window. Ensure ≥1 cert GraphQL test runs early to keep the heartbeat alive, or the lifecycle may tear down mid-suite. Note this as an operational risk.
- **Storybook stories in `frontend/**/cert/**/*.stories.tsx`**: verified `.storybook/main.ts` globs `../frontend/**/*.stories.tsx`. But stories that mock GraphQL via MSW need handlers in `.storybook/msw-handlers.ts`. The plan lists MSW usage but not whether cert query handlers must be registered there (they must). **Fix:** add a task to extend `.storybook/msw-handlers.ts` with `verifyCertificate`, `certificateTemplates`, `certificates`, `generateCertificate`, `recipientGroups` handlers.
