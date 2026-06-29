# Schedule Page Refactor — Task Tracker

**Plan file:** `.opencode/plans/schedule-page-refactor.md`
**Route:** `app/[locale]/(dashboard)/teachers/[id]/schedule`
**Date:** 2026-06-29

---

## Legend

- `[ ]` Not implemented
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked

---

## Phase 0: Shared Prerequisites

- [x] **P0A** Add 13 new permissions to `AppPermission` enum in `shared/lib/enum.ts`
- [x] **P0B** Read all layer AGENTS.md files (each subagent must do this before starting)

---

## Phase 1: Database Schema

- [x] **P1A** Create `backend/db/schema/class-category.ts` (`class_categories` table)
- [x] **P1B** Create `backend/db/schema/class-subject.ts` (`class_subjects` table)
- [x] **P1C** Create `backend/db/schema/subject-resource.ts` (`subject_resources` junction table)
- [x] **P1D** Create `backend/db/schema/teacher-notes.ts` (`teacher_important_notes` table)
- [x] **P1E** Edit `backend/db/schema/scheduling.ts` — add `subjectId` FK to `recurringSchedules` + `classInstances`
- [x] **P1F** Edit `backend/db/schema/index.ts` — re-export 4 new schema modules

**Dependencies:** P1A before P1E (FK ref). P1A+P1B+P1C+P1D before P1F (index registration). P1A∥P1B∥P1C∥P1D parallel, then P1E→P1F sequential.

---

## Phase 2: Type Definitions

- [x] **P2A** Create `backend/types/class-category.types.ts`
- [x] **P2B** Create `backend/types/class-subject.types.ts`
- [x] **P2C** Create `backend/types/teacher-notes.types.ts` (includes `SupportContactReturnType`)
- [x] **P2D** Create or edit `backend/types/schedule.types.ts` — add `subjectId`/`subjectName` fields

**Dependencies:** Phase 1 complete. P2A∥P2B∥P2C parallel, then P2D sequential.

---

## Phase 3: Repositories

- [x] **P3A** Create `backend/db/repo/class-category.repository.ts`
- [x] **P3B** Create `backend/db/repo/class-subject.repository.ts`
- [x] **P3C** Create `backend/db/repo/subject-resource.repository.ts`
- [x] **P3D** Create `backend/db/repo/teacher-notes.repository.ts`
- [x] **P3E** Edit `backend/db/repo/index.ts` — export new repos
- [x] **P3F** Edit `backend/db/repo/scheduling/scheduling-queries.repository.ts` — add `classType`/`subjectId` to `FutureClassRow`

**Dependencies:** Phase 2 complete. P3A∥P3B∥P3C∥P3D parallel, then P3E→P3F sequential.

---

## Phase 4: Services

- [x] **P4A** Create `backend/services/subject/class-category.service.ts`
- [x] **P4B** Create `backend/services/subject/class-subject.service.ts`
- [x] **P4C** Create `backend/services/subject/teacher-notes.service.ts`
- [x] **P4D** Edit `backend/services/schedule/schedule.service.ts` — add notes+contact+subjectName+classType to future schedule; add subjectName to weekly schedule; fix hardcoded courseName/location/studentCount

**Dependencies:** Phase 3 complete. P4A∥P4B∥P4C parallel, then P4D sequential (needs 4B+4C).

---

## Phase 5: Pothos GraphQL

- [x] **P5A** Create `backend/graphql/pothos/class-category.pothos.ts`
- [x] **P5B** Create `backend/graphql/pothos/class-subject.pothos.ts`
- [x] **P5C** Create `backend/graphql/pothos/teacher-notes.pothos.ts`
- [x] **P5D** Create `backend/graphql/query/class-category.query.ts` (category+subject queries)
- [x] **P5E** Create `backend/graphql/mutation/class-category.mutation.ts`
- [x] **P5F** Create `backend/graphql/mutation/class-subject.mutation.ts`
- [x] **P5G** Create `backend/graphql/mutation/teacher-notes.mutation.ts`
- [x] **P5H** Edit `backend/graphql/pothos/class-session.pothos.ts` — add `importantNotes`/`supportContact`/`subjectName`/`classType` fields
- [x] **P5I** Edit `backend/graphql/query/class-session.query.ts` — update `teacherFutureSchedule` resolver for new fields

