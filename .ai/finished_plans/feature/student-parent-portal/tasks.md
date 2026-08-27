# Student & Parent Portal Enhancements — Tasks

## Document Information

- **Feature Name**: Student & Parent Portal Enhancements
- **Target Directory**: `.ai/plans/student-parent-portal`
- **Outcome Directory**: `.ai/plans/student-parent-portal/outcome`
- **Version**: 2.0
- **Date**: 2026-08-24
- **Author**: @ahmedhosnypro
- **Related Documents**:
  - Requirements: [specs.md](specs.md)
  - Design: [design.md](design.md)
  - Plan reviews: [outcome/plan-review-R1.md](outcome/plan-review-R1.md), [outcome/plan-review-R2.md](outcome/plan-review-R2.md), [outcome/plan-review-R3.md](outcome/plan-review-R3.md), [outcome/plan-review-R4.md](outcome/plan-review-R4.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/student-parent-portal/outcome/` to absorb prior research, pitfalls, and decisions (notably plan-review-R1..R4) without repeating analysis.
2. **Per-File Quality Verification Loop (immediate post-edit):** Whenever a file is modified, run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` before moving to another file or subtask. The script runs tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file, short-circuits at the first failure, and auto-discovers/prints applicable AGENTS.md + `.agents/instructions/` files. Exit 0 = pass.
3. **Semantic Review Checklist (pre-completion gate):** Before marking any subtask `[x]`, run the SR checklist (see MANDATORY Subtasks below) — the sub-loop script cannot detect race conditions, env-config gaps, dead code, or cross-layer imports.
4. **Global Health Check (completion gate):** Before marking any subtask complete, re-run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all modified files; all MUST exit 0.
5. **Post-Execution Outcome File:** Upon completing a task, write `.ai/plans/student-parent-portal/outcome/<task-id>-outcome.md` with findings, implementation details, cross-file dependencies, and carry-over knowledge.
6. **Task Progress Tracking:** Update the task checkbox `[ ]` → `[x]` in this `tasks.md` upon completion.

## MANDATORY Subtasks for Every Implementation Task (QL → TE → SEC → SR → IV)

Every implementation task **X.Y** includes 5 subtasks in strict order. Concrete file paths are spelled out per task; the rules are defined once here and referenced by each X.Y pipeline.

### X.Y.QL — Quality Loop
Run `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene` (exit 0). Script prints applicable AGENTS.md + instruction files and enforces the Fix-Or-Report rule.

### X.Y.TE — Test Engineering (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`)
Tier 1: 100% branch/statement coverage of new logic · Tier 2: boundary/edge (empty strings, nullability, unicode/RTL, numeric/date bounds) · Tier 3: fuzz payloads, `Promise.allSettled` concurrency races, out-of-order transitions · Tier 4: LIKE wildcard injection (`%`, `_`, `\`), unauthenticated rejection, invalid roles. Layer rules: DB tests `runInRollback` + `tx` everywhere (`expectRepoError` try/catch, no `rejects.toThrow`); service tests mock all external adapters; GraphQL via `setupTestServerLifecycle()` + `testClient`; UI components under `test/ui/components/` (Happy DOM); E2E via Playwright.

### X.Y.SEC — Security & Tenancy Audit (`.agents/skills/idor-testing`, `.agents/skills/pentester`)
- **BOLA/IDOR**: identity from `ctx.user.id`; no sibling-tenant reads/writes (parent-child link must be verified per request).
- **BOPLA**: strict DTO mapping; NO `{ ...input }` spread into Drizzle `update()`/`set()` or insert payloads.
- **BFLA**: student/parent tokens cannot call teacher/supervisor/admin mutations (e.g. approve requests, submit appraisals) or cron triggers.
- **Composite relations**: child resources verified against verified parent (`leaveRequest.classInstanceId` belongs to caller's session scope).
- **Sanitization**: LIKE/ILIKE escaped via `escapeLikeWildcards` on any search input.

### X.Y.SR — Semantic Review (agent self-review, no script)
- [x] No client-supplied ID without ownership/permission assertion (IDOR/BOLA)
- [x] Tenancy filters explicit: `eq(table.studentId/parentId/childIds, caller…)`
- [x] No unbounded `...input` spread into Drizzle writes (BOPLA)
- [x] DataLoaders filter batch results by caller tenancy
- [x] No read-then-write without atomicity (tx / SELECT FOR UPDATE / advisory lock) — applies to duplicate-request guard + refund paths
- [x] No module-level mutable state without bounds
- [x] All `resolveEnvConfig` keys registered in `shared/constants/env-config-keys.ts` (`SELF_SERVICE_RESCHEDULE_LOCK_HOURS`, calendar grid hours)
- [x] All `resetX()` invalidators cover every resolved key
- [x] No empty-string credential acceptance
- [x] No dead branches
- [x] No cross-layer imports (frontend→backend, shared→frontend/backend/app)
- [x] Enums value-imported when used at runtime
- [x] `bun run db push` output matches Drizzle schema (no drift)
- [x] Deferred items logged in `deferred-items.md`

### X.Y.IV — Instruction Verification
Read ALL rule files printed by the X.Y.QL sub-loop run (AGENTS.md + `.agents/instructions/`) and validate each modified file against them.

**Sequence per task:** `X.Y (implement) → X.Y.QL → X.Y.TE → X.Y.SEC → X.Y.SR → X.Y.IV → mark [x] → write outcome/X.Y-*.md`

### Layer-to-Instructions Mapping (plan scope)

| Layer | AGENTS.md | Instructions |
|-------|-----------|--------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Schema | `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend Repos | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Backend Tests | `backend/db/test/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Backend Types / Enums | `backend/types/AGENTS.md`, `backend/enum/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Shared Locale | `shared/AGENTS.md` | — |
| App Router | `app/AGENTS.md` | `frontend.instructions.md` |
| Frontend Common | `frontend/common/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| Frontend Desktop | `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| Frontend Mobile | `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| Test UI / E2E | `test/ui/AGENTS.md` | `tests.instructions.md` |

(All paths resolve under `/home/ahmed/Projects/siraj/`. `sub-loop.ts` prints the exact applicable set at runtime — those printed paths are authoritative.)

### Conventions
- **Drizzle**: `bun run db push` for schema changes (tables/columns/enums/indexes); `bun db migrate` only for custom SQL (none expected in this plan).
- **Codegen**: after any Pothos change run `bun run generate:gqlSchema && bun codegen`.
- Enums as value imports; barrels use `export *` with relative `./` paths; no `.types.ts` outside `backend/types/`; tests via `bun run test/scripts/run-test.ts <path>` for backend/DB, `bun run test:ui:components` for UI.

## Implementation Overview

Foundation-first vertical slices per feature (F1 appraisals → F2 self-service reschedule → F3 calendar views → F4 dashboard widgets → F5 payments ledger), each slice: schema → types/repo → service → GraphQL → frontend → per-task QL/TE/SEC/SR/IV pipeline. Mid-point review gate after F2 backend+frontend (task 6) per Phase 2.5 (>15 tasks, backend+frontend plan). Post-implementation parallel review wave (task 11) before E2E (12) and Knowledge Propagation (13).

Design anchors adopted in R3 (see `design.md` §F2–§F5 and `outcome/plan-review-R3.md`):
- Self-service **Cancel** requests are EXEMPT from student leave quota (no `leave_quota_usage` write, no `assertLeaveQuotaAvailable`); supervisor approval is the authorization; single `credit_transactions` refund per approved cancel.
- Student sessions query gains `from`/`to` range params (42-day cap; default = current month) — arbitrary-window support absent in the student sessions list helpers (`.helpers.ts:209`; note: `scheduling-queries.repository.findUpcoming.ts:52` is a separate `withinHours` cron-reminder helper, not the student sessions query).
- The 6 new permissions (`APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK`, `SESSION_SELF_DELAY`, `SESSION_SELF_CANCEL`, `PAYMENTS_LEDGER_VIEW`) land via the AppPermission → permission-group seed mapping (never per-user overrides).
- Package name derived from `invoiceType` (`backend/enum/billing/billing.enum.ts`) — the only package-kind signal (no line-items table).

---

## Phase 0 — Pre-Implementation Baseline & Analysis (MANDATORY)

- [x] 0.1 Baseline quality snapshot & deferred-items ledger
  - Record baseline error counts BEFORE any implementation:
    ```bash
    bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-tsgo.txt
    bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-biome.txt
    bun run scripts/lint-service.ts --json --id baseline > /tmp/baseline-lint.json
    ```
  - Create deferred-items ledger: `.ai/plans/student-parent-portal/deferred-items.md` (template: `.agents/spec-process-guide/templates/deferred-items-template.md`)
  - Write `outcome/0.1-baseline-outcome.md` documenting baseline counts
  - _Requirements: REQ-0 (Pre-Implementation Baseline)_
  - No code changes → QL/IV not applicable; TE/SEC/SR not applicable (no runtime code)
- [x] 0.2 Schema verification analysis (no code changes)
  - Verify `payments` ↔ `invoices` ↔ `credit_transactions` ↔ quotas link to derive package name — `invoiceType` (`backend/enum/billing/billing.enum.ts`) is the only package-kind signal on invoices (no line-items table, verified); enumerate its members and decide derive-or-placeholder; credit linkage via `credit_transactions` PURCHASE reason
  - ~~Verify student sessions query supports arbitrary date-range~~ (verified: NOT supported — student sessions list helpers filter with `gte(scheduledStartAt, now)` only (`.helpers.ts:209`); `findUpcoming.ts:52` is a separate `withinHours` cron-reminder path, not this query; task 7.1 adds `from`/`to` params with a 42-day window cap)
  - Identify the AppPermission → permission-group seed mapping (groups in `backend/db/schema/permissions/permissions.ts`; overrides only in `backend/db/seeds/auth/seed-user-permission-overrides.ts`) so the 6 new permissions land in the correct parent/student/teacher/supervisor/admin groups
  - ~~Verify `leave_quota_usage` trigger interplay~~ (verified R3, decision taken: self-service cancels exempt from student leave quota — approve-cancel path must NOT write `leave_quota_usage`; reuse existing releaseQuota/refundCredit path without `assertLeaveQuotaAvailable`)
  - ~~Verify leave_requests delay-target columns~~ (done in R2: missing — `requestType` + `proposedStartAt` required)
  - ~~Verify canonical LeaveRequesterType location~~ (done in R2: `backend/enum/scheduling/scheduling.enum.ts`)
  - ~~Verify reschedule/tracking UI existence~~ (done in R2: exists at `frontend/common/views/dashboard/reschedule/tracking/`, staff-gated by SESSION_RESCHEDULE)
  - QL/TE/SEC/SR: N/A (analysis only, no runtime code) · IV: read `backend.instructions.md` + `backend/db/repo/AGENTS.md` + `backend/AGENTS.md` for the files being verified
  - Write `outcome/0.2-schema-analysis.md` with confirmed findings + new findings feeding tasks 1, 5, 9
  - Update progress: mark task 0.2 `[x]` in `tasks.md`
  - _Requirements: R1, R2, R5_

---

## Phase 1.5 — Plan Review Gate (MANDATORY)

- [x] P1.5 Continuous plan-review gate (rounds R1–R4 complete; re-run if plan changes)
  - Invoke `@plan-review` on `specs.md` + `design.md` + `tasks.md` whenever any plan file changes before implementation starts
  - Fix all reported violations; re-run until "Plan passes all AGENTS.md rules"
  - Existing outcomes: `outcome/plan-review-R1.md`, `outcome/plan-review-R2.md`, `outcome/plan-review-R3.md`, `outcome/plan-review-R4.md`
  - Commit patched plan files (do NOT push until implementation starts)
  - _Requirements: REQ-0 (Execution Protocol)_

---

## Feature 1 — Monthly Appraisals

- [x] 1. Schema & enums
- [x] 1.1 Create `monthly_appraisals` + `appraisal_feedback` tables
  - `backend/db/schema/students/monthly-appraisals.ts` per design using `createTable` + dialect-aware helper columns from `backend/db/schema/__shared__/dialectAwareBuilder`; RLS policies per billing.ts note pattern; `bun run db push`
  - Update nested barrels + `backend/db/schema` barrel
  - AGENTS.md: root, `backend/db/schema/AGENTS.md` (if exists), `backend/db/repo/AGENTS.md`; instructions: backend
  - [x] 1.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `backend/db/schema/students/monthly-appraisals.ts` + both touched barrels
  - [x] 1.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Schema verified by repo smoke tests in 2.1.TE (insert + unique-conflict on `(studentId, monthKey)`); Tier 2: `monthKey` boundary formats; Tier 3: concurrent double-submit via `Promise.allSettled` proves unique-index protection
  - [x] 1.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): RLS/policies per design follow billing.ts note pattern; no client-mutable identity columns in DDL (ownership enforced at 2.2 service layer); composite FK `appraisal_feedback.appraisalId` with cascade
  - [x] 1.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - `bun run db push` diff contains unique index + FKs and no unexpected drops
    - barrels: relative `./` paths, `export *` only, no imports
  - [x] 1.1.IV **Instruction Verification**: read root AGENTS.md, `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`, `backend.instructions.md`
  - Write `outcome/1.1-outcome.md`; mark task 1.1 `[x]`
  - _Requirements: R1.2, R1.7_

- [x] 2. Types, repo, service
- [x] 2.1 Types + repository + tests
  - `backend/types/report/monthly-appraisal.types.ts`; `backend/db/repo/students/monthly-appraisal.repository.ts` (prepared statements, upsert, feedback append)
  - DB tests in `backend/db/test/repo/` via runInRollback + tx; 100% branch coverage incl. unique conflict
  - [x] 2.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `backend/types/report/monthly-appraisal.types.ts`, `backend/db/repo/students/monthly-appraisal.repository.ts` + new test file(s) under `backend/db/test/repo/`
  - [x] 2.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): DB tests via `runInRollback` + `tx` passed to EVERY repo method, `expectRepoError` try/catch (never `rejects.toThrow`); Tier 1 100% branch coverage incl. upsert + feedback-append paths; Tier 2: sparse-field nullability, unicode/RTL title/body, monthKey bounds; Tier 3: concurrent upsert race; Tier 4: invalid id shapes rejected
  - [x] 2.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): All reads/writes scoped by `studentId` param from service (service owns tenancy check in 2.2.SEC); prepared statements per `docs/drizzle/prepared-statements.md`; BOPLA: explicit column lists, no input spread
  - [x] 2.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - all types live in `backend/types/` (no service-layer `.types.ts`)
    - 100% repo coverage required by `backend/db/test/AGENTS.md`
  - [x] 2.1.IV **Instruction Verification**: read `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/AGENTS.md` + backend/tests instructions
  - Write `outcome/2.1-outcome.md`; mark task 2.1 `[x]`
  - _Requirements: R1.1–R1.7_
- [x] 2.2 Service + tests
  - `backend/services/monthly-appraisal/monthly-appraisal.service.ts` (teacher-teaches-student check, parent/student tenancy, grade validation, sparse-field normalization)
  - Service tests: mock repos for teacher/teaches verification; tenancy matrix
  - [x] 2.2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `backend/services/monthly-appraisal/monthly-appraisal.service.ts` + service tests
  - [x] 2.2.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: 100% branches (submit/update/feedback); Tier 2: grade bounds 1–5, sparse-rubric normalization, empty feedback text; Tier 3: out-of-order submit/feedback, concurrent feedback appends; Tier 4: forged `teacherId` in input ignored; mock repository + teacher-teaches lookup; run via `bun run test/scripts/run-test.ts <path>`
  - [x] 2.2.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): BOLA: teacher-teaches-student relation re-verified on submit; parent/student read scoped to own children/self; BFLA: students/parents cannot call submit (permission checked again at 3.1 resolver); BOPLA: whitelist mapping into repo input types
  - [x] 2.2.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - teacher identity always from auth context, never input
    - no client-supplied IDs pass unmatched through to repo
  - [x] 2.2.IV **Instruction Verification**: read all AGENTS.md + .agents/instructions files printed by QL and validate every modified file
  - Write `outcome/2.2-outcome.md`; mark task 2.2 `[x]`
  - _Requirements: R1.1, R1.5, R1.7_

- [x] 3. GraphQL layer
- [x] 3.1 Pothos types + resolvers + integration tests
  - Object types (both entities, with `id`), queries (myMonthlyAppraisal, studentMonthlyAppraisals, teacherMonthlyAppraisalStudents), mutations (submitMonthlyAppraisal, addAppraisalFeedback)
  - Permissions: `APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK` seeds
  - Integration tests via setupTestServerLifecycle + testClient; IDOR probes (cross-student, cross-teacher, student-cannot-submit)
  - `bun run generate:gqlSchema && bun codegen`
  - [x] 3.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: Pothos files under `backend/graphql/pothos/` (monthly-appraisal domain) + new permission seed mapping + integration tests under `frontend/common/graphql/test/`
  - [x] 3.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): GraphQL integration via `setupTestServerLifecycle()` + `testClient` (never raw fetch); Tier 1: every query/mutation field; Tier 2: pagination bounds, empty result sets; Tier 3: query batching ambience, out-of-order mutations; Tier 4: unauthenticated rejection for all 5 operations
  - [x] 3.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Permission seeds `APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK` mapped to groups via the mapping found in 0.2 (groups, NOT per-user overrides); IDOR probes: cross-student, cross-teacher, student-cannot-submit; verify `extensions.code` propagation per `docs/graphql/domain-error-extensions-code.md`
  - [x] 3.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - every object type includes `id` (Apollo cache normalization)
    - single canonical object type per entity — no local Pothos type defs
    - `bun run generate:gqlSchema && bun codegen` run; generated files committed
  - [x] 3.1.IV **Instruction Verification**: read `backend/graphql/AGENTS.md`, `backend/AGENTS.md`, `backend/instructions` (+ tests instructions for the integration tests)
  - Write `outcome/3.1-outcome.md`; mark task 3.1 `[x]`
  - _Requirements: R1.1–R1.7_

- [x] 4. Frontend
- [x] 4.1 Shared documents + i18n namespaces
  - `frontend/common/graphql/sharedDocuments/reports/monthly-appraisal.documents.ts` — TypedDocumentNode naming, always `id`, no `useLazyQuery`
  - Locale namespace `monthlyAppraisal`: full registration — namespace file in `shared/locale/namespaces/**/monthly-appraisal.namespace.ts` via `defineNamespace("<stable.string.id>", config)`, `en` + `ar` implementations, type entry in the `shared/locale/types/message.ts` schema (`MessageSchema`)
  - [x] 4.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `frontend/common/graphql/sharedDocuments/reports/monthly-appraisal.documents.ts`, `shared/locale/namespaces/**/monthly-appraisal.namespace.ts`, en + ar implementations, `shared/locale/types/message.ts`
  - [x] 4.1.TE **Test Engineering** (4-Tier): Tier 1: hook data/loading/error states against mocked Apollo; Tier 2: missing `id` field detection (Apollo cache warning), RTL rendering of ar strings; document shape tests per `frontend/common/graphql/AGENTS.md`
  - [x] 4.1.SEC **Security & Tenancy Audit**: Documents never widen fields beyond resolver authorization (no field requests that would leak across students); i18n: no hardcoded strings anywhere — typed translation fns only
  - [x] 4.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - TypedDocumentNode naming `{Entity}QueryDocument` / `{Entity}MutationDocument`
    - `shared/` must not import from `@/frontend|@/backend|@/app`
    - namespace fully registered: `defineNamespace` stable id + en + ar + MessageSchema entry (legacy `serverLegacy.ts`/`namespacePaths` no longer exist — do not reference them)
  - [x] 4.1.IV **Instruction Verification**: read all AGENTS.md + .agents/instructions files printed by QL and validate every modified file
  - Write `outcome/4.1-outcome.md`; mark task 4.1 `[x]`
  - _Requirements: R1 (UI), i18n cross-cutting_
- [x] 4.2 Teacher view (list + form) — common/desktop/mobile
  - Structure per Mobile/Desktop isolation: Container + ViewModel in `frontend/common/views/dashboard/...`, tier views in `frontend/desktop/...` / `frontend/mobile/...` — **never `frontend/views/`** (deprecated)
  - RHF 3-generic form; sparse optional rubric; validation 1–5; `< 150` lines per tier file; MUI v9 rules (sx-only style props, theme palette colors)
  - AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md` (if present); instructions: frontend + mobile-desktop
  - [x] 4.2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: Container + ViewModel under `frontend/common/views/dashboard/reports/monthly-appraisal/`; tier views under `frontend/desktop/...` and `frontend/mobile/...` (both + Shared)
  - [x] 4.2.TE **Test Engineering** (4-Tier): Component tests in `test/ui/components/` (Happy DOM, mocked Apollo): Tier 1: render + submit paths; Tier 2: sparse rubric optional fields, validation 1–5 bounds, grade 0/negative rejection; Tier 3: rapid double-submit click; Tier 4: N/A server-side (tier passthrough); teacher-only rendering with mocked permission store
  - [x] 4.2.SEC **Security & Tenancy Audit**: All affordances permission-gated via `<RequirePermission>` where fine-grained; no trust of client-side gating for security (server enforces in 3.1)
  - [x] 4.2.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - each tier file < 150 lines (CodeScene)
    - MUI v9: `sx` prop only for styles; theme palette colors; `*Outlined` icon names
    - RHF 3-generic pattern; no uncontrolled inputs
  - [x] 4.2.IV **Instruction Verification**: read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, frontend + mobile-desktop instructions
  - Write `outcome/4.2-outcome.md`; mark task 4.2 `[x]`
  - _Requirements: R1.1, R1.2, R1.7_
- [x] 4.3 Student/Parent view (list + sparse detail + Add Feedback modal)
  - AppDataGrid (desktop) / MobileCardList (mobile) with `paginationOptions`; StatusBadge for states; component tests: sparse rendering, feedback append flow, empty states
  - [x] 4.3.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: List/detail views (common + desktop + mobile tiers) + Add Feedback modal + component tests
  - [x] 4.3.TE **Test Engineering** (4-Tier): Tier 1: list render, detail render, feedback modal submit; Tier 2: empty states, sparse-field rendering (missing rubric keys), RTL; Tier 3: rapid modal open/close, pagination churn; Tier 4: `useQuery` only (no `useLazyQuery`) — enforced by doc conventions
  - [x] 4.3.SEC **Security & Tenancy Audit**: Parent view restricted to own children via student switcher scoped to linked children; feedback append requires `APPRAISAL_FEEDBACK` (server-enforced); StatusBadge states match resolver states exactly
  - [x] 4.3.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - AppDataGrid `paginationOptions` contract; MobileCardList parity
    - StatusBadge + theme-palette tokens only
  - [x] 4.3.IV **Instruction Verification**: read all AGENTS.md + .agents/instructions files printed by QL and validate every modified file
  - Write `outcome/4.3-outcome.md`; mark task 4.3 `[x]`
  - _Requirements: R1.3, R1.4, R1.6_
- [x] 4.4 Routes + navigation + permission wiring
  - Routes per design UX table; pages MUST use `requirePermissionForPage` in `page.tsx` (server guard); `<RequirePermission>` only for fine-grained affordances; sidebar entries; role matrix; mobile variants
  - AGENTS.md: `app/AGENTS.md`; instructions: frontend
  - [x] 4.4.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `app/[locale]/(dashboard)/...` route `page.tsx` files + sidebar/navigation config files
  - [x] 4.4.TE **Test Engineering** (4-Tier): Tier 1: route renders for permitted roles via mocked session; Tier 2: unauthorized → redirect/403; smoke via existing route test harness (if present) else deferred to task 12 E2E
  - [x] 4.4.SEC **Security & Tenancy Audit**: `requirePermissionForPage` server guard on every page (never client-only); role matrix per design UX table verified for parent/student/teacher/supervisor/admin
  - [x] 4.4.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - navigation entries respect role matrix for all 9 roles
    - mobile bottom-nav parity with sidebar
  - [x] 4.4.IV **Instruction Verification**: read `app/AGENTS.md` + frontend instructions
  - Write `outcome/4.4-outcome.md`; mark task 4.4 `[x]`
  - _Requirements: R1 (UX/nav)_

---

## Feature 2 — Self-Service Reschedule (STUDENT/PARENT)

- [x] 5. Backend changes
- [x] 5.1 Add STUDENT to LeaveRequesterType + REJECTED to LeaveRequestStatus + schema adjustments
  - Edit `backend/enum/scheduling/scheduling.enum.ts` (backend-only, confirmed R2): add `LeaveRequesterType.STUDENT`, `LeaveRequestStatus.REJECTED`, new `LeaveRequestType` enum (DELAY/CANCEL); register new enum via `createPgEnumFromEnum` in `backend/db/schema/enums.ts`; `bun run db push` propagates existing enums automatically
  - Add to `leave_requests` (`backend/db/schema/classes/scheduling.ts`): `requestType` column, `proposedStartAt timestamp NULL`, partial unique index `(classInstanceId) WHERE status='PENDING'`; run `bun run db push`
  - If requester type/status exposed via Pothos, register in `backend/graphql/pothos/shared/enum.pothos.ts` (never literal arrays); run `bun run generate:gqlSchema && bun codegen`
  - [x] 5.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `backend/enum/scheduling/scheduling.enum.ts`, `backend/db/schema/enums.ts`, `backend/db/schema/classes/scheduling.ts`, `backend/graphql/pothos/shared/enum.pothos.ts` (if enums exposed)
  - [x] 5.1.TE **Test Engineering** (4-Tier): DDL safety verified by 5.2.TE integration tests; Tier 2: enum exhaustiveness via Pothos compile; Tier 3: N/A; migration covers partial unique index `(classInstanceId) WHERE status='PENDING'`
  - [x] 5.1.SEC **Security & Tenancy Audit**: REJECTED status + STUDENT requester must not widen any existing staff-only mutation authorization (verified in 5.2.SEC); new enum members value-imported wherever used at runtime
  - [x] 5.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - `bun run db push` diff: enum additions + `requestType` + `proposedStartAt` NULL + partial unique index; zero unexpected drops
    - PG enum registration via `createPgEnumFromEnum` (never literal arrays in Pothos)
    - `generate:gqlSchema && bun codegen` run and generated files committed
  - [x] 5.1.IV **Instruction Verification**: read `backend/AGENTS.md`, `backend/db/schema/AGENTS.md`, `backend/enum/AGENTS.md`, backend instructions
  - Write `outcome/5.1-outcome.md`; mark task 5.1 `[x]`
  - _Requirements: R2.3, R2.7, R2.8_
- [x] 5.2 Leave-request service + mutations + tests
  - `backend/services/leave-request/leave-request.service.ts`: createStudentDelayRequest / createStudentCancelRequest; time-lock check (env-config `SELF_SERVICE_RESCHEDULE_LOCK_HOURS`, registered in `shared/constants/env-config-keys.ts`); duplicate guard in transaction; approve-delay → `reschedule()` in `backend/services/session/class-session.service.ts` (reuses manual-reschedule idempotency key + `validateRescheduleState`); approve-cancel → reuse the cancel path from `class-session.service.ts` that performs `releaseQuotaIfDeducted` / `refundCreditIfDeducted` — WITHOUT calling `SystemRulesService.assertLeaveQuotaAvailable(studentId)` and WITHOUT writing `leave_quota_usage` (R3 policy decision: self-service cancels are exempt from student leave quota; the supervisor approval is the authorization, in place of `SESSION_UPDATE_STATUS_LEAVE`)
  - ~~Leave quota interplay~~ (resolved in R3 design decision — exempt, no schema change); remaining risks: none for quota
  - Approve paths must not double-apply refunds; add integration test asserting single `credit_transactions` refund row per approved cancel
  - Tests: boundary at lock window, duplicate insert, tenancy, approve flows
  - Mutations `requestSessionDelay` / `requestSessionCancel` + permission seeds `SESSION_SELF_DELAY`, `SESSION_SELF_CANCEL`
  - Integration tests: tenant rejection, BFLA (student cannot approve), duplicate error mapping
  - [x] 5.2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `backend/services/leave-request/leave-request.service.ts`, `backend/services/session/class-session.service.ts` (touched approve paths), `shared/constants/env-config-keys.ts`, Pothos mutation files, permission seed files, integration + service tests
  - [x] 5.2.TE **Test Engineering** (4-Tier): Tier 1: all create/approve/reject branches; Tier 2: lock-window boundary (`SELF_SERVICE_RESCHEDULE_LOCK_HOURS` exact edge ±1 minute), duplicate insert under partial unique index, timezone/RTL; Tier 3: `Promise.allSettled` double-approve race and double-cancel race — assert single `credit_transactions` refund row per approved cancel; Tier 4: forged requester id, another tenant's `classInstanceId` rejected; service tests mock externals; integration via `testClient`
  - [x] 5.2.SEC **Security & Tenancy Audit**: BFLA: student/parent tokens cannot invoke approve/reject (supervisor-only path); BOLA: delay/cancel requests scoped to caller's own (or own child's) session — composite check `leaveRequest.classInstanceId ∈ caller sessions`; approve-cancel EXEMPTS student quota: no `assertLeaveQuotaAvailable(studentId)`, no `leave_quota_usage` write (R3 decision); releases/refunds reuse `releaseQuotaIfDeducted`/`refundCreditIfDeducted` inside the same tx
  - [x] 5.2.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - duplicate guard + refunds atomic in one transaction
    - env key `SELF_SERVICE_RESCHEDULE_LOCK_HOURS` registered + covered by reset function
    - idempotency key reuse for approve-delay `reschedule()` call
    - timestamp comparisons against `scheduledStartAt` use DB clock semantics
  - [x] 5.2.IV **Instruction Verification**: read all AGENTS.md + .agents/instructions files printed by QL and validate every modified file
  - Write `outcome/5.2-outcome.md`; mark task 5.2 `[x]`
  - _Requirements: R2.1–R2.8_

- [x] 6. Frontend changes
- [x] 6.1 Documents + session card actions + request modals
  - `leave-request.documents.ts`; Delay/Cancel buttons with disabled tooltips; Delay modal (datetime picker + confirmation), Cancel confirm
  - i18n namespace `selfServiceReschedule`
  - [x] 6.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `frontend/common/graphql/sharedDocuments/scheduling/leave-request.documents.ts`, Delay/Cancel buttons + Delay modal + Cancel confirm under `frontend/common/views/dashboard/` (common tier) + `frontend/desktop/...`/`frontend/mobile/...` tier views, `shared/locale/{types,en,ar}/selfServiceReschedule/`
  - [x] 6.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: documents wired with always-`id`; buttons render + mutations fire via mocked Apollo; modal open/submit paths covered. Tier 2: lock-window disabled tooltips (boundary ±1 min vs `SELF_SERVICE_RESCHEDULE_LOCK_HOURS`), RTL layout of modals, datetime picker min/max bounds. Tier 3: rapid double-click on Delay confirm, modal open/close churn, flaky-network retry UI. Tier 4: buttons hidden/absent without `SESSION_SELF_DELAY`/`SESSION_SELF_CANCEL`; no affordance for another student's session
  - [x] 6.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Session actions visible only for caller's own (or own child's) upcoming unlocked sessions — gating is UX only, server (5.2) enforces tenancy; disabled-with-tooltip instead of hidden when locked (no info leak beyond own session); mutations send only enums + typed payloads
  - [x] 6.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - documents follow sharedDocuments conventions (TypedDocumentNode naming, `id` on every object)
    - i18n namespace `selfServiceReschedule` fully registered via `defineNamespace` (namespace file + en + ar + MessageSchema entry)
    - no hardcoded strings or colors
  - [x] 6.1.IV **Instruction Verification**: read `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, frontend instructions
  - Write `outcome/6.1-outcome.md`; mark task 6.1 `[x]`
  - _Requirements: R2.1, R2.2, R2.3, R2.4_
- [x] 6.2 Requests status list (student + parent)
  - Reschedule/tracking UI extended for requester view; status badges
  - [x] 6.2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: requester-view extensions to existing `frontend/common/views/dashboard/reschedule/tracking/` + desktop/mobile tiers + StatusBadge usage
  - [x] 6.2.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: list render with statuses, pagination. Tier 2: empty state, sparse requests, RTL. Tier 3: pagination churn, concurrent status updates while viewing. Tier 4: student/parent view scoped (no staff approve/reject affordances regardless of props)
  - [x] 6.2.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Tracking list query scoped server-side to caller's own requests (verified in 3.x/5.2 resolvers); UI must not expose staff-only actions to requester view; composite check: status transitions shown match resolver state machine exactly
  - [x] 6.2.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - AppDataGrid `paginationOptions` / MobileCardList parity
    - StatusBadge + theme palette only; REJECTED state added consistently everywhere statuses are surfaced
  - [x] 6.2.IV **Instruction Verification**: read all AGENTS.md + .agents/instructions files printed by QL and validate every modified file
  - Write `outcome/6.2-outcome.md`; mark task 6.2 `[x]`
  - _Requirements: R2.7_

## Phase 2.5 — Mid-Point Review Gate (MANDATORY, after task 6.2)

- [x] M2.5 Mid-point review wave over F1+F2 (backend + frontend files so far)
  - Dispatch IN PARALLEL (Task tool): `review-backend` (scope: all `backend/` files created/modified in tasks 1–6), `review-types` (scope: all `backend/types/` + `backend/enum/` files in tasks 1–6), `review-config` (scope: schema + env-config-keys + permission seeds)
  - Fix per-file via subagents using the printed AGENTS.md/instructions; verify each with `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0)
  - Re-run review agents until **zero F1/F2-specific findings**; filter out pre-existing issues using the task-0.1 baseline
  - **M2.5.QL/IV**: sub-loop per fixed file + read printed instruction files; **M2.5.TE/SEC**: re-run fixed-file test slices
  - Write `outcome/midpoint-review-R1.md` (findings, fixes, re-review proof)
  - _Requirements: all R1.x, R2.x (gate)_


