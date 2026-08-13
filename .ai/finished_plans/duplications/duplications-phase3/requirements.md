# Requirements: Code Duplication Elimination — Phase 3

**Feature:** Code Duplication Elimination Phase 3 (jscpd remaining clones)
**Version:** 1.0
**Date:** 2026-08-11
**Predecessors:** `.ai/plans/duplications/` (Phase 1 — 1,021→819 clones), `.ai/plans/duplications-phase2/` (Phase 2 — 819→457 frontend clones, fully complete)

---

## 1. Overview

Phase 1 and Phase 2 eliminated duplications across the frontend UI component tiers (common/desktop/mobile), shared layer, locale namespaces, and parallel test runners. Phase 1 achieved 1,021→819 (19.8% reduction). Phase 2 achieved 819→457 frontend TSX clones (36.4% reduction). Despite these gains, a full-repo jscpd scan still reports **568 clones at 10.1% duplication**, dominated by residual desktop/mobile view variants and significant backend-layer duplicates not yet addressed.

Phase 3 targets the **remaining duplication across all layers** — backend services, repositories, schema, types, GraphQL layer, app router, test infrastructure, and residual frontend component/view clones — with a multi-phase, high-parallelism approach.

### ⛔ No-Server-Tests Policy (CRITICAL)

**This plan NEVER runs any GraphQL tests, any UI tests, or any tests that require a Next.js server.** The following test commands are explicitly excluded from all tasks, subtasks, and acceptance criteria:

- `bun run test:graphql` — requires Next.js dev server
- `bun run test:ui:components` — UI component tests (Happy DOM)
- `bun run test:ui:e2e` — requires Next.js production server
- `bun run test:ui` — all UI tests
- `bun run build:test` — requires Next.js server build
- `bun run build` — requires Next.js server build
- `bun run test:db` / `bun run test:db:sequential` — may require server connection
- `bun run test:services` / `bun run test:services:sequential` — may require server connection
- `bun run test:integration` — requires external server connections
- `bun run test:live-fx` / `bun run test:live-comm` — requires external API/server
- `bun run test` — meta-command that includes server-required tests
- `bun run scripts/run-test/run-test.ts <path>` — may touch server-required tests

**Sole verification mechanism**: the quality gate loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) which runs tsgo + oxlint + biome + lint + codescene — all read-only, no server required.

All test-running subtasks in `tasks.md` are marked with ~~strikethrough~~ and **SKIPPED** annotations. Acceptance criteria that previously required test suite passes are similarly struck through.

---

## 2. Current Baseline (Phase 3 Start)

### 2.1 Full-Repo jscpd Scan (min-lines 8, min-tokens 75)
- **Total clones:** 568
- **Duplication:** 10.1%
- **Runtime:** ~132ms

### 2.2 Per-Layer Breakdown

| Layer | Clones | Duplication % | Status |
|-------|--------|---------------|--------|
| **Frontend (views + components + common)** | ~508 | ~9.5% | Residual desktop/mobile + cross-component |
| **Backend services** | 92 | 2.61% (min-tokens 30) | NOT yet addressed |
| **Backend repositories** | 10 | 0.6% | NOT yet addressed |
| **Backend types** | 3 | 0.4% | NOT yet addressed |
| **Backend schema** | ~7 patterns (manual) | Structural | NOT yet addressed |
| **App Router** | 7 + 65 semantic | 4.1% jscpd | NOT yet addressed |
| **Test files** | 34 | 17.3% | NOT yet addressed |
| **Shared layer** | 0 | 0% | ✅ Clean |
| **GraphQL layer** | 0 | 0% | ✅ Clean |
| **Backend enums** | 0 | 0% | ✅ Clean |

### 2.3 Top Duplication Hotspots (by impact)