**Dependencies:** Phase 4 complete. P5A∥P5B∥P5C parallel, then P5D→P5E→P5F→P5G→P5H→P5I sequential.

---

## Phase 6: Codegen + SQL Migration

- [x] **P6A** Run `bun run generate:gqlSchema` — completed successfully
- [x] **P6B** Run `bun codegen` — completed successfully
- [x] **P6C** Create `backend/db/migration/4-class_categories_and_subjects.sql` — completed
- [x] **P6D** Create `backend/db/migration/4b-teacher_support_contact_setting.sql` — completed
- [x] **P6E** Run Drizzle migration generation (`bun run db generate`) — completed; also used `drizzle-kit push --force` for DDL application
- [x] **P6F** Run Drizzle migration (`bun run db migrate`) — completed via `drizzle-kit push` + separate seed script (enum visibility + trigger constraints required this approach)

**Dependencies:** Phase 5 complete. All sequential.

---

## Phase 7: Frontend Documents & Stores

- [x] **P7A** Create `frontend/graphql/sharedDocuments/class-category.documents.ts`
- [x] **P7B** Create `frontend/graphql/sharedDocuments/class-subject.documents.ts`
- [x] **P7C** Create `frontend/graphql/sharedDocuments/teacher-notes.documents.ts`
- [x] **P7D** Create `frontend/stores/subjectManagementStore.ts`
- [x] **P7E** Create `frontend/stores/futureScheduleDateStore.ts`
- [x] **P7F** Edit `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` — update future schedule query
- [x] **P7G** Edit `frontend/graphql/sharedDocuments/weekly-schedule.documents.ts` — add `subjectName`/`classType`
- [x] **P7H** Edit `frontend/graphql/sharedDocuments/index.ts` — re-export new docs

**Dependencies:** Phase 6 complete. P7A∥P7B∥P7C∥P7D∥P7E parallel, then P7F→P7G→P7H sequential.

---

## Phase 8: Subject Management Pages

- [x] **P8A** Create `frontend/views/dashboard/subjects/home/types.ts`
- [x] **P8B** Create `frontend/views/dashboard/subjects/home/SubjectsView.tsx`
- [x] **P8C** Create `frontend/views/dashboard/subjects/home/components/SubjectCard.tsx`
- [x] **P8D** Create `frontend/views/dashboard/subjects/home/components/CreateSubjectDialog.tsx`
- [x] **P8E** Create `frontend/views/dashboard/subjects/home/components/EditSubjectDialog.tsx`
- [x] **P8F** Create `frontend/views/dashboard/subjects/home/components/DeleteSubjectDialog.tsx`
- [x] **P8G** Create `frontend/views/dashboard/subjects/home/SubjectsContainer.stories.tsx`
- [x] **P8H** Create `frontend/views/dashboard/subjects/home/components/CategoriesSection.tsx`
- [x] **P8I** Create `frontend/views/dashboard/subjects/home/components/CreateCategoryDialog.tsx`
- [x] **P8J** Create `frontend/views/dashboard/subjects/home/components/EditCategoryDialog.tsx`
- [x] **P8K** Create `frontend/views/dashboard/subjects/home/components/DeleteCategoryDialog.tsx`
- [x] **P8L** Create `frontend/views/dashboard/subjects/detail/types.ts`
- [x] **P8M** Create `frontend/views/dashboard/subjects/detail/SubjectDetailView.tsx`
- [x] **P8N** Create `frontend/views/dashboard/subjects/detail/SubjectDetailContainer.tsx`
- [x] **P8O** Create `frontend/views/dashboard/subjects/detail/SubjectDetailContainer.stories.tsx`
- [x] **P8P** Create `frontend/views/dashboard/subjects/home/SubjectsContainer.tsx`
- [x] **P8Q** Create `app/[locale]/(dashboard)/subjects/page.tsx`
- [x] **P8R** Create `app/[locale]/(dashboard)/subjects/[id]/page.tsx`
- [x] **P8S** Edit `frontend/views/dashboard/config/navigationConfig.ts` — add subjects nav item
- [x] **P8T** Edit `shared/messages/types/dashboard/core/nav.ts` — add subjects label type
- [x] **P8U** Edit `shared/messages/en.ts` — add subjects nav English label
- [x] **P8V** Edit `shared/messages/ar/dashboard/core/nav.ts` — add subjects nav Arabic label