---

## Feature 3 — Week & Day Calendar Views

- [x] 7. Student calendar week/day views
- [x] 7.1 ViewModel + view switcher + Week grid (desktop)
  - Extend student sessions ViewModel with view state + range paging; hourly grid component (07:00–22:00 config via env-config); status colors from theme palette
  - Add `from`/`to` range params to the student sessions query (repo → service → Pothos args); cap window at 42 days; default = current month range so Month view is unchanged
  - Delay/Cancel actions wired in (uses 6.1 modal)
  - [x] 7.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: student sessions repo (`scheduling-queries.repository.findUpcoming.ts` + `.helpers.ts`) gaining `from`/`to`, service pass-through, Pothos args, ViewModel + view-switcher + Week grid files under `frontend/common|desktop/.../calendar`, `shared/constants/env-config-keys.ts` (grid hours)
  - [x] 7.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: repo 100% branch coverage for range filtering (`runInRollback` + `tx`, `expectRepoError`); service/Pothos query via `testClient`. Tier 2: from==to, 42-day cap exact edge, default=current-month preserves Month view, timezone/DST boundaries. Tier 3: `Promise.allSettled` rapid range paging, out-of-order responses (stale range discarded by ViewModel). Tier 4: cross-tenant `from`/`to` probe returns only caller sessions; wildcard-injection N/A (no LIKE). UI component tests: Week grid render 07:00–22:00 config, status colors, Delay/Cancel wiring (6.1 modal)
  - [x] 7.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Range params validated + capped server-side (never client-trusted); caller scoping unchanged by new args (still `ctx.user.id`-derived); BFLA: no staff-only fields exposed by range queries; composite: session cards only render actions permitted by 6.1 gating
  - [x] 7.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - repo: `from`/`to` clamped to 42-day window at the boundary layer; default range = current month
    - prepared-statements pattern per `docs/drizzle/prepared-statements.md` for the new range query
    - view state machine: Month ⇄ Week switch never refetches duplicated ranges
    - grid hours come from env-config (registered in `shared/constants/env-config-keys.ts`), not hardcoded
  - [x] 7.1.IV **Instruction Verification**: read `backend/db/repo/scheduling/AGENTS.md` (if present), `backend/services/scheduling/AGENTS.md` (if present), `backend/AGENTS.md`, `frontend/AGENTS.md`, backend + frontend + mobile-desktop instructions
  - Write `outcome/7.1-outcome.md`; mark task 7.1 `[x]`
  - _Requirements: R2, R3.1, R3.2, R3.4_