1. **Meeting channel adapters** (backend/services): 16 cross-file clones across GoogleMeet, MicrosoftTeams, Zoom adapters — up to 23 lines / 155 tokens each
2. **Communication complaint/suggestion services**: 6 cross-file + 5 intra-file clones — near-identical service implementations
3. **Meeting config pair** (class-meeting-config ↔ meeting-config): 5 cross-file clones in services + 2 in types + 2 in repositories
4. **Billing supported-* repositories**: 3 repos sharing identical CRUD skeleton + `directionFilter` (3 copies) + `toSelectType` mappers
5. **FX provider adapters** (Fixer ↔ OpenExchangeRates): 3 cross-file clones
6. **Auth simulation services** (impersonation ↔ permission-group-simulation): 3 cross-file clones
7. **Communication channel factories** (email/push/sms): 3 cross-file factory boilerplate clones
8. **Cache adapters/factories**: 3 clones (EntityCacheService has largest intra-file: 24 lines / 133 tokens)
9. **Staff profile service**: 3 intra-file clones
10. **Tab panel cluster** (frontend): PaymentCatalogsTabPanels ↔ 5 other TabPanels files — 10 clones
11. **Quota audience views** (frontend): 4 audience views (Parent/Student/Teacher/Supervisor) — 7 clones
12. **Profile admin sections** (frontend): AdminOnlySection ↔ StudentAdminSection ↔ SupervisorAdminSection — 3 clones
13. **App Router auth boilerplate**: 65 files repeat `getServerUserContext → redirectToLogin → requirePermissionForPage` triplet
14. **Test mock boilerplate**: 15 files repeat ~40-line `mock.module("next/navigation")` block
15. **Schema junction tables**: 10 entity-file junction tables with identical column+index shape (~180 lines)
16. **Schema supported-* tables**: 3 billing tables share identical base columns/indexes

---

## 3. Requirements

### REQ-0: Pre-Implementation Baseline & Execution Protocol
**Priority:** — | **Complexity:** Low

The system SHALL establish a baseline error count before any implementation work begins. The system SHALL create a deferred-items ledger. The system SHALL read all existing outcome files before executing any task. The system SHALL write an outcome file after completing each task. The system SHALL update task checkboxes in `tasks.md`.

**Acceptance Criteria:**
1. WHEN Phase 3 begins THEN system SHALL record tsgo, biome, lint, and jscpd baseline counts
2. WHEN any task begins THEN executing agent SHALL read all files in `.ai/plans/duplications-phase3/outcome/`
3. WHEN any task completes THEN executing agent SHALL create `.ai/plans/duplications-phase3/outcome/<task-id>-outcome.md`
4. WHEN any subtask completes THEN executing agent SHALL update `[ ]` → `[x]` in `tasks.md`

### REQ-0.5: Translation System & Enum Import Compliance
**Priority:** — | **Complexity:** Low

All code changes SHALL comply with the compile-time TypeScript i18n system. All enum usage SHALL use value imports at runtime. No hardcoded user-facing strings.

**Acceptance Criteria:**
1. WHEN modifying any file with user-facing strings THEN system SHALL use `useAppTranslation(Translation.<Namespace>)` (client components) or `getTranslations(locale, "Namespace")` from `@/shared/locale/server` (React server components) or `getServerTranslations(locale, "Namespace")` from `@/shared/locale/server-graphql` (backend services/API routes/scripts) or `ctx.t("Namespace")` (GraphQL resolvers)
2. WHEN using enums in runtime expressions THEN system SHALL import as value imports (not `import type`)
3. WHEN modifying any file THEN system SHALL NOT introduce hardcoded UI strings, `next-intl` imports, or `shared/messages/` references

### REQ-1: Backend Service Meeting Adapter Consolidation
**Priority:** High | **Complexity:** High

The system SHALL eliminate duplication across the three meeting channel adapters (GoogleMeet, MicrosoftTeams, Zoom) by extracting a shared base adapter or mixin.

**Acceptance Criteria:**
1. WHEN refactoring meeting adapters THEN system SHALL extract shared logic to a `MeetingAdapterBase` class or shared module
2. WHEN the base is extracted THEN each adapter SHALL become a thin configuration wrapper
3. WHEN the refactoring is complete THEN jscpd clones #44-#57 SHALL be eliminated
4. ⛔ ~~WHEN the refactoring is complete THEN all meeting integration tests SHALL pass~~ — **SKIPPED: per plan policy, no tests requiring server are run**
5. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-2: Communication Complaint/Suggestion Service Consolidation
**Priority:** High | **Complexity:** High

The system SHALL eliminate duplication between `complaint.service.ts` and `suggestion.service.ts` by extracting shared logic to a base service or shared helpers.

**Acceptance Criteria:**
1. WHEN refactoring complaint/suggestion services THEN system SHALL identify shared logic blocks (6 cross-file + 5 intra-file clones)
2. WHEN shared logic is extracted THEN both services SHALL import from the shared module
3. WHEN the refactoring is complete THEN jscpd clones #26-#34 SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0
5. ⛔ ~~WHEN the refactoring is complete THEN all communication service tests SHALL pass~~ — **SKIPPED: per plan policy, no tests requiring server are run**