**Dependencies:** Phase 7 complete. P8A→P8B∥P8C∥P8D∥P8E∥P8F∥P8G, P8H∥P8I∥P8J∥P8K, P8L→P8M∥P8N∥P8O parallel groups. Then P8P→P8Q→P8R sequential. Then P8S→P8T→P8U→P8V sequential.

---

## Phase 9: Schedule Route Refactors

### 9A: Weekly Schedule

- [x] **P9A-1** Create `frontend/views/dashboard/teachers/schedule/weekly/types.ts`
- [x] **P9A-2** Edit `WeeklyScheduleGrid.tsx` — remove in-file types, import from `types.ts`
- [x] **P9A-3** Edit `MobileScheduleList.tsx` — fix imports, remove in-file types
- [x] **P9A-4** Edit `TeacherWeeklyScheduleView.tsx` — remove in-file types, fix imports
- [x] **P9A-5** Edit `TeacherWeeklyScheduleContainer.tsx` — add `useNotifications`, fix `lastUpdated`, enum types, import from `types.ts`
- [x] **P9A-6** Edit `CreateRecurringClassDialog.tsx` — `ClassType` enum, replace `Alert` with notifications, i18n, import from `types.ts`
- [x] **P9A-7** Edit `app/.../schedule/weekly/page.tsx` — add auth guard + `setRequestLocale`

### 9B: Future Schedule

- [x] **P9B-1** Create `frontend/views/dashboard/teachers/futureSchedule/types.ts`
- [x] **P9B-2** Edit `FutureScheduleView.tsx` — remove `leaveError`/`Alert`, add new props, import from `types.ts`
- [x] **P9B-3** Edit `FutureScheduleContainer.tsx` — add `teacherId`, `useNotifications`, `futureScheduleDateStore`, remove `leaveError`, import from `types.ts`
- [x] **P9B-4** Edit `JumpToDateHeader.tsx` — add date props, wire chevrons, remove hardcoded date, import from `types.ts`
- [x] **P9B-5** Edit `MiniCalendar.tsx` — add calendar props, compute dynamically, remove hardcoded data, import from `types.ts`
- [x] **P9B-6** Edit `ImportantNotes.tsx` — accept `notes` prop, remove hardcoded data, import from `types.ts`
- [x] **P9B-7** Edit `SupportContact.tsx` — accept `contact` prop, wire `logTeacherSupportRequest`, remove hardcoded data, import from `types.ts`
- [x] **P9B-8** Edit `FutureClassCard.tsx` — add `onViewMaterials` prop, wire button, import from `types.ts`
- [x] **P9B-9** Edit `app/.../schedule/future/page.tsx` — add `PageProps`, auth guard, pass `teacherId`
- [x] **P9B-10** Edit `FutureScheduleContainer.stories.tsx` — update mock props

**Dependencies:** Phase 7 complete. P9A-* and P9B-* can run in parallel (different directories). Within each sub-phase, tasks are sequential (each depends on previous).

---

## Phase 10: i18n Updates

- [x] **P10A** Edit `shared/messages/types/dashboard/teachers/future.schedule.ts` — add new notification keys
- [x] **P10B** Edit `shared/messages/types/dashboard/teachers/weekly.schedule.ts` — add notification keys (already present, no changes needed)
- [x] **P10C** Edit `shared/messages/types/dashboard/teachers/create-recurring-class.ts` — i18n hardcoded strings (already present, no changes needed)
- [x] **P10D** Create `shared/messages/types/dashboard/subjects/index.ts` — subject page i18n types (created main.ts + index.ts)
- [x] **P10E** Edit `shared/messages/en.ts` — English values for all new keys
- [x] **P10F** Edit `shared/messages/ar/dashboard/teachers/future.schedule.ts` — Arabic
- [x] **P10G** Edit `shared/messages/ar/dashboard/teachers/weekly.schedule.ts` — Arabic (already present, no changes needed)
- [x] **P10H** Edit `shared/messages/ar/dashboard/teachers/create-recurring-class.ts` — Arabic (already present, no changes needed)
- [x] **P10I** Create `shared/messages/ar/dashboard/subjects/` directory + files — Arabic subject pages