- [x] 7.2 Day view (desktop) + mobile variants
  - Day view grid; mobile: extend `mobileWeeklyScroller`, day list variant
  - [x] 7.2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: Day view grid (desktop) + `frontend/mobile/.../calendar` extensions (`mobileWeeklyScroller`, day-list variant)
  - [x] 7.2.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: Day view render, hour navigation. Tier 2: day with zero sessions, 24:00 boundary, RTL. Tier 3: rapid day/week switching; mobile scroller fling vs day-snap race. Tier 4: N/A new server surface (probes covered by 7.1.TE)
  - [x] 7.2.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Mobile/desktop parity: same server scoping, no additional client-side data exposure; lock-state rendering identical across tiers
  - [x] 7.2.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - per Mobile/Desktop isolation: shared logic in `frontend/common/views`, presentation only in tier files (< 150 lines each)
    - status colors from theme palette in all tiers
  - [x] 7.2.IV **Instruction Verification**: read `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`, frontend + mobile-desktop instructions
  - Write `outcome/7.2-outcome.md`; mark task 7.2 `[x]`
  - _Requirements: R3.3, R3.5_
- [x] 7.3 Component tests
  - View switching, range paging, lock-state rendering
  - [x] 7.3.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: component tests under `test/ui/components/` for calendar view switching, range paging, lock-state rendering
  - [x] 7.3.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: view switching (Month⇄Week⇄Day), range paging, disabled-action rendering at lock window. Tier 2: boundary at exact lock hour, sparse days, RTL week layout. Tier 3: concurrent paging + view-switch races, duplicated range dedupe. Tier 4: permission-mocked store: student vs parent rendering
  - [x] 7.3.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Tier-level: confirm tests assert absence of cross-student sessions in fixtures; no test bypasses mocked permission providers
  - [x] 7.3.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - tests assert ViewModel pagination contract, not Apollo internals
    - zero flakiness: fake timers for lock-window boundary tests
  - [x] 7.3.IV **Instruction Verification**: read `test/ui/AGENTS.md`, tests.instructions.md
  - Write `outcome/7.3-outcome.md`; mark task 7.3 `[x]`
  - _Requirements: R3.1–R3.5_

