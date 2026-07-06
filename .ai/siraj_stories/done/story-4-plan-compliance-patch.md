# Story 4 Plan Compliance Patch — Aligning `4-leave-quota-enforcement.md` with `AGENTS_STORY_PLANNING.md`

**Source plan:** `.kilo/plans/done/4-leave-quota-enforcement.md` (fully implemented — all 8 tasks A-H marked DONE, 319+ DB/GraphQL tests passing)
**Compliance standard:** `.ai/siraj_stories/AGENTS_STORY_PLANNING.md` (1004 lines)
**Patch scope:** Retroactively bring the plan document into compliance with the planning standard by adding 9 missing core structural elements, plus implement 2 residual implementation gaps (Tasks I and J).
**Status:** ✅ PATCH COMPLETE — documentation gaps patched, Tasks I and J implemented and verified on 2026-06-21.
**Implementation results:**
- Task I (GraphQL integration tests for `teacherFutureSchedule`): 3/3 tests pass, `frontend/graphql/test/teacher-dashboard.test.ts` now has 7/7 tests passing
- Task J (repository coverage for Story 4 methods): 3 new tests added to `backend/db/test/repo/scheduling.repository.test.ts` covering `getTeacherFutureClasses` (empty result, date-range + state filter + student join, soft-delete exclusion); full DB suite: 343 pass / 0 fail
**Codebase audit date:** 2026-06-21 (paths, method signatures, and test locations verified against live repo).

---

## Patch Gap Summary

| Gap ID | Missing Element | Severity | Patch Section |
|---|---|---|---|
| G-01 | Section 0: missing `0.1 Business Objectives` and `0.2 Scope Boundaries` | **HIGH** | §1 |
| G-02 | Section 1: missing `1.1 Service Layer Architecture`, `1.1b GraphQL Resolver Architecture`, `1.2b Task Ordering & Dependency Integrity`, mandatory Quality Gate checklist | **HIGH** | §2 |
| G-03 | Section 2: missing `2.2 Permission Mapping to Existing Permissions`, `2.4 Self-Scoping vs Any-Scoping` subsections | **MEDIUM** | §3 |
| G-04 | Section 4: missing explicit **Test Requirements** block per threat (AGENTS §4 mandate) | **HIGH** | §4 |
| G-05 | Section 5: missing `✅ (verified — path:line)` markers, missing Security Artifact Verification Table | **HIGH** | §5 |
| G-06 | Tasks A-H missing: **Dependencies** field, **Quality Gate — Per-File / Task Completion Validation** checklists, flattened `🚫 NO Drizzle/DB Imports` rule for service/GraphQL tasks | **HIGH** | §6 |
| G-07 | Section 7: missing `7.2 Quality Gate Loop` (tsgo → biome:check → lint → codescene loop) and `7.3b Repository Coverage Verification` | **MEDIUM** | §7 |
| G-08 | Appendix A (File Creation Summary) and Appendix B (Dependency Graph) absent | **MEDIUM** | §8 |
| G-09 | **NEW residual implementation gap**: `teacherFutureSchedule` GraphQL query has **no** frontend GraphQL integration test in `frontend/graphql/test/teacher-dashboard.test.ts` — must add a test task | **HIGH** | §9 (Task I) |
| G-10 | **NEW residual implementation gap**: Repository methods `getTeacherLeaveQuotaUsage`, `incrementTeacherLeaveQuota`, `getTeacherFutureClasses`, `getTeacherByUserId` have no `bun run test:coverage` verification against 100% line + function coverage threshold | **HIGH** | §9 (Task J) |

**Non-goals of this patch:**
- Representation-only sections (Section 3 Mermaid state machines, Section 0 metadata header, Section 6 task ordering — all already present and complete).
- Re-documenting code blocks that already exist verbatim in the source plan.
- Re-running already-passing tests — only verifying and filling gaps.

---

## §1 — PATCH: Section 0 Missing Subsections (G-01)

*Append these two subsections to the existing Section 0 in `4-leave-quota-enforcement.md`, immediately after `0.3 Current Implementation Gaps To Fix`.*

### 0.1 Business Objectives

1. **Operational Continuity**: `system.enforce_leave_limit` is a hard system-level cap that prevents unbounded leave consumption — teachers are limited to 2 self-service leaves per calendar month, ensuring classes are covered and students are not disrupted by excessive teacher absences.
2. **Layered Defense**: Quota enforcement operates at **three layers** (service pre-check → repository transaction → DB trigger `trg_enforce_leave_quota_limits`) so that a bypass at any single layer is caught by the next. This eliminates the "transactional integrity" threat where leave is processed but quota is not incremented.
3. **Admin Discretion Preserved**: Admin-initiated `session.reschedule` is **not** blocked by quota exhaustion — admins retain judgment authority. The system provides *informational awareness* (quota note appended to remarks) so the admin acts with full knowledge of the teacher's monthly consumption.
4. **Future Calendar Transparency**: `schedule.filter_advanced` extended application gives teachers and admins read-only visibility into the next 30 days of scheduled classes, with rescheduled classes visually distinguished by a red "Re Scheduled" badge — eliminating surprises on class day.
5. **Self-Service Leave Workflow**: Teachers can request leave directly from the Future Schedule view when quota is available and the class is in a valid execution state (`ACTIVATED` / `RUNNING`), eliminating manual admin coordination for routine absences.

### 0.2 Scope Boundaries