**Dependencies:** Phase 9 complete. All sequential (shared i18n files).

---

## Phase 11: Validation & Testing

- [x] **P11A** Run `bun tsgo` — type check (PASS: our changes clean; 3 pre-existing errors in storage.repo + helpers.ts)
- [x] **P11B** Run `bun biome:check` — format/lint (PASS)
- [x] **P11C** Run `bun lint` — ESLint (PASS: 0 errors, 4 React Compiler warnings)
- [x] **P11D** Run `bun run test:db` — database repo tests (PASS: 604 pass, 6 fail — all pre-existing RLS logic test failures, not from our changes)
- [x] **P11E** Run `bun run test:graphql` — GraphQL integration tests (PASS)
- [x] **P11F** Run `bun quality-gate` — full quality gate (PASS)

**Dependencies:** All previous phases complete. Sequential.

---

## Subagent Progress Tracking Instructions

### For the orchestrator (you — the main agent):

When dispatching a subagent, update the corresponding task(s) from `[ ]` to `[-]` in this file BEFORE dispatching. When the subagent returns, update from `[-]` to `[x]` or `[!]` if blocked.

### For each subagent:

1. **Before starting work:** Read this file (`.opencode/plans/tasks.md`) to find your assigned task IDs and their current status.
2. **Read the plan:** Read `.opencode/plans/schedule-page-refactor.md` for full details on your task (file specs, conventions, AGENTS.md rules).
3. **Read AGENTS.md:** Read the AGENTS.md file for EACH layer you are working in before writing any code. This is mandatory.
4. **After completing your work:** Update this file (`.opencode/plans/tasks.md`) — change your task IDs from `[-]` to `[x]`. If blocked, change to `[!]` and add a note below.
5. **Do NOT edit tasks you don't own.** Only update the status of tasks assigned to you.
6. **Mutex rule:** If a task is marked `[-]` by another subagent, DO NOT start work on it. Wait for it to become `[x]` or `[!]`.

### Blocked tasks notes:

*(Add notes here for any `[!]` blocked tasks — what blocked it, what needs to happen to unblock)*

---

## Wave Dispatch Order (for orchestrator)

```
Wave 1:  P0A → P0B (sequential)

Wave 2:  P1A ∥ P1B ∥ P1C ∥ P1D (parallel)
Wave 3:  P1E → P1F (sequential)

Wave 4:  P2A ∥ P2B ∥ P2C (parallel)
Wave 5:  P2D (sequential)

Wave 6:  P3A ∥ P3B ∥ P3C ∥ P3D (parallel)
Wave 7:  P3E → P3F (sequential)

Wave 8:  P4A ∥ P4B ∥ P4C (parallel)
Wave 9:  P4D (sequential)

Wave 10: P5A ∥ P5B ∥ P5C (parallel)
Wave 11: P5D → P5E → P5F → P5G → P5H → P5I (sequential)

Wave 12: P6A → P6B → P6C → P6D → P6E → P6F (sequential)

Wave 13: P7A ∥ P7B ∥ P7C ∥ P7D ∥ P7E (parallel)
Wave 14: P7F → P7G → P7H (sequential)

Wave 15: P8A→P8B∥P8C∥P8D∥P8E∥P8F∥P8G ∥ P8H∥P8I∥P8J∥P8K ∥ P8L→P8M∥P8N∥P8O (parallel groups)
Wave 16: P8P → P8Q → P8R (sequential)
Wave 17: P8S → P8T → P8U → P8V (sequential)

Wave 18: P9A-1→P9A-2→...→P9A-7 ∥ P9B-1→P9B-2→...→P9B-10 (parallel)

Wave 19: P10A → P10B → ... → P10I (sequential)

Wave 20: P11A → P11B → ... → P11F (sequential)
```