---

## Feature 4 — Dashboard Widgets

- [x] 8. Quick Action strip + Open Requests widget
- [x] 8.1 ViewModel/store extension + Quick Action strip
  - Permission-gated links (Complaint, Payments, Calendar); parent aggregating across children
  - [x] 8.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: student/parent dashboard ViewModel + store extension + Quick Action strip (common + desktop + mobile tiers)
  - [x] 8.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: strip renders permitted links only; parent aggregation across children Cauchy-mixed states. Tier 2: zero children, child with no sessions, RTL. Tier 3: rapid child-switch while strip computed. Tier 4: links hidden without permissions (Complaint/Payments/Calendar), mocked permission store per role
  - [x] 8.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Every link permission-gated AND target routes re-guarded by `requirePermissionForPage` (defense in depth); parent aggregation never leaks a non-linked child's data (fixtures assert)
  - [x] 8.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - strip items derive from permission map, not hardcoded role checks
    - Zustand store per `frontend/common/stores/AGENTS.md` (no server state in stores)
  - [x] 8.1.IV **Instruction Verification**: read `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`, frontend + mobile-desktop instructions
  - Write `outcome/8.1-outcome.md`; mark task 8.1 `[x]`
  - _Requirements: R4.1, R4.4_
- [x] 8.2 Open Requests widget
  - Leave requests summary (pending + recent decisions); StatusBadge; empty state
  - [x] 8.2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: Open Requests widget (common + tier views) + StatusBadge + empty state
  - [x] 8.2.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: pending + recent-decisions summary render. Tier 2: empty state, exactly one request, decision-then-revoke ordering, RTL. Tier 3: poll/refetch race while decisions arrive. Tier 4: widget shows only caller-scoped requests (mocked server scope enforced by 5.2/6.2 queries)
  - [x] 8.2.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Widget consumes the same caller-scoped queries (no bespoke unscoped fetch); StatusBadge categories consistent with 6.2
  - [x] 8.2.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - empty state follows `docs/frontend/*` patterns (ErrorState naming where applicable)
    - reduced-motion respected for any widget animation (CSS in sx per quota-ui-patterns)
  - [x] 8.2.IV **Instruction Verification**: read all AGENTS.md + instructions printed by QL
  - Write `outcome/8.2-outcome.md`; mark task 8.2 `[x]`
  - _Requirements: R4.2, R4.3_