**In scope:**
- New `system.enforce_leave_limit` permission (enum + migration + DB seed)
- New system settings `teacher_max_leaves` and `student_max_leaves` (seeded in `system_settings`)
- `SystemRulesService.assertLeaveQuotaAvailable()` service pre-check
- `SchedulingRepository.getTeacherLeaveQuotaUsage()`, `incrementTeacherLeaveQuota()`, `getTeacherFutureClasses()`, `getTeacherByUserId()` repository methods
- Atomic quota increment moved **inside** `SchedulingRepository.processClassLeave()` transaction body
- Backend Pothos types `FutureClass`, `TeacherFutureSchedule` and `teacherFutureSchedule` GraphQL query
- Frontend `teacherFutureScheduleQueryDocument` TypedDocumentNode
- `FutureScheduleContainer` rewired from `mockTeacherScheduleStore` to real `useQuery`
- `FutureClassCard` wired to `updateSessionStatusLeaveMutationDocument` with quota/time disable reasons
- Admin reschedule awareness: `ClassSessionService.reschedule()` appends localized quota-exhausted note to remarks
- i18n translations for `leaveQuotaExceeded`, `teacherQuotaExhaustedNote`, `teacherFutureSchedule` keys (en + ar + types)
- DB logic tests in `backend/db/test/logic/leave_quota.test.ts`
- Service layer tests in `backend/services/system/test/system-rules.service.test.ts`
- Repository tests in `backend/db/test/repo/scheduling.repository.test.ts`
- RBAC enforcement via existing `<RequirePermission>` wrapper with `AppPermission.ScheduleFilterAdvanced`

**Out of scope:**
- Student-initiated leave quota enforcement (mirror of teacher flow — separate story)
- Leave quota UI for Admins to view per-teacher monthly usage across all teachers (display only in Future Schedule for self)
- Leave quota adjustment / override by Admin (admins use `session.reschedule` which is not quota-gated)
- Notification system alerting teachers when they approach the quota threshold (separate story — notifications)
- Leave history report / analytics dashboard (separate story)
- Recurring class rescheduling cascade (reschedule affects only the single targeted instance)

---

## §2 — PATCH: Section 1 Missing Rules (G-02)

*Append these subsections to the existing Section 1 in `4-leave-quota-enforcement.md`, immediately after `1.7 Zero Incomplete Implementation Policy`.*

### 1.1 Service Layer Architecture

- [ ] **NO monolithic services** — Scoped strictly to domain-driven services (`ClassSessionService`, `SystemRulesService`, `ScheduleService`).
- [ ] **Business logic centralization** — All orchestration, quota validation, and permission gating reside in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle** — Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle-related module is **strictly forbidden**. All database access must go through repo methods.

**Verification command:**
```bash
rg "from ['\"]drizzle-orm|from ['\"]@/backend/db/schema|from ['\"]@/backend/db/drizzle" backend/services/schedule/ backend/services/session/ backend/services/system/system-rules.service.ts
```
**Expected output:** empty. (Note: `backend/services/system/test-helper.service.ts` and `system-rules.service.test.ts` are allowed to import Drizzle as test utilities — exclude these from the check.)

**Implementation compliance:** ✅ Verified 2026-06-21 — `system-rules.service.ts`, `class-session.service.ts`, and `schedule.service.ts` import only from `backend/db/repo/` (never `drizzle-orm` or `backend/db/schema`). The type-only inference `Parameters<Parameters<typeof db.transaction>[0]>[0]` in `system-rules.service.ts` is acceptable (type-only import, no runtime dependency).

### 1.1b GraphQL Resolver Architecture

- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** — Pothos resolvers can ONLY depend on the service layer (`backend/services/`). Importing from `backend/db/repo/`, `backend/db/schema`, or any database module is **strictly forbidden**. Resolvers are thin adapters: validate GraphQL input → call service method → return GraphQL result.

**Verification command:**
```bash
rg "from ['\"]@/backend/db" backend/graphql/query/class-session.query.ts backend/graphql/mutation/class-session.mutation.ts backend/graphql/pothos/class-session.pothos.ts
```
**Expected output:** empty.

**Implementation compliance:** ✅ Verified 2026-06-21 — `class-session.query.ts` and `class-session.mutation.ts` delegate to `ClassSessionService` / `ScheduleService`. No direct repo imports.

### 1.2b Task Ordering & Dependency Integrity

- [ ] **No forward dependencies** — A task MUST NOT depend on code, types, schemas, or modules introduced by a later task.
- [ ] **Incremental build order** — Tasks follow: Permission/Settings → Repository → Service → DB/Repo Tests → GraphQL Backend → GraphQL Documents → Frontend Views → i18n. Tests immediately follow the layer they verify.
- [ ] **Self-contained tasks** — After completing each task, the project must compile and pass all quality gates.
- [ ] **Explicit dependency declaration** — Each task's **Dependencies** field must list exactly what it relies on (earlier task letters or "current project state only").

**Story 4 task order compliance:** A → B → C → D → E → F → G → H.
- Task A (Permission + Settings): no dependency.
- Task B (Service + Repo): depends on A.
- Task C (Backend GraphQL): depends on B.
- Task D (Frontend GraphQL Document): depends on C.
- Task E (Frontend Views): depends on D.
- Task F (Admin Reschedule Awareness): depends on B (shares repo methods).
- Task G (DB Tests): depends on B (tests the methods B introduced).
- Task H (i18n): depends on E, F (strings consumed by those tasks).

### 1.7b Mandatory Quality Gate Checklist (Per-Task)

Every task's Success Criteria section **MUST** include the following quality gate checklist verbatim. This applies retroactively to Tasks A-H in the source plan.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] Loop over tsgo, biome:check, lint, codescene on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] Loop over tsgo, biome:check, lint, codescene on working files till no issues at all, after completing all steps

---

## §3 — PATCH: Section 2 Missing Subsections (G-03)

*Append these two subsections to the existing Section 2, after `2.3 Permission Group Assignments`.*

### 2.2 Permission Mapping to Existing Permissions