### REQ-3: Meeting Config Pair Consolidation
**Priority:** High | **Complexity:** Medium

The system SHALL eliminate duplication between `class-meeting-config` and `meeting-config` across services, types, and repositories.

**Acceptance Criteria:**
1. WHEN refactoring meeting config types THEN system SHALL extract shared `MeetingConfigBase` interface to `backend/types/meeting/meeting-config-base.types.ts`
2. WHEN refactoring meeting config services THEN system SHALL extract shared logic to a shared helper or base service
3. WHEN refactoring meeting config repositories THEN system SHALL extract shared query/upsert logic to a `meeting/__shared__/` helper
4. WHEN the refactoring is complete THEN jscpd clones in types (2), services (5), and repositories (2) SHALL be eliminated
5. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-4: Billing Supported-* Repository CRUD Factory
**Priority:** High | **Complexity:** Medium

The system SHALL eliminate duplication across the three billing supported-* repositories by extracting a generic CRUD factory and shared helpers.

**Acceptance Criteria:**
1. WHEN refactoring billing repositories THEN system SHALL extract `directionFilter` to a shared billing repo helper (eliminating 3 copies)
2. WHEN refactoring billing repositories THEN system SHALL extract `toSelectType` mapper pattern to a generic factory or shared helper
3. WHEN refactoring billing repositories THEN system SHALL extract CRUD skeleton (listActive, getById, getBySlug, create, update) to a generic factory
4. WHEN the refactoring is complete THEN jscpd clones #2 (billing cross-file) and all billing intra-file clones SHALL be eliminated
5. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-5: FX Provider Adapter Consolidation
**Priority:** Medium | **Complexity:** Medium

The system SHALL eliminate duplication between Fixer and OpenExchangeRates FX provider adapters.

**Acceptance Criteria:**
1. WHEN refactoring FX adapters THEN system SHALL extract a shared `FxAdapterBase` class or shared helpers
2. WHEN the refactoring is complete THEN jscpd clones #40-#42 SHALL be eliminated
3. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-6: Auth Simulation Service Consolidation
**Priority:** Medium | **Complexity:** Medium

The system SHALL eliminate duplication between `impersonation.service.ts` and `permission-group-simulation.service.ts`.

**Acceptance Criteria:**
1. WHEN refactoring auth simulation services THEN system SHALL extract shared session-simulation logic to a helper or base service
2. WHEN the refactoring is complete THEN jscpd clones #2-#4 SHALL be eliminated
3. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-7: Communication Channel Factory Consolidation
**Priority:** Medium | **Complexity:** Low

The system SHALL eliminate duplication across communication channel factories (email, push, SMS).

**Acceptance Criteria:**
1. WHEN refactoring channel factories THEN system SHALL extract shared factory boilerplate to a `ChannelFactoryBase` or shared helper
2. WHEN the refactoring is complete THEN jscpd clones #18-#19, #23 SHALL be eliminated
3. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-8: Cache Adapter/Factory Consolidation
**Priority:** Medium | **Complexity:** Low

The system SHALL eliminate duplication between cache adapters (Postgres, Redis) and cache factories.

**Acceptance Criteria:**
1. WHEN refactoring cache adapters THEN system SHALL extract shared adapter interface methods to a base class
2. WHEN refactoring EntityCacheService THEN system SHALL extract the 24-line intra-file clone to a shared private method
3. WHEN the refactoring is complete THEN jscpd clones #14-#16 SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-9: Backend Repository Intra-File Clone Elimination
**Priority:** Medium | **Complexity:** Medium

The system SHALL eliminate all intra-file duplication within backend repositories.

**Acceptance Criteria:**
1. WHEN refactoring audit repository THEN system SHALL extract the duplicate block at lines 36-49 / 62-75 to a shared private method
2. WHEN refactoring books/report repository THEN system SHALL extract the duplicate block at lines 144-155 / 172-183
3. WHEN refactoring notification repository THEN system SHALL extract the duplicate block at lines 62-74 / 825-838
4. WHEN refactoring scheduling repositories THEN system SHALL extract duplicated blocks in class-instance-upsert, class-instances, recurring-schedule, and scheduling-queries helpers
5. WHEN the refactoring is complete THEN all 10 backend repository clones SHALL be eliminated
6. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-10: Backend Types Consolidation
**Priority:** Low | **Complexity:** Low