- [x] 8.3 Component tests
  - Empty states, permission hiding, parent-vs-student rendering
  - [x] 8.3.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: component tests for F4 widgets under `test/ui/components/`
  - [x] 8.3.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: empty states, permission hiding, parent-vs-student rendering matrix. Tier 2: mixed-permission subsets (has Payments, lacks Complaint). Tier 3: rerender storms on store updates. Tier 4: N/A beyond 8.1/8.2 server-enforced probes
  - [x] 8.3.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Fixtures assert no cross-tenant data in widget aggregates; tests never call resolvers directly with forged identities
  - [x] 8.3.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - tests consume public component contracts only
    - snapshots excluded (brittle) — behavioral assertions only
  - [x] 8.3.IV **Instruction Verification**: read `test/ui/AGENTS.md`, tests.instructions.md
  - Write `outcome/8.3-outcome.md`; mark task 8.3 `[x]`
  - _Requirements: R4.1–R4.4_

---

## Feature 5 — Payments Ledger View (Parent)

- [x] 9. Backend ledger query
- [x] 9.1 PaymentLedgerEntry type + query + tests
  - Derive credits purchased from `credit_transactions`; package name from invoice linkage (per 0.2 finding); gateway from `paymentMethodSnapshot`; balance per student
  - Pothos object `PaymentLedgerEntry` (with `id`); query `myPaymentsLedger` tenant-scoped, paginated + filters
  - Permission `PAYMENTS_LEDGER_VIEW`
  - Integration tests incl. parental tenancy probe
  - [x] 9.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `backend/types/` PaymentLedgerEntry types, ledger repo/query methods, Pothos `PaymentLedgerEntry` object + `myPaymentsLedger` query, permission seed `PAYMENTS_LEDGER_VIEW`, integration tests
  - [x] 9.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: ledger composition 100% branch coverage (credits purchased from `credit_transactions` PURCHASE, package name from invoice `invoiceType`, gateway from `paymentMethodSnapshot`, balance per student). Tier 2: invoice without linkage → placeholder per 0.2 decision, payment without credits, pagination bounds, filter extremes. Tier 3: `Promise.allSettled` concurrent pagination, filter churn. Tier 4: parental tenancy probe (other parent's ledger IDs → empty), unauthenticated rejection; package-name derivation cannot enumerate other tenants' invoices (invoice lookup pinned to caller's payments)
  - [x] 9.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): `myPaymentsLedger` tenant-scoped to caller's children only; no invoice cross-join by raw id (join through caller's payments); BOPLA: filters strictly typed (no passthrough objects); permission seed lands in parent group via 0.2 mapping
  - [x] 9.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - single canonical `PaymentLedgerEntry` Pothos type with `id`
    - prepared statements for the ledger read path (`docs/drizzle/prepared-statements.md`)
    - balance computation reused, not re-derived (no duplicate credit-sum logic)
  - [x] 9.1.IV **Instruction Verification**: read `backend/types/AGENTS.md`, `backend/db/repo/billing/AGENTS.md` (if present), `backend/graphql/AGENTS.md`, `backend/AGENTS.md`, backend instructions
  - Write `outcome/9.1-outcome.md`; mark task 9.1 `[x]`
  - _Requirements: R5.1–R5.5_