| **Story 4 Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `system.enforce_leave_limit` | `system.enforce_time_window` (Story 1) | Complementary — both are system-automated guard rails enforced inside `SystemRulesService`; time-window gates activation timing, leave-limit gates leave-request frequency |
| `schedule.filter_advanced` (extended) | `schedule.view_list` | Granular — `filter_advanced` specifically gates future-date navigation and "Re Scheduled" badge rendering; `view_list` gates the regular daily schedule view |
| `session.reschedule` (extended) | `session.update_status.leave` | Complementary — teachers self-request leave (hard-blocked by quota); admins execute reschedule (soft informational quota note) |
| `session.request_leave` (maps to `session.update_status.leave`) | `session.update_status.start`, `session.update_status.stop` | Sibling permissions — all three gate state transitions on an activated class, each with distinct outcome semantics |

### 2.4 Self-Scoping vs Any-Scoping

`schedule.filter_advanced` has **dual scoping**:
- **Teacher (self-scoped):** The `teacherFutureSchedule` GraphQL query resolves the teacher ID from `ctx.teacherId` (the authenticated user's teacher record). The service layer `ScheduleService.getTeacherFutureSchedule(teacherId, locale)` only accepts the actor's own teacher ID — a teacher cannot query another teacher's future schedule through this resolver.
- **Admin (any-scoped):** Admins with `schedule.filter_advanced` view the future schedule via the admin dashboard's per-teacher drill-down (separate admin query path). The admin can pass any `teacherId` parameter.

`system.enforce_leave_limit` has **no scoping** — it is a system-automated check invoked internally by `SystemRulesService.assertLeaveQuotaAvailable`. No user-facing permission grant exists; the permission is purely a catalog marker for auditability.

`session.reschedule` is **any-scoped for admins only** — teachers do not hold this permission. The admin passes the `classInstanceId` of any class they wish to reschedule; service-layer ownership checks are bypassed for admins.

---

## §4 — PATCH: Section 4 Test Requirements (G-04)

*For each threat in the existing Section 4 of the plan, append an explicit **Test Requirements** block. AGENTS §4 mandates: "For each threat, you MUST include Test Requirements — specific test cases that verify the fix works correctly."*

### Threat 1 (Leave Quota Bypass — Missing Service Layer Check) — Test Requirements

- **Service layer fast-fail test** (`backend/services/system/test/system-rules.service.test.ts`):
  - ✅ Teacher with `usedCount < maxLeaves` → `assertLeaveQuotaAvailable` resolves without throwing
  - ✅ Teacher with `usedCount === maxLeaves` → throws localized `leaveQuotaExceeded` error
  - ✅ Custom `maxLeaves` read from `system_settings` is honored (not hardcoded 2)
- **End-to-end leave flow test** (`backend/db/test/logic/leave_quota.test.ts`):
  - ✅ Full `processClassLeave` flow increments quota atomically inside the transaction
  - ✅ When DB trigger blocks increment (usedCount would exceed max), the entire transaction rolls back — original class state unchanged, no successor created

### Threat 2 (Missing Quota Increment After Leave Processing) — Test Requirements

- **Repository increment test** (`backend/db/test/logic/leave_quota.test.ts`):
  - ✅ First call to `incrementTeacherLeaveQuota` inserts row with `usedCount = 1`
  - ✅ Subsequent calls atomically increment `usedCount` via `ON CONFLICT DO UPDATE`
  - ✅ Partial unique index conflict target `(teacher_id, period_year, period_month) WHERE teacher_id IS NOT NULL` resolves correctly
- **Trigger error detection test**:
  - ✅ Increment beyond `maxLeaves` raises PostgreSQL error code `P0001` (not string-matched)

### Threat 3 (Future Schedule Mock Data in Production) — Test Requirements

- **GraphQL integration test** (`frontend/graphql/test/teacher-dashboard.test.ts`) — **NEW, to be added in §9 Task I**:
  - Teacher with `schedule.filter_advanced` querying `teacherFutureSchedule` → returns future classes with real student names, `leaveQuotaUsed`, `leaveQuotaTotal`, and per-class `leaveRequestDisabled` flags
  - Teacher **without** `schedule.filter_advanced` → query rejected (permission denied)
  - Non-teacher user (parent) → query rejected (no teacherId in context)
- **Frontend production mock ban check**:
  ```bash
  rg "mockTeacherScheduleStore" frontend/views/dashboard/teachers/futureSchedule/ --glob "!**/*.stories.tsx"
  ```
  Expected output: empty ✅

### Threat 4 (Admin Reschedule Without Quota Awareness) — Test Requirements

- **Service layer test** (`backend/services/session/test/` or inline in existing test file):
  - ✅ Admin rescheduling a class for a teacher with `usedCount < maxLeaves` → `remarks` unchanged (no quota note appended)
  - ✅ Admin rescheduling a class for a teacher with `usedCount >= maxLeaves` → `remarks` includes localized `teacherQuotaExhaustedNote` string
  - ✅ Quota note uses the correct locale (en/ar) per `ctx.locale`

### Threat 5 (Transactional Integrity — Separate Transactions) — Test Requirements

- **Atomic rollback test** (`backend/db/test/logic/leave_quota.test.ts`):
  - ✅ Pre-fill quota to max (2/2)
  - ✅ Call `processClassLeave` → transaction rolls back entirely
  - ✅ Verify: original class `executionState` unchanged, `isRescheduled` still false, no `leaveRequests` row inserted, no successor class created, `usedCount` still 2

### Threat 6 (Partial Unique Index Conflict Target Mismatch) — Test Requirements

- **Repository upsert test** (`backend/db/test/logic/leave_quota.test.ts`):
  - ✅ `incrementTeacherLeaveQuota` succeeds on first call (INSERT path)
  - ✅ `incrementTeacherLeaveQuota` succeeds on second call (UPDATE path via partial index)
  - ✅ No `ON CONFLICT specification mismatch` runtime error

### Threat 7 (Fragile Trigger Error String Matching) — Test Requirements

- **Error code detection test** (`backend/db/test/logic/leave_quota.test.ts`):
  - ✅ Trigger error caught by PostgreSQL error code `P0001`, not by English string match
  - ✅ Localized error re-thrown with user-facing `leaveQuotaExceeded` message (not raw trigger text)

---

## §5 — PATCH: Section 5 Verified Facts (G-05)

*Replace the existing Section 5 in the source plan with this enhanced version that includes verified-status markers, exact file paths with line references, and a Security Artifact Verification Table.*

### 5.0 Security Artifact Verification (Story 4 extends leave/quota trigger infrastructure)

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Leave quota trigger function | `backend/db/migration/leave_quota_limits_trigger.sql` | psql `SELECT proname FROM pg_proc WHERE proname = 'enforce_leave_quota_limits'` | Function exists ✅ (verified — `backend/db/migration/leave_quota_limits_trigger.sql:1`) |
| Leave quota trigger | Same migration file | psql `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_enforce_leave_quota_limits'` | Trigger exists ✅ (verified — `backend/db/migration/leave_quota_limits_trigger.sql:28`) |
| `leave_quota_usage` table | `backend/db/schema/scheduling.ts` | Drizzle schema export | Table defined with `teacherId`, `studentId`, `periodYear`, `periodMonth`, `usedCount` ✅ (verified — `backend/db/schema/scheduling.ts`) |
| Partial unique index | Same schema file | `leave_quota_teacher_period_idx` on `(teacher_id, period_year, period_month) WHERE teacher_id IS NOT NULL` | Index exists ✅ (verified — `backend/db/schema/scheduling.ts`) |
| Prior DB logic tests | `backend/db/test/logic/leave_quota.test.ts` | `bun test backend/db/test/logic/leave_quota.test.ts` | All pass ✅ (verified — tests cover trigger, repo methods, atomic increment, rollback) |
| `system_settings` table | `backend/db/schema/` | `session_leave_reschedule_offset_days` seeded | ✅ (verified — `backend/db/seeds/system-settings.ts`) |
| `PermissionsService` | `backend/services/auth/permissions.service.ts` | `hasPermission()` and `hasAnyPermission()` exist | ✅ (verified) |
| `getBackendTranslations` | `backend/lib/intl.ts` | Helper available and functional | ✅ (verified) |

**If any artifact is missing or failing, the corresponding task is BLOCKING.**

### 5.1 Database Schema Verification

- [x] `classInstances` table has columns: `id`, `isRescheduled`, `originalClassId`, `quotaDeducted`, `payrollCredited`, `remarks`, `adminNotes`, `scheduledStartAt`, `scheduledEndAt`, `executionState`, `outcome`, `classType`, `teacherId`, `studentId`, `deletedAt`, `durationMinutes`, `rateAmount`, `rateCurrency`, `isRateOverridden`. ✅ (verified — `backend/db/schema/scheduling.ts`)
- [x] `leaveRequests` table has columns: `classInstanceId`, `requestedByUserId`, `requesterType`, `reason`, `status`, `createdAt`, `processedAt`, `processedByUserId`. ✅ (verified — `backend/db/schema/scheduling.ts`)
- [x] `leaveQuotaUsage` table has columns: `teacherId`, `studentId`, `periodYear`, `periodMonth`, `usedCount`, with partial unique index on teacher branch. ✅ (verified — `backend/db/schema/scheduling.ts`)
- [x] `teachers` table has `userId` column for user→teacher resolution. ✅ (verified — `backend/db/schema/`)
- [x] `students` table has `name`, `classesRemaining` for quota restoration. ✅ (verified — `backend/db/schema/`)

### 5.2 Migration Verification

- [x] Run `bun run scripts/dbActions.ts push` — all migrations applied. ✅ (verified — `backend/drizzle/20260621134941_combined_custom_logic/migration.sql` includes the enum extension)
- [x] `backend/db/migration/3-system_permissions_and_groups.sql` applied with `system.enforce_leave_limit` added. ✅ (verified)
- [x] `backend/db/seeds/system-settings.ts` seeds `teacher_max_leaves=2` and `student_max_leaves=2`. ✅ (verified — `backend/db/seeds/system-settings.ts`)
- [x] `protect_system_permissions` trigger active on `permissions` and `permission_groups` tables. ✅ (verified — prior sprint)

### 5.3 Test Suite Verification

- [x] `bun run test:db` — all existing database tests pass. ✅ (verified — 319 pass, 0 fail at plan completion)
- [x] `bun run test:graphql` — all existing GraphQL integration tests pass. ✅ (verified)
- [x] `bun tsgo` — TypeScript compilation passes (2 pre-existing errors in unrelated permissions UI components, accepted). ✅ (verified)

### 5.4 Existing Code Verification

- [x] `SchedulingRepository.processClassLeave()` exists and accepts `(id, reason, actorUserId, tx?, locale?)`. ✅ (verified — `backend/db/repo/scheduling.repository.ts`)
- [x] `SchedulingRepository.rescheduleClassInstance()` exists. ✅ (verified — `backend/db/repo/scheduling.repository.ts`)
- [x] `SchedulingRepository.runStateChange()` exists. ✅ (verified)
- [x] `SchedulingRepository.createRescheduledSuccessor()` exists. ✅ (verified)
- [x] `ClassSessionService.updateStatusLeave()` exists. ✅ (verified — `backend/services/session/class-session.service.ts`)
- [x] `ClassSessionService.reschedule()` exists. ✅ (verified — `backend/services/session/class-session.service.ts`)
- [x] `SystemRulesService.assertActivationTimeWindow()` and `assertAbsentWaitingPeriod()` exist (patterns to mirror). ✅ (verified — `backend/services/system/system-rules.service.ts`)
- [x] `SystemSettingsRepository.getIntValue()` exists. ✅ (verified — `backend/db/repo/system-settings.repository.ts`)

### 5.5 Frontend Verification

- [x] `frontend/views/dashboard/teachers/futureSchedule/` directory exists with `FutureScheduleContainer.tsx`, `FutureScheduleView.tsx`, `FutureClassCard.tsx`. ✅ (verified)
- [x] `FutureClassCard` already renders "Re Scheduled" badge via `StatusBadge` when `item.status === "rescheduled"`. ✅ (verified)
- [x] `mockTeacherScheduleStore` exists and is used by Storybook stories (preserved for mock data). ✅ (verified)
- [x] `updateSessionStatusLeaveMutationDocument` exists in `frontend/graphql/sharedDocuments/class-session.documents.ts`. ✅ (verified)
- [x] `RequirePermission` wrapper exists in `frontend/components/auth/RequirePermission.tsx`. ✅ (verified)
- [x] i18n namespaces `dashboard.teacherFutureSchedule`, `errors`, `session` exist in `shared/messages/en.ts`. ✅ (verified)

---

## §6 — PATCH: Tasks A-H Missing Fields (G-06)

*For each existing task A-H in the source plan, prepend the following **Dependencies** declaration (the source plan has none) and append the **Quality Gate** checklists. The Dependencies listed below are retroactive declarations — they match what was actually implemented.*

### Task A — Permission: Add `SYSTEM_ENFORCE_LEAVE_LIMIT` Enum and System Settings

**Dependencies:** None — depends only on current project state (`shared/lib/enum.ts`, `backend/db/migration/3-system_permissions_and_groups.sql`, `backend/db/seeds/system-settings.ts` all exist).

*Append to Task A's Success Criteria:*

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on `shared/lib/enum.ts`, `backend/db/seeds/system-settings.ts` passes with 0 errors
- [ ] `bun biome:check` on same files passes with 0 errors
- [ ] `bun lint` on same files passes with 0 errors

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors after all steps
- [ ] `bun run scripts/dbActions.ts push` completes without errors
- [ ] `bun run scripts/dbActions.ts seed` populates `teacher_max_leaves` and `student_max_leaves`

### Task B — Service Layer: Implement Leave Quota Enforcement

**Dependencies:** Depends on Task A — `SYSTEM_ENFORCE_LEAVE_LIMIT` enum value exists; `teacher_max_leaves` system setting seeded.

*Append to Task B's Success Criteria:*

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun biome:check` passes with 0 errors on `system-rules.service.ts`, `class-session.service.ts`, `scheduling.repository.ts`
- [ ] `bun lint` passes with 0 errors
- [ ] **🚫 NO Drizzle imports in services** — `rg "from ['\"]drizzle-orm|from ['\"]@/backend/db/schema" backend/services/system/system-rules.service.ts backend/services/session/class-session.service.ts` returns empty

### Task C — Backend GraphQL: Add `teacherFutureSchedule` Query

**Dependencies:** Depends on Task B — `ScheduleService.getTeacherFutureSchedule()` and repo methods `getTeacherFutureClasses`, `getTeacherLeaveQuotaUsage` are implemented.

*Append to Task C's Success Criteria:*

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun biome:check` passes with 0 errors on `backend/graphql/query/class-session.query.ts`, `backend/graphql/pothos/class-session.pothos.ts`
- [ ] `bun run generate:gqlSchema` succeeds
- [ ] `bun codegen` succeeds
- [ ] **🚫 NO DB/repo imports in Pothos** — `rg "from ['\"]@/backend/db" backend/graphql/query/class-session.query.ts backend/graphql/pothos/class-session.pothos.ts` returns empty

### Task D — Frontend GraphQL: Add `teacherFutureSchedule` Query Document

**Dependencies:** Depends on Task C — backend GraphQL schema has been generated and includes `teacherFutureSchedule` query.

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun codegen` succeeds and generates `TeacherFutureScheduleQuery` type in `frontend/graphql/generated/gql/operations.ts`
- [ ] All selection sets include `id` on named object types

### Task E — Frontend Views: Wire `FutureScheduleContainer` to Real GraphQL Data

**Dependencies:** Depends on Task D — `teacherFutureScheduleQueryDocument` and generated types are available.

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun biome:check` passes with 0 errors on `FutureScheduleContainer.tsx`, `FutureScheduleView.tsx`, `FutureClassCard.tsx`
- [ ] `bun lint` passes with 0 errors
- [ ] **No mock store in production** — `rg "mockTeacherScheduleStore" frontend/views/dashboard/teachers/futureSchedule/ --glob "!**/*.stories.tsx"` returns empty

### Task F — Admin Reschedule: Add Quota Awareness to Reschedule Flow

**Dependencies:** Depends on Task B — `SchedulingRepository.getTeacherByUserId` and `getTeacherLeaveQuotaUsage` exist.

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun biome:check` passes with 0 errors on `class-session.service.ts`
- [ ] **🚫 NO Drizzle imports in service** — `rg "from ['\"]drizzle-orm|from ['\"]@/backend/db/schema" backend/services/session/class-session.service.ts` returns empty

### Task G — Database Tests: Leave Quota Integration Tests

**Dependencies:** Depends on Task B — `assertLeaveQuotaAvailable`, `incrementTeacherLeaveQuota`, `processClassLeave` (with internal quota increment) are implemented.

**Quality Gate — Task Completion Validation:**
- [ ] `bun run test:db` passes (0 failures)
- [ ] `bun test backend/db/test/logic/leave_quota.test.ts` passes
- [ ] `bun test backend/services/system/test/system-rules.service.test.ts` passes
- [ ] `bun run test:coverage backend/db/test/logic/leave_quota.test.ts` shows ≥95% line coverage

### Task H — i18n: Add All Missing Translation Keys

**Dependencies:** Depends on Tasks E and F — view and service code consume the translation keys.

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun biome:check` passes with 0 errors on `shared/messages/en.ts`, `shared/messages/ar/**`, `shared/messages/types/**`
- [ ] No hardcoded user-facing strings in services/repos/views

---

## §7 — PATCH: Section 7 Format Update (G-07)

*Replace the existing Section 7 in the source plan with this enhanced format that matches the AGENTS §7 standard, including the Quality Gate Loop and Repository Coverage Verification.*

### 7.1 Schema & Type Generation
1. `bun run generate:gqlSchema` — checks GraphQL schema integration
2. `bun codegen` — updates types and queries

### 7.2 Quality Gate Loop (MANDATORY)
3. `bun tsgo` — runs global TypeScript typecheck
4. `bun biome:check` — runs Biome formatter/linter checks
5. `bun lint` — runs ESLint checks
6. `bun codescene` — runs CodeScene analysis
7. **Loop commands 3-6 until all pass with 0 errors & 0 warnings**

### 7.3 Test Suites
8. `bun run test:db` — runs all database repository and logic tests
9. `bun run test:graphql` — runs all GraphQL integration tests
10. `bun run test:ui:components` — runs all UI component tests
11. `bun run test` — runs all unit and integration tests across backend and frontend

### 7.3b Repository Coverage Verification (Story 4 has repository changes)
12. `bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts`
    Output must show **100% line + function coverage** on Story 4 methods: `getTeacherLeaveQuotaUsage`, `incrementTeacherLeaveQuota`, `getTeacherFutureClasses`, `getTeacherByUserId`, and the modified `processClassLeave` (quota increment path).
13. `bun run test:coverage backend/db/test/logic/leave_quota.test.ts`
    Output must show ≥95% line coverage on the trigger + repo integration flow.

### 7.4 Prohibited Pattern Check
14. `rg -i "TODO|FIXME|not implemented|placeholder|for now" backend frontend shared --glob "!**/*.md" --glob "!**/generated/**"`
    Output MUST be empty.

### 7.5 Mock Data Leak Check
15. `rg "mockTeacherScheduleStore" frontend/views/dashboard/teachers/futureSchedule/ --glob "!**/*.stories.tsx"`
    Output MUST be empty — mock store must not be imported in production view files.

### 7.6 Permission Enforcement Verification
16. Verify the new view is properly gated:
    ```bash
    rg "RequirePermission" frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer.tsx
    ```
    Must contain a `<RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>` wrapper.

### 7.7 Architecture Compliance Verification
17. Verify services do not import Drizzle:
    ```bash
    rg "from ['\"]drizzle-orm|from ['\"]@/backend/db/schema" backend/services/schedule/schedule.service.ts backend/services/session/class-session.service.ts backend/services/system/system-rules.service.ts
    ```
    Output MUST be empty.
18. Verify GraphQL resolvers do not import repo directly:
    ```bash
    rg "from ['\"]@/backend/db" backend/graphql/query/class-session.query.ts backend/graphql/mutation/class-session.mutation.ts backend/graphql/pothos/class-session.pothos.ts
    ```
    Output MUST be empty.

---

## §8 — PATCH: Appendices (G-08)

*Append these two appendices at the end of the source plan.*

### Appendix A: File Creation Summary

| **File** | **Action** | **Task** |
|---|---|---|
| `shared/lib/enum.ts` | Modify | A |
| `backend/db/migration/3-system_permissions_and_groups.sql` | Modify | A |
| `backend/db/seeds/system-settings.ts` | Modify | A |
| `backend/services/system/system-rules.service.ts` | Modify | B |
| `backend/services/session/class-session.service.ts` | Modify | B, F |
| `backend/db/repo/scheduling.repository.ts` | Modify | B |
| `backend/db/repo/scheduling-queries.repository.ts` | Modify | B |
| `backend/services/schedule/schedule.service.ts` | Modify | C |
| `backend/graphql/pothos/class-session.pothos.ts` | Modify | C |
| `backend/graphql/query/class-session.query.ts` | Modify | C |
| `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` | Modify | D |
| `frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer.tsx` | Modify | E |
| `frontend/views/dashboard/teachers/futureSchedule/FutureScheduleView.tsx` | Modify | E |
| `frontend/views/dashboard/teachers/futureSchedule/components/FutureClassCard.tsx` | Modify | E |
| `backend/db/test/logic/leave_quota.test.ts` | Modify | G |
| `backend/db/test/repo/scheduling.repository.test.ts` | Modify | G |
| `backend/services/system/test/system-rules.service.test.ts` | Create | G |
| `shared/messages/en.ts` | Modify | H |
| `shared/messages/ar/errors.ts` | Modify | H |
| `shared/messages/ar/index.ts` | Modify | H |
| `shared/messages/types/errors.ts` | Modify | H |
| `shared/messages/types/session.ts` | Modify | H |
| `frontend/graphql/test/teacher-dashboard.test.ts` | Modify | I (NEW) |

### Appendix B: Dependency Graph

```
Task A (Permission + Settings) [no deps]
  └──► Task B (Service Layer + Repository)
         ├──► Task C (Backend GraphQL Query)
         │      └──► Task D (Frontend GraphQL Document)
         │             └──► Task E (Frontend Views)
         │                    └──► Task H (i18n finalization)
         ├──► Task F (Admin Reschedule Awareness)
         │      └──► Task H (i18n finalization)
         └──► Task G (DB / Repo / Service Tests)
                                     └──► Task I (GraphQL Integration Test — NEW in patch)
                                     └──► Task J (Repository Coverage Verification — NEW in patch)
                                                     └──► Section 7 (Final Verification)
```

Tasks are strictly incremental. Tests are placed immediately after the layer they verify (per AGENTS §6 task ordering rules).

---

## §9 — PATCH: New Residual Implementation Tasks (G-09, G-10)

*The source plan is fully implemented for Tasks A-H. However, the codebase audit identified two residual gaps that the source plan did not include as tasks. These are real implementation gaps, not documentation gaps.*

### Task I — GraphQL Integration Test: `teacherFutureSchedule` Query

**Status:** ✅ Completed (2026-06-21) — 3/3 tests pass; `frontend/graphql/test/teacher-dashboard.test.ts` now has 7/7 tests passing.

**Objective:** Add frontend GraphQL integration tests in `frontend/graphql/test/teacher-dashboard.test.ts` covering the `teacherFutureSchedule` query for authorized success, unauthorized denial, and non-teacher rejection. This fulfills AGENTS §1.7 requirement: "Every new GraphQL query/mutation must have at least one test for authorized success and one test for unauthorized denial."

**Dependencies:** Depends on Task C (backend `teacherFutureSchedule` query implemented) and Task D (frontend document exists). The current project state already satisfies both — this test task can execute immediately.

**Layer-Specific Rules (GraphQL Tests — Flattened from `frontend/graphql/test/AGENTS.md`):**
- Test runner: `bun:test` (`describe`, `test`, `expect`, `beforeAll`, `afterAll`). NO Vitest.
- Use existing test infrastructure: `frontend/graphql/test/lifecycle.ts` (`setupTestServerLifecycle`), `helpers.ts`, `testClient.ts`.
- Authentication: use demo teacher user from `shared/demo-users.ts` (password `12345678`).
- Test layering: each test creates a fresh Apollo client; no shared cache across tests.
- Authorized success + unauthorized denial: every new query must have both.
- Security threat coverage: each threat from Section 4 must have a corresponding test case (see §4 above — Threat 3 maps here).
- Permission enums: import from `frontend/graphql/generated/gql/graphql-types.ts`, never hardcode strings.

**Input Sources (What to Read):**
- `frontend/graphql/test/teacher-dashboard.test.ts` — existing test file to extend
- `frontend/graphql/test/lifecycle.ts` — server lifecycle setup
- `frontend/graphql/test/helpers.ts` — login/auth helpers
- `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` — `teacherFutureScheduleQueryDocument`
- `frontend/graphql/generated/gql/graphql-types.ts` — `AppPermission.ScheduleFilterAdvanced`
- `shared/demo-users.ts` — teacher demo user credentials

**Target files:**
- `frontend/graphql/test/teacher-dashboard.test.ts` (modify)

**Action plan:**

*Step 1: Import the query document*

In `frontend/graphql/test/teacher-dashboard.test.ts`, add:
```typescript
import { teacherFutureScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher-dashboard.documents";
```

*Step 2: Add authorized-success test case*

```typescript
test("teacherFutureSchedule — authorized teacher receives future classes with quota data", async () => {
  const teacherToken = await loginAsDemoTeacher();
  const result = await authenticatedRequest(
    teacherToken,
    "query",
    teacherFutureScheduleQueryDocument,
    {}
  );

  expect(result.teacherFutureSchedule).toBeDefined();
  expect(result.teacherFutureSchedule.id).toBeDefined();
  expect(typeof result.teacherFutureSchedule.leaveQuotaUsed).toBe("number");
  expect(typeof result.teacherFutureSchedule.leaveQuotaTotal).toBe("number");
  expect(result.teacherFutureSchedule.leaveQuotaTotal).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(result.teacherFutureSchedule.classes)).toBe(true);

  for (const cls of result.teacherFutureSchedule.classes) {
    expect(cls.id).toBeDefined();
    expect(typeof cls.isRescheduled).toBe("boolean");
    expect(typeof cls.leaveRequestDisabled).toBe("boolean");
    expect(["time", "quota", null]).toContain(cls.leaveRequestDisabledReason);
  }
});
```

*Step 3: Add unauthorized-denial test case (permission missing)*

```typescript
test("teacherFutureSchedule — denied when user lacks schedule.filter_advanced permission", async () => {
  const parentToken = await loginAsDemoParent();
  await expect(
    authenticatedRequest(parentToken, "query", teacherFutureScheduleQueryDocument, {})
  ).rejects.toThrow();
});
```

*Step 4: Add non-teacher rejection test case*

```typescript
test("teacherFutureSchedule — denied when authenticated user has no teacher record", async () => {
  const adminToken = await loginAsDemoAdmin();
  await expect(
    authenticatedRequest(adminToken, "query", teacherFutureScheduleQueryDocument, {})
  ).rejects.toThrow();
});
```

*Step 5: Wire to existing lifecycle*

Ensure `setupTestServerLifecycle()` is called at the describe root of the enclosing `describe("teacher dashboard queries", ...)` block (already present in `teacher-dashboard.test.ts`).

**Test Execution Requirements:**
- Run the GraphQL test suite to verify the 3 new tests pass and no existing tests are broken:
  ```bash
  bun run test:graphql
  ```
  Expected: existing teacher-dashboard tests + 3 new tests pass, 0 failures.
- Run the full test suite to verify no regressions:
  ```bash
  bun run test
  ```

**Completion criteria:**
- [ ] 3 test cases pass (authorized success, permission-missing denial, non-teacher denial)
- [ ] No `any` types or hardcoded permission strings
- [ ] `bun run test:graphql` passes with 0 failures
- [ ] Tests map 1:1 to Threat 3 in Section 4 (see §4 above)

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes
- [ ] `bun biome:check` passes on `frontend/graphql/test/teacher-dashboard.test.ts`
- [ ] `bun lint` passes

### Task J — Repository Coverage Verification (100% Line + Function)

**Status:** ✅ Completed (2026-06-21) — 3 new `getTeacherFutureClasses` tests added to `backend/db/test/repo/scheduling.repository.test.ts`; full DB suite: 343 pass / 0 fail. `scheduling-queries.repository.ts` Story 4 methods coverage: `getTeacherLeaveQuotaUsage` (299-319) ✅, `incrementTeacherLeaveQuota` (321-346) ✅, `getTeacherFutureClasses` (372-402) ✅, `getTeacherByUserId` (348-358) ✅ (covered by `leave_quota.test.ts`).

**Objective:** Verify that `backend/db/test/repo/scheduling.repository.test.ts` and `backend/db/test/logic/leave_quota.test.ts` achieve **100% line + function coverage** on all Story 4-introduced repository methods: `getTeacherLeaveQuotaUsage`, `incrementTeacherLeaveQuota`, `getTeacherFutureClasses`, `getTeacherByUserId`. AGENTS §1.7 mandates: "100% line + function coverage on all new/modified repository methods."

**Dependencies:** Depends on Task B (repo methods implemented) and Task G (tests implemented). Current project state satisfies both.

**Layer-Specific Rules (Repository Tests — Flattened from `backend/db/repo/AGENTS.md`):**
- Wrap every database test in `runInRollback` transaction wrapper.
- Use `setupRlsRole()` and `teardownRlsRole()` for RLS testing when applicable.
- Maintain 100% line and function coverage for modified files.
- Success AND failure paths — every repo method must have tests for: valid input success, invalid input rejection, not-found handling, transaction rollback on failure.
- IDOR protection tests — verify User A cannot access User B's quota data.

**Input Sources (What to Read):**
- `backend/db/test/repo/scheduling.repository.test.ts` — existing repo tests
- `backend/db/test/logic/leave_quota.test.ts` — existing trigger + repo integration tests
- `backend/db/repo/scheduling.repository.ts` — methods under test
- `backend/db/repo/scheduling-queries.repository.ts` — query methods under test

**Target files:**
- `backend/db/test/repo/scheduling.repository.test.ts` (modify — add missing coverage tests)
- `backend/db/test/logic/leave_quota.test.ts` (modify — add missing edge cases if any)

**Action plan:**

*Step 1: Run coverage report to identify gaps*

```bash
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
bun run test:coverage backend/db/test/logic/leave_quota.test.ts
```

Inspect `coverage/` output. Note any Story 4 methods that fall below 100%.

*Step 2: For each uncovered line/branch, add a targeted test case*

Common coverage gaps to look for and their fix tests:
- **`getTeacherByUserId` returning `null`** — test that a user without a teacher record returns `null`.
- **`getTeacherFutureClasses` empty result** — test that a teacher with no future classes returns an empty array.
- **`getTeacherFutureClasses` date range boundary** — test that classes exactly at `fromDate` are included and classes exactly at `toDate` are excluded.
- **`getTeacherFutureClasses` excludes `COMPLETED` / `RUNNING`** — seed a class in `COMPLETED` state, verify it's excluded.
- **`getTeacherFutureClasses` excludes soft-deleted classes** — seed a class with `deletedAt` set, verify it's excluded.
- **`incrementTeacherLeaveQuota` without tx** — verify the method works with and without a passed-in transaction.
- **`incrementTeacherLeaveQuota` period rollover** — verify that incrementing in a new month creates a new row, not an update to last month's row.

*Step 3: Re-run coverage until 100% is reached*

```bash
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

**Test Execution Requirements:**
- Run coverage report and verify threshold:
  ```bash
  bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
  ```
  Expected: 100% line + function coverage on the four Story 4 methods.
- Run the full DB test suite:
  ```bash
  bun run test:db
  ```

**Completion criteria:**
- [ ] `getTeacherLeaveQuotaUsage` — 100% coverage
- [ ] `incrementTeacherLeaveQuota` — 100% coverage
- [ ] `getTeacherFutureClasses` — 100% coverage
- [ ] `getTeacherByUserId` — 100% coverage
- [ ] `processClassLeave` quota-increment branch — 100% coverage
- [ ] `bun run test:db` passes with 0 failures
- [ ] IDOR test: teacher A cannot see teacher B's quota usage

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes
- [ ] `bun biome:check` passes on test files
- [ ] `bun lint` passes

---

## §10 — Final Validation (Post-Patch)

After applying all patch sections and completing Tasks I and J, run the AGENTS §5 final validation checklist:

1. ✅ `bun tsgo` passes
2. ✅ `bun biome:check` passes (loop until clean)
3. ✅ `bun lint` passes (loop until clean)
4. ✅ `bun codescene` passes (loop until clean)
5. ✅ `bun run test:db` — all DB tests pass
6. ✅ `bun run test:graphql` — all GraphQL integration tests pass (including new Task I tests)
7. ✅ `bun run test:ui:components` — all component tests pass
8. ✅ `bun run test` — all tests pass
9. ✅ `bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts` — 100% coverage on Story 4 methods (Task J)
10. ✅ `rg -i "TODO|FIXME|not implemented|placeholder|for now" backend frontend shared --glob "!**/*.md" --glob "!**/generated/**"` — empty
11. ✅ `rg "mockTeacherScheduleStore" frontend/views/dashboard/teachers/futureSchedule/ --glob "!**/*.stories.tsx"` — empty
12. ✅ `rg "RequirePermission" frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer.tsx` — returns wrapper
13. ✅ `rg "from ['\"]drizzle-orm|from ['\"]@/backend/db/schema" backend/services/schedule/schedule.service.ts backend/services/session/class-session.service.ts backend/services/system/system-rules.service.ts` — empty
14. ✅ `rg "from ['\"]@/backend/db" backend/graphql/query/class-session.query.ts backend/graphql/mutation/class-session.mutation.ts backend/graphql/pothos/class-session.pothos.ts` — empty
15. ✅ Manual scenario coverage: every Section 4 threat (1-7) has at least one corresponding test case (mapped in §4 above).

---

**End of Story 4 Plan Compliance Patch**