The system SHALL eliminate duplication in backend types.

**Acceptance Criteria:**
1. WHEN refactoring meeting config types THEN system SHALL extract shared `MeetingConfigBase` interface
2. WHEN refactoring pagination types THEN system SHALL consolidate the internal duplicate at lines 18-27 / 37-45
3. WHEN the refactoring is complete THEN all 3 backend type clones SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-11: App Router Auth Boilerplate Extraction
**Priority:** High | **Complexity:** Medium

The system SHALL extract the repeated server-component auth/permission boilerplate (~65 files repeating the same 4-line triplet) into a reusable helper.

**Acceptance Criteria:**
1. WHEN refactoring app router auth THEN system SHALL create a `withPageAuth` higher-order function or `requirePageAuth` helper in `backend/lib/auth/`
2. WHEN the helper is created THEN the 65 app router page files SHALL be updated to use it
3. WHEN the refactoring is complete THEN the 7 jscpd clones in app/ SHALL be eliminated
4. WHEN the refactoring is complete THEN the semantic duplication (65 files) SHALL be reduced to a single import + function call
5. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-12: App Router Profile Page Family Consolidation
**Priority:** Medium | **Complexity:** Low

The system SHALL consolidate the 4 near-identical profile page files into a shared server component.

**Acceptance Criteria:**
1. WHEN refactoring profile pages THEN system SHALL extract a shared `ProfilePageServer` component taking `targetUserId?` and `mode: ProfileMode`
2. WHEN the component is extracted THEN the 4 profile page files (self-view, self-edit, [id]-view, [id]-edit) SHALL become thin wrappers
3. WHEN the refactoring is complete THEN jscpd clones #2, #3, #6, #7 in app/ SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-13: App Router Metadata Title Helper
**Priority:** Low | **Complexity:** Low

The system SHALL extract the repeated `generateMetadata` title-builder pattern to a shared helper.

**Acceptance Criteria:**
1. WHEN refactoring metadata THEN system SHALL create a `buildEntityPageTitle` helper
2. WHEN the helper is created THEN all `[id]` route `generateMetadata` functions SHALL be updated to use it
3. WHEN the refactoring is complete THEN jscpd clones #4, #5 in app/ SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-14: Test Mock Boilerplate Extraction
**Priority:** High | **Complexity:** Medium

The system SHALL extract the repeated `mock.module("next/navigation")` block (~40 lines × 15 files) to a reusable test helper.

**Acceptance Criteria:**
1. WHEN refactoring test mocks THEN system SHALL create `test/ui/components/helpers/mockNavigation.ts` exporting `mockNextNavigation(pathname?, opts?)`
2. WHEN the helper is created THEN all 15 UI component test files SHALL be updated to use it
3. WHEN the refactoring is complete THEN ~600 lines of test duplication SHALL be eliminated
4. WHEN the refactoring is complete THEN jscpd test clones (Cluster A, 15 files) SHALL be eliminated
5. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-15: Test Student History/Sessions Fixture Extraction
**Priority:** Medium | **Complexity:** Medium

The system SHALL extract the duplicated student history/sessions test fixtures to a shared fixture file.

**Acceptance Criteria:**
1. WHEN refactoring student test fixtures THEN system SHALL create `test/ui/components/fixtures/studentHistoryFixtures.ts`
2. WHEN the fixture is created THEN `studentHistoryContainer.test.tsx`, `studentHistoryMobile.test.tsx`, `studentSessionsContainer.test.tsx`, `studentProfileContainer.test.tsx` SHALL import from it
3. WHEN the refactoring is complete THEN jscpd test clones (Cluster C) SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-16: Test Desktop/Mobile Duplicate Consolidation
**Priority:** Low | **Complexity:** Low

The system SHALL consolidate the byte-for-byte identical desktop/mobile test files for SessionActivateButton.

**Acceptance Criteria:**
1. WHEN refactoring SessionActivateButton tests THEN system SHALL create a shared `makeSessionActivateButtonTests(Component, label)` factory
2. WHEN the factory is created THEN both `.desktop.test.tsx` and `.mobile.test.tsx` SHALL call it
3. WHEN the refactoring is complete THEN jscpd test clones (Cluster B) SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-17: Frontend Tab Panel Cluster Consolidation
**Priority:** Medium | **Complexity:** Medium