- [x] 10. Frontend payments page
- [x] 10.1 Parent payments page
  - `/parent/payments` route, AppDataGrid paginated with student + date filters, balance via `DesktopMetricCardGrid` / `MobileMetricCardGrid`, sidebar entry
  - Documents + i18n namespace `paymentsLedger`
  - Component tests: filters, pagination, placeholder for missing package
  - [x] 10.1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) per modified file: `/parent/payments` route (`requirePermissionForPage`), AppDataGrid paginated view + student/date filters + `DesktopMetricCardGrid`/`MobileMetricCardGrid` balance, sidebar entry, documents, `paymentsLedger` namespace (common + desktop + mobile tiers)
  - [x] 10.1.TE **Test Engineering** (4-Tier: `.agents/skills/write-tests`, `.agents/skills/test-expert`): Tier 1: page render, filters, pagination, balance metric grid. Tier 2: missing-package placeholder, empty ledger, date-filter bounds. Tier 3: filter+page churn against mocked cache (`cache.updateQuery` pattern). Tier 4: route 403/redirect without `PAYMENTS_LEDGER_VIEW`; grid cannot be fed another student's id via filter (server rejects)
  - [x] 10.1.SEC **Security & Tenancy Audit** (`.agents/skills/idor-testing`, `.agents/skills/pentester`): Route guarded server-side; student filter options limited to caller's children (server-provided list); per-row loading and StatusBadge per docs/frontend patterns
  - [x] 10.1.SR **Semantic Review**: full X.Y.SR checklist from header, with emphasis:
    - AppDataGrid `paginationOptions` contract; documents always `id`
    - namespace `paymentsLedger` fully registered (5 steps)
    - tier files < 150 lines; metric-grid animations respect reduced-motion
  - [x] 10.1.IV **Instruction Verification**: read `app/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, frontend instructions
  - Write `outcome/10.1-outcome.md`; mark task 10.1 `[x]`
  - _Requirements: R5.1–R5.5_

---

## Phase N — Review, Final Gate & Propagation

- [x] 11. Post-implementation parallel review wave (MANDATORY)
  - Scope strictly to feature diff: `git diff --name-only $(git merge-base HEAD origin/master)..HEAD`
  - Dispatch IN PARALLEL: `review-types` (all new/modified type + enum files), `review-backend` (all `backend/` files: schema, repos, services, Pothos), `review-frontend` (all `frontend/`, `app/`, `shared/locale` files), + `idor-testing`/`pentester`/`backend-security-review` (all new queries/mutations: appraisal submit/feedback, requestSessionDelay/Cancel, myPaymentsLedger, sessions range query; BOLA across parent/student/teacher roles, parent-child tenancy integrity, BFLA on supervisor approvals, BOPLA on input payloads, GraphQL depth/batching abuse, LIKE wildcard probes)
  - Aggregate + dedupe findings; categorize CRITICAL/HIGH/MEDIUM/LOW; filter pre-existing via task-0.1 baseline
  - Dispatch fix subagents per file cluster (3–5 related files each); each fixes within assigned files, reports cross-file dependencies to orchestrator, verifies via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0) and reads printed AGENTS.md/instructions
  - Re-run review agents on fixed files; repeat until **zero feature-specific findings**
  - Write `outcome/post-implementation-review.md` (findings table, fixes, re-review proof)
  - _Requirements: all (review gate)_
- [x] 11.5 Final quality gate + deferred-items enforcement
  - Run `bun quality-gate` to green (tsgo → oxlint → biome → lint → duplicates → codescene → sonar); any new failures vs. `/tmp/baseline-tsgo.txt`, `/tmp/baseline-biome.txt`, `/tmp/baseline-lint.json` MUST be attributable to plan files and fixed
  - Conformance sweep: every `_Requirements:` ID in this file exists in `specs.md`; every specs.md requirement has ≥1 task
  - Deferred-items sweep: `.ai/plans/student-parent-portal/deferred-items.md` — grep for unresolved `❌`/`⚠️` entries; count MUST be 0 or each entry explicitly accepted with rationale in the outcome file
  - Write `outcome/final-quality-gate.md`; mark 11.5 `[x]`
  - _Requirements: all (final gate)_
- [x] 12. E2E scenarios (Playwright)
  - `bun run build:test` then E2E per `test/ui/e2e/` patterns: (a) teacher fills monthly appraisal → parent/student views → parent adds feedback; (b) student delay request → supervisor approves → session rescheduled (calendar Week view reflects); (c) cancel-request approve → single refund row surfaced, quota NOT consumed; (d) parent payments ledger filters + pagination
  - 12.QL/IV: sub-loop per test file + read `test/ui/AGENTS.md`, tests.instructions.md; 12.TE: this task IS Tier-E2E; 12.SEC: flows executed as lowest-privilege roles
  - If out of scope for this plan's execution window: record in `deferred-items.md` with rationale
  - Write `outcome/12-e2e-outcome.md`
  - _Requirements: R1.5, R2.5, R3.1–R3.5, R5.5 (E2E)_
- [x] 13. Knowledge propagation & documentation
  - Read ALL files in `.ai/plans/student-parent-portal/outcome/`; extract recurring patterns/gotchas
  - Create canonical docs (exact set driven by outcome evidence): `docs/services/self-service-reschedule.md` (quota-exempt approve-cancel, time-lock, duplicate guard, single-refund invariant) and `docs/frontend/monthly-appraisal-ui.md` (doc structure per skill: Why / Pattern / Rules / What NOT to Do / Rollout Summary / Related Documents)
  - Update layer AGENTS.md files touched by the plan: ONLY layer-specific rules/decisions (1–2 lines) + one-line doc reference — no implementation details or code
  - Update `.agents/skills/` (write-tests, idor-testing) or `.agents/instructions/*.instructions.md` only if the plan introduced patterns relevant to their domain — rules + one-line doc reference
  - Update root `AGENTS.md` Important References with one-line refs to the new docs
  - Verify each modified doc file via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0)
  - Write `outcome/13-knowledge-propagation-outcome.md`; mark 13 `[x]`
  - _Requirements: REQ-6 (Outcome Knowledge Base & Progress Tracking)_