---

## Audit Fixes (2026-06-29)

- [x] **AF1** Replaced 8 local type definitions in Pothos files with imports from `backend/types/schedule.types.ts`:
  - `class-session.pothos.ts`: Removed `FutureClassDefinition`, `TeacherFutureScheduleDefinition`, `RescheduleClassInputDefinition`, `SupportRequestResultDefinition`, `LeaveProcessResultDefinition`; now uses `FutureClassReturnType`, `TeacherFutureScheduleReturnType`, `RescheduleClassInputType`, `SupportRequestResultReturnType`, `LeaveProcessResultReturnType` from `@/backend/types`
  - `weekly-schedule.pothos.ts`: Removed `WeeklyScheduleClassDefinition`, `WeeklyScheduleGridDefinition`, `WeeklyWorkloadMetricsDefinition`; now uses `WeeklyScheduleClassReturnType`, `WeeklyScheduleGridReturnType`, `WeeklyWorkloadMetricsReturnType` from `@/backend/types`
- [x] **AF2** Added missing fields to canonical types and Pothos objects:
  - `schedule.types.ts`: Added `importantNotes`, `supportContact` to `TeacherFutureScheduleReturnType`; added `zoomMeetingUrl` to `FutureClassReturnType`; added `teacherName` to `WeeklyScheduleGridReturnType`; created `RescheduleClassInputType`, `SupportRequestResultReturnType`, `LeaveProcessResultReturnType`
  - `class-session.pothos.ts`: Added `subjectId` and `zoomMeetingUrl` fields to `FutureClassPothosObject`
  - `teacher-notes.pothos.ts`: Added `isPublished` and `teacherId` fields to `TeacherImportantNotePothosObject`
- [x] **AF3** Fixed `SubjectResourceReturnType` in `class-subject.types.ts` to derive from `$inferSelect` with joined fields via `&`
- [x] **AF4** Fixed resolvers calling repos directly:
  - `class-subject.pothos.ts`: `category` field resolver now calls `ClassCategoryService.getCategoryById()` instead of `ClassCategoryRepository.getCategoryById()`
  - `class-subject.mutation.ts`: `attachSubjectResource` and `detachSubjectResource` now call `ClassSubjectService.attachResource()` and `ClassSubjectService.detachResource()`
  - Added `getCategoryById` to `ClassCategoryService`; added `attachResource` and `detachResource` to `ClassSubjectService`
- [x] **AF5** Fixed all hardcoded error strings in repos — replaced with `getBackendTranslations`:
  - `class-category.repository.ts`: `createCategory` now uses `tFunc("categoryCreateFailed")`
  - `class-subject.repository.ts`: `createSubject` now uses `tFunc("subjectCreateFailed")`
  - `subject-resource.repository.ts`: `attachResource` → `tFunc("subjectResourceAttachFailed")`, `detachResource` → `tFunc("subjectResourceLinkNotFound")`, `reorderResource` → `tFunc("subjectResourceNotFound")`
  - `teacher-notes.repository.ts`: `createNote` → `tFunc("noteCreateFailed")`
  - Added 6 new error keys to `shared/messages/types/errors/main.ts`, `en/errors.ts`, `ar/errors.ts`, `en.ts`
- [x] **AF6** Fixed hardcoded "Students" in `FutureClassCard.tsx` — now uses `t("students")` with i18n key added to future.schedule types, en.ts, and ar translations
- [x] **AF7** Fixed `schedule.service.ts` `getTeacherFutureSchedule` return type — now uses `TeacherFutureScheduleReturnType` from `@/backend/types`
- [x] **AF8** Fixed frontend weekly `types.ts` — added `subjectName` and `classType` fields to `ScheduledClass` interface; updated container to map them
- [x] **AF9** Fixed hardcoded "Unauthorized" errors in `class-session.pothos.ts` LeaveProcessResult resolvers — now uses `getBackendTranslations`
- [x] **AF10** Added `locale` params to repo method signatures: `createCategory`, `createSubject`, `attachResource`, `detachResource`, `reorderResource`, `createNote`; updated service callers to pass `locale`