The system SHALL consolidate the 6 TabPanels files that share significant blocks with `PaymentCatalogsTabPanels`.

**Acceptance Criteria:**
1. WHEN refactoring tab panels THEN system SHALL extend the existing `createTabbedPanePanels` helper to absorb the shared logic
2. WHEN the helper is extended THEN `PaymentCatalogsTabPanels`, `BillingTabPanels`, `ScheduleTrackingTabPanels`, `FeedbackManageTabPanels`, `UsersDirectoryTabPanels` SHALL use it
3. WHEN the refactoring is complete THEN jscpd frontend component clones #21-#29, #39-#40 SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-18: Frontend Quota Audience View Consolidation
**Priority:** Medium | **Complexity:** Low

The system SHALL consolidate the 4 quota audience views (Parent, Student, Teacher, Supervisor) that repeat the same JSX structure.

**Acceptance Criteria:**
1. WHEN refactoring quota views THEN system SHALL extract a shared `QuotaAudienceViewShared` component or config-driven factory
2. WHEN the shared code is extracted THEN the 4 audience views SHALL become thin wrappers
3. WHEN the refactoring is complete THEN jscpd frontend component clones #52-#58 SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-19: Frontend Profile Admin Section Consolidation
**Priority:** Medium | **Complexity:** Low

The system SHALL consolidate the 3 admin section components (AdminOnlySection, StudentAdminSection, SupervisorAdminSection).

**Acceptance Criteria:**
1. WHEN refactoring admin sections THEN system SHALL extract a shared `AdminSectionShared` component with slot props
2. WHEN the shared code is extracted THEN the 3 admin sections SHALL become thin wrappers
3. WHEN the refactoring is complete THEN jscpd frontend component clones #49-#51 SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-20: Frontend Remaining Component Clones
**Priority:** Low | **Complexity:** Medium

The system SHALL eliminate the remaining frontend component clones (auth banners, notification stories, profile edit forms, profile loading skeletons, site columns, supervisor containers, UI shared/base pairs).

**Acceptance Criteria:**
1. WHEN refactoring auth banners THEN system SHALL extract shared `SimulationBannerShared` for GroupSimulation ↔ Impersonation
2. WHEN refactoring profile edit forms THEN system SHALL extract shared `ProfileEditFormShared` for parent/staff/teacher
3. WHEN refactoring notification stories THEN system SHALL consolidate `NotificationDrawerRow` and `NotificationRowBase` story boilerplate
4. WHEN refactoring remaining UI pairs THEN system SHALL evaluate each clone pair and extract scaffolds where >50 lines
5. WHEN the refactoring is complete THEN all remaining frontend component clones SHALL be eliminated or justified in deferred items
6. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-21: Schema Junction Table Helper Extraction
**Priority:** Medium | **Complexity:** Medium

The system SHALL extract the 10 entity-file junction table definitions to a shared helper function.

**Acceptance Criteria:**
1. WHEN refactoring schema junction tables THEN system SHALL create a `makeFileJunctionTable(tableName, entityTable, entityIdColumn)` helper in `backend/db/schema/storage/__shared__/`
2. WHEN the helper is created THEN the 10 junction tables in `storage/storage.ts` SHALL use it
3. WHEN the refactoring is complete THEN ~180 lines of schema boilerplate SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-22: Schema Supported-* Payment Method Table Helper
**Priority:** Medium | **Complexity:** Medium

The system SHALL extract the shared base columns for the 3 supported-* payment method tables.

**Acceptance Criteria:**
1. WHEN refactoring supported-* tables THEN system SHALL create a `supportedPaymentMethodBase(tableName)` helper in `backend/db/schema/billing/__shared__/`
2. WHEN the helper is created THEN the 3 table definitions SHALL use it
3. WHEN the refactoring is complete THEN the structural duplication SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-23: Schema Timestamp/ID Column Helpers
**Priority:** Low | **Complexity:** Low

The system SHALL extract the repeated timestamp and ID column definitions to shared helpers.

**Acceptance Criteria:**
1. WHEN refactoring schema columns THEN system SHALL create `timestampColumns()` and `primaryKeyColumn()` helpers in `backend/db/schema/__shared__/`
2. WHEN the helpers are created THEN all schema tables SHALL use them
3. WHEN the refactoring is complete THEN the 30+ timestamp and 60+ ID column duplications SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-24: Cross-Layer Pagination Helper Consolidation
**Priority:** Medium | **Complexity:** Medium

The system SHALL consolidate the 6+ duplicated `parsePaginationArgs`/`toPaginationArgs`/`buildPaginationArgs` functions across GraphQL resolvers.

**Acceptance Criteria:**
1. WHEN refactoring pagination helpers THEN system SHALL create a single `parsePaginationArgs` in `backend/graphql/utils/pagination-utils.ts`
2. WHEN the helper is created THEN all 6+ GraphQL query/pothos files SHALL import from it
3. WHEN the refactoring is complete THEN all inline `new PaginationArgs(...)` copies SHALL be replaced
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-25: Cross-Layer Mapper Function Consolidation
**Priority:** Medium | **Complexity:** Medium

The system SHALL consolidate the duplicated `toSelectType`/`toReturnType` mapper functions across billing repositories.

**Acceptance Criteria:**
1. WHEN refactoring billing mappers THEN system SHALL evaluate a generic `makeSelectMapper(row, enumCorrections)` factory
2. WHEN the factory is created THEN the 5 billing repositories SHALL use it
3. WHEN the refactoring is complete THEN the 5 mapper duplications SHALL be eliminated
4. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0

### REQ-26: Backend Service Intra-File Clone Elimination
**Priority:** Medium | **Complexity:** Medium

The system SHALL eliminate all 44 intra-file clones within backend service files.

**Acceptance Criteria:**
1. WHEN refactoring service intra-file clones THEN system SHALL extract each duplicate block to a named private method or module-scope helper
2. WHEN the refactoring is complete THEN all 44 intra-file service clones SHALL be eliminated or justified in deferred items
3. WHEN any file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0
4. ⛔ ~~WHEN the refactoring is complete THEN all backend service tests SHALL pass~~ — **SKIPPED: per plan policy, no tests requiring server are run**

### REQ-27: Plan Review Gate
**Priority:** — | **Complexity:** Low

The system SHALL pass a plan review gate before implementation begins.

**Acceptance Criteria:**
1. WHEN specs, design, and tasks are drafted THEN system SHALL invoke `@plan-review` skill
2. WHEN violations are found THEN system SHALL fix all violations and re-run the review
3. WHEN the review passes THEN system SHALL write outcome file `.ai/plans/duplications-phase3/outcome/plan-review-R1.md`

### REQ-28: Mid-Point Review Gate
**Priority:** — | **Complexity:** Low

The system SHALL pass a mid-point review gate after backend phases complete.

**Acceptance Criteria:**
1. WHEN backend phases (1-6) are complete THEN system SHALL dispatch `review-backend` and `review-types` subagents
2. WHEN violations are found THEN system SHALL fix all violations
3. WHEN the review passes THEN system SHALL write outcome file `.ai/plans/duplications-phase3/outcome/midpoint-review-R1.md`

### REQ-29: Post-Implementation Parallel Review Wave
**Priority:** — | **Complexity:** Medium

The system SHALL dispatch specialized review subagents after all implementation tasks complete.

**Acceptance Criteria:**
1. WHEN all implementation tasks complete THEN system SHALL dispatch `review-backend`, `review-frontend`, `review-types` in parallel
2. WHEN findings are collected THEN system SHALL dispatch fix subagents per file cluster
3. WHEN all fixes are verified THEN system SHALL write outcome file `.ai/plans/duplications-phase3/outcome/post-implementation-review.md`

### REQ-30: Final Verification & Quality Gate
**Priority:** High | **Complexity:** High

The system SHALL verify that all duplications are eliminated and all quality gates pass.

**Acceptance Criteria:**
1. WHEN all implementation is complete THEN system SHALL run `bun x jscpd --reporters ai --config "" --min-lines 8` to verify clone reduction
2. WHEN jscpd is run THEN system SHALL verify remaining clones are reduced from 568 to ≤100 (or justified in deferred items)
3. WHEN quality gate is run THEN `bun quality-gate:fresh` SHALL pass
4. ⛔ ~~WHEN tests are run THEN all test suites SHALL pass (or pre-existing failures documented)~~ — **SKIPPED: per plan policy, no GraphQL tests, no UI tests, and no tests requiring a Next.js server are ever run. Quality gate (tsgo + oxlint + biome + lint + codescene) is the sole verification mechanism.**
5. WHEN baseline comparison is done THEN system SHALL verify zero new errors introduced
6. WHEN all verification is complete THEN system SHALL write final outcome file

### REQ-31: Knowledge Propagation
**Priority:** High | **Complexity:** Medium

The system SHALL propagate learnings from the plan to permanent project documentation.

**Acceptance Criteria:**
1. WHEN the plan is complete THEN system SHALL create canonical reference docs under `docs/<domain>/`
2. WHEN docs are created THEN system SHALL update layer AGENTS.md files with new rules/patterns
3. WHEN AGENTS.md files are updated THEN system SHALL update root `AGENTS.md` Important References
4. WHEN instructions are changed THEN system SHALL update `.agents/instructions/<layer>.instructions.md`
5. WHEN all propagation is complete THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL pass per modified file
6. WHEN all propagation is complete THEN system SHALL write final outcome file

### REQ-32: Outcome Knowledge Base & Progress Tracking
**Priority:** — | **Complexity:** — (Standard — included in every feature plan)

**Acceptance Criteria:**
1. WHEN any task begins THEN executing agent SHALL read ALL existing files in `.ai/plans/duplications-phase3/outcome/`
2. WHEN any task completes THEN executing agent SHALL create `.ai/plans/duplications-phase3/outcome/<task-id>-outcome.md`
3. WHEN any subtask completes THEN executing agent SHALL update `[ ]` → `[x]` in `tasks.md`

---

## 4. Scope

### IN Scope
- All 568 remaining jscpd clones across the entire codebase
- Backend service duplication (92 clones)
- Backend repository duplication (10 clones)
- Backend type duplication (3 clones)
- Schema structural duplication (7 patterns)
- App Router duplication (7 jscpd + 65 semantic)
- Test file duplication (34 clones)
- Frontend residual component clones (~60)
- Cross-layer pagination helper duplication (6+ copies)
- Cross-layer mapper function duplication (5 copies)

### OUT of Scope
- New features or functionality
- Architecture refactoring beyond duplication elimination
- Test coverage expansion
- Performance optimization unrelated to duplication
- Changes to the i18n system structure (only compliance fixes)
- Database migrations (schema helpers only generate Drizzle schema)

---

## 5. Constraints

1. **Runtime:** Bun (not Node.js)
2. **Framework:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before writing Next.js code)
3. **UI Library:** MUI v9 — `sx` prop only, no direct style props
4. **React:** React 19 — `React.SubmitEvent`, cast FormData results
5. **i18n:** Compile-time TypeScript system in `shared/locale/` (no `next-intl`)
6. **Path Aliases:** `@/*` maps to project root
7. **Shared Layer:** `shared/` NEVER imports from `@/frontend/**`, `@/backend/**`, or `@/app/**`
8. **DB Tests:** `runInRollback` wrapper, pass `tx`, no `expect().rejects.toThrow()` inside rollback
9. **GraphQL:** Documents include `id` field; no `useLazyQuery`; import from `@apollo/client/react`
10. **Types:** All types from `backend/types/{entity}.types.ts`; no local type definitions in Pothos
11. **Logging:** `logger` from `@/backend/lib/logger` or `@/frontend/utils/logger` — NEVER `console.*`
12. **Oxlint:** NEVER add `oxlint-disable` comments — fix root cause
13. **Colors:** All from theme palette — use `sx={(theme) => ({ ... })}`
14. **Quality Gate:** Every file MUST pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
15. **No re-exports:** Use direct deletion; importers use canonical sources via barrel imports
16. **Circular deps:** Never import through barrel `index.ts` when both files live in same barrel

---

## 6. Success Criteria / Definition of Done

| Criterion | Target |
|-----------|--------|
| jscpd clones (full repo) | 568 → ≤100 (or justified) |
| Backend service clones (92) | → 0 (or justified in deferred) |
| Backend repository clones (10) | → 0 |
| Backend type clones (3) | → 0 |
| App Router clones (7 + 65 semantic) | → 0 |
| Test clones (34) | → ≤5 (or justified) |
| Frontend component clones (~60) | → ≤10 (or justified) |
| Schema structural duplication (~7 patterns) | → 0 |
| Cross-layer pagination copies (6+) | → 1 |
| Cross-layer mapper copies (5) | → 0 (or justified) |
| Quality gate | PASS |
| Test suites | PASS (or pre-existing failures documented) |
| Baseline error delta | 0 new errors |
| Knowledge propagation | Docs + AGENTS.md + instructions updated |
| Plan review | PASS |
| Mid-point review | PASS |
| Post-implementation review | PASS |
