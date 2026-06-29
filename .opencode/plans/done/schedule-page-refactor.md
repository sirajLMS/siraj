# Schedule Page Refactor — Execution Plan (Parallel-Safe)

**Route:** `app/[locale]/(dashboard)/teachers/[id]/schedule`
**Date:** 2026-06-29
**Status:** Ready for execution

> **Task Tracker:** `.opencode/plans/tasks.md` — Track progress there. Subagents MUST update task status in that file.
> **This file:** Full architectural plan with file specs, conventions, and dependency graph.
> **Tasks file:** Checkbox-style progress tracker with `[ ]`/`[-]`/`[x]`/`[!]` status per task.

---

## Subagent Instructions

Each subagent MUST:
1. Read **this plan file** (`.opencode/plans/schedule-page-refactor.md`) for full file specs and conventions BEFORE writing code.
2. Read the **task tracker** (`.opencode/plans/tasks.md`) to find assigned task IDs and current status.
3. Read **AGENTS.md** for EACH layer being worked in (see per-layer rules below).
4. After completing work, update task status in `.opencode/plans/tasks.md` from `[-]` to `[x]`. If blocked, change to `[!]` and add a note in the "Blocked tasks notes" section.
5. Do NOT edit task status for tasks not assigned to you.
6. If a task is marked `[-]` by another subagent, DO NOT start work on it — wait for `[x]` or `[!]`.

---

## User Decisions

| Decision | Choice |
|----------|--------|
| View Materials button | Build full class categories + subjects + resources system; navigate to `/subjects/[id]` |
| ImportantNotes storage | New `teacher_important_notes` table |
| Coordinator mapping | No faculty — system-level admin contact from `system_settings` + `logTeacherSupportRequest` audit |
| Contact Admin button | Log support audit via `logTeacherSupportRequest` mutation |
| Class subjects model | Dynamic categories + subjects + subject_resources tables. `subject_id` FK on `recurring_schedules` and `class_instances` |
| Subject management route | `/subjects` (top-level sidebar) |
| Materials viewing page | `/subjects/[id]` (subject detail page) |
| FutureClass.subjectName | Add `subjectName` to FutureClass GraphQL type |
| Date navigation | Prop pattern with `futureScheduleDateStore` Zustand store |
| Notifications | `useNotifications` throughout, replacing all inline `Alert` patterns |

---

## Dependency Graph

```
P0 (shared/enum) ──────────────────────────────────────────┐
P1A (schema: categories+subjects) ──┐                     │
P1B (schema: teacher-notes) ─────────┤                     │
P1C (schema: scheduling edits) ──────┤                     │
                                      ├─► P2 (types) ──► P3 (repos) ──► P4 (services) ──► P5 (pothos) ──► P6 (codegen) ──┐
                                      │                                                                    ├──► P7 (frontend docs+stores)
P1D (migration SQL) ─────────────────┘                                                                    │
P1E (i18n type defs) ─────────────────────────────────────────────────────────────────────────────────────►│
                                                                                                           ├──► P8 (subjects pages)
                                                                                                           ├──► P9 (schedule refactors)
                                                                                                           └──► PA (validation)
```

**Key insight:** `P1A`/`P1B`/`P1C` are independent schema files (no cross-deps), but `P1C` edits `scheduling.ts` which `P1A`/`P1B` don't touch — so they can run in parallel. However, `P1D` (migration SQL) depends on all three schema files being finalized. Types depend on schemas. Repos depend on types. Services depend on repos + types. Pothos depends on services + types. Codegen depends on all Pothos. Frontend depends on codegen. Pages depend on frontend docs/stores.

---

## Phase 0: Shared Prerequisites (SEQUENTIAL — must complete before any parallel work)

### Task 0A: Add new permissions to AppPermission enum

**Files:** 1 edit
**Blocks:** All subsequent phases (permissions must exist before services/pothos reference them)

| File | Action | Details |
|------|--------|---------|
| `shared/lib/enum.ts` | **EDIT** | Add 13 new `AppPermission` entries: `SUBJECTS_LIST`, `SUBJECTS_CREATE`, `SUBJECTS_UPDATE`, `SUBJECTS_DELETE`, `CATEGORIES_LIST`, `CATEGORIES_CREATE`, `CATEGORIES_UPDATE`, `CATEGORIES_DELETE`, `SUBJECTS_VIEW_RESOURCES`, `NOTES_LIST`, `NOTES_CREATE`, `NOTES_UPDATE`, `NOTES_DELETE` |

### Task 0B: Read all layer AGENTS.md files

**Action:** Each subagent must read the AGENTS.md for its layer before starting work. Document which AGENTS.md files exist per layer.

---

## Phase 1: Database Schema (PARALLEL — 3 independent subagents + 1 sequential)

These tasks create NEW files only — no shared file edits, so they can run in parallel.

### Subagent 1A: Class Categories + Class Subjects + Subject Resources Schema

**Creates:** 3 new files, 0 edits
**Blocks:** Nothing (independent new tables)

| File | Action | Details |
|------|--------|---------|
| `backend/db/schema/class-category.ts` | **NEW** | `class_categories` table: `id` (uuid PK), `name` (varchar 200, not null), `slug` (varchar 100, not null, unique), `description` (text), `isActive` (boolean, default true), `sortOrder` (integer, default 0), `createdAt`, `updatedAt`, `deletedAt`. Index on `slug`. |
| `backend/db/schema/class-subject.ts` | **NEW** | `class_subjects` table: `id` (uuid PK), `categoryId` (uuid FK -> class_categories.id, onDelete restrict), `name` (varchar 200, not null), `slug` (varchar 100, not null, unique), `description` (text), `isActive` (boolean, default true), `sortOrder` (integer, default 0), `createdAt`, `updatedAt`, `deletedAt`. Index on `categoryId`, unique index on `slug`. |
| `backend/db/schema/subject-resource.ts` | **NEW** | `subject_resources` junction table: `id` (uuid PK), `subjectId` (uuid FK -> class_subjects.id, onDelete cascade), `learningResourceId` (uuid FK -> learning_resources.id, onDelete cascade), `resourceType` (varchar 50), `sortOrder` (integer, default 0), `createdAt`. Unique index on `(subjectId, learningResourceId)`. |

### Subagent 1B: Teacher Notes Schema

**Creates:** 1 new file, 0 edits
**Blocks:** Nothing (independent new table)

| File | Action | Details |
|------|--------|---------|
| `backend/db/schema/teacher-notes.ts` | **NEW** | `teacher_important_notes` table: `id` (uuid PK), `teacherId` (uuid FK -> teachers.id, nullable), `title` (varchar 300, not null), `body` (text), `isPublished` (boolean, default false), `priority` (integer, default 0), `startsAt` (timestamp, nullable), `expiresAt` (timestamp, nullable), `createdByUserId` (uuid FK -> users.id), `createdAt`, `updatedAt`, `deletedAt`. Index on `teacherId`. |

### Subagent 1C: Scheduling Schema Edits (SEQUENTIAL — after 1A, edits shared file)

**Creates:** 0 new files, 1 edit
**Depends on:** 1A (needs `class_subjects` table to exist for FK reference)
**⚠️ MUTEX:** Edits `backend/db/schema/scheduling.ts` — no other subagent can edit this file concurrently

| File | Action | Details |
|------|--------|---------|
| `backend/db/schema/scheduling.ts` | **EDIT** | Add `subjectId` (uuid, nullable FK -> class_subjects.id) column to `recurringSchedules` table with index. Add `subjectId` (uuid, nullable FK -> class_subjects.id) column to `classInstances` table with index. |

### Subagent 1D: Schema Index Registration (SEQUENTIAL — after 1A, 1B)

**Creates:** 0 new files, 1 edit
**Depends on:** 1A, 1B (all new schema files must exist)
**⚠️ MUTEX:** Edits `backend/db/schema/index.ts` — no other subagent can edit this file concurrently

| File | Action | Details |
|------|--------|---------|
| `backend/db/schema/index.ts` | **EDIT** | Add `export * from "./class-category"`, `export * from "./class-subject"`, `export * from "./subject-resource"`, `export * from "./teacher-notes"`. |

---

## Phase 2: Type Definitions (PARALLEL — 3 independent subagents)

**Depends on:** Phase 1 (all schemas must exist)
**Note:** Each type file only imports from `@/backend/db/schema/<own-file>` and `@/shared/lib/enum`, so no cross-deps between type files.

### Subagent 2A: Class Category Types

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/types/class-category.types.ts` | **NEW** | `ClassCategorySelectType` (Drizzle infer), `ClassCategoryInsertType`, `ClassCategoryReturnType` (id, name, slug, description, isActive, sortOrder), `ClassCategorySubmitInput` (name, slug, description?, isActive?, sortOrder?), `ClassCategoryUpdateInput` (name?, slug?, description?, isActive?, sortOrder?). |

### Subagent 2B: Class Subject Types

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/types/class-subject.types.ts` | **NEW** | `ClassSubjectSelectType` (Drizzle infer), `ClassSubjectInsertType`, `ClassSubjectReturnType`, `ClassSubjectSubmitInput`, `ClassSubjectUpdateInput`, `SubjectResourceReturnType`, `SubjectResourceAttachInput`. |

### Subagent 2C: Teacher Notes + Support Contact Types

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/types/teacher-notes.types.ts` | **NEW** | `TeacherImportantNoteSelectType`, `TeacherImportantNoteInsertType`, `TeacherImportantNoteReturnType`, `TeacherImportantNoteSubmitInput`, `TeacherImportantNoteUpdateInput`, `SupportContactReturnType`. |

### Subagent 2D: Schedule Types Update (SEQUENTIAL — after 2B, edits shared file)

**Creates:** 0 new files, 1 edit (or new file)
**Depends on:** 2B (subject types must exist)
**⚠️ MUTEX:** Check if `backend/types/schedule.types.ts` exists; if so, edit it. If not, create it.

| File | Action | Details |
|------|--------|---------|
| `backend/types/schedule.types.ts` | **NEW or EDIT** | Add `subjectId?: string \| null` and `subjectName?: string \| null` to future-schedule and weekly-schedule related return types. |

---

## Phase 3: Repositories (PARALLEL — 4 independent subagents)

**Depends on:** Phase 2 (types must exist)

### Subagent 3A: Class Category Repository

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/db/repo/class-category.repository.ts` | **NEW** | `ClassCategoryRepository` namespace: `listCategories(tx?)`, `getCategoryById(id, tx?)`, `createCategory(input, tx?)`, `updateCategory(id, input, tx?)`, `deleteCategory(id, tx?)`. |

### Subagent 3B: Class Subject Repository

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/db/repo/class-subject.repository.ts` | **NEW** | `ClassSubjectRepository` namespace: `listSubjects(categoryId?, tx?)`, `getSubjectById(id, tx?)`, `getSubjectBySlug(slug, tx?)`, `createSubject(input, tx?)`, `updateSubject(id, input, tx?)`, `deleteSubject(id, tx?)`. |

### Subagent 3C: Subject Resource Repository

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/db/repo/subject-resource.repository.ts` | **NEW** | `SubjectResourceRepository` namespace: `listResourcesForSubject(subjectId, tx?)`, `attachResource(input, tx?)`, `detachResource(subjectId, learningResourceId, tx?)`, `reorderResource(id, sortOrder, tx?)`. Joins `learning_resources` for `displayName`, `filePath`. |

### Subagent 3D: Teacher Notes Repository

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/db/repo/teacher-notes.repository.ts` | **NEW** | `TeacherNotesRepository` namespace: `getActiveNotes(teacherId?, tx?)` — published, non-expired, order by priority DESC. `createNote`, `updateNote`, `deleteNote`, `listAllNotes`. |

### Subagent 3E: Repo Index + Scheduling Query Update (SEQUENTIAL — after 3A-3D)

**Depends on:** 3A, 3B, 3C, 3D
**⚠️ MUTEX:** Edits `backend/db/repo/index.ts` and `backend/db/repo/scheduling/scheduling-queries.repository.ts`

| File | Action | Details |
|------|--------|---------|
| `backend/db/repo/index.ts` | **EDIT** | Export new repositories. |
| `backend/db/repo/scheduling/scheduling-queries.repository.ts` | **EDIT** | Add `classType`, `subjectId` to `FutureClassRow` type and query SELECT. Join `recurring_schedules` for `subject_id`. |

---

## Phase 4: Services (PARALLEL — 3 independent subagents)

**Depends on:** Phase 3 (repos must exist)

### Subagent 4A: Class Category Service

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/services/subject/class-category.service.ts` | **NEW** | `ClassCategoryService` namespace: `listCategories(userId, locale)`, `createCategory(userId, input, locale)`, `updateCategory(userId, id, input, locale)`, `deleteCategory(userId, id, locale)`. Permission checks using `CATEGORIES_*`. i18n errors via `getBackendTranslations`. |

### Subagent 4B: Class Subject Service

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/services/subject/class-subject.service.ts` | **NEW** | `ClassSubjectService` namespace: `listSubjects(userId, categoryId?, locale)`, `getSubjectById(userId, id, locale)`, `createSubject`, `updateSubject`, `deleteSubject`, `getSubjectResources`. Permission checks using `SUBJECTS_*`, `SUBJECTS_VIEW_RESOURCES`. |

### Subagent 4C: Teacher Notes Service

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/services/subject/teacher-notes.service.ts` | **NEW** | `TeacherNotesService` namespace: `getActiveNotes(userId, teacherId?, locale)`, `createNote(userId, input, locale)`, `updateNote(userId, id, input, locale)`, `deleteNote(userId, id, locale)`. Permission checks using `NOTES_*`. |

### Subagent 4D: Schedule Service Update (SEQUENTIAL — after 4A, 4B, 4C)

**Depends on:** 4B, 4C (needs ClassSubjectService + TeacherNotesService)
**⚠️ MUTEX:** Edits `backend/services/schedule/schedule.service.ts` — no concurrent edits

| File | Action | Details |
|------|--------|---------|
| `backend/services/schedule/schedule.service.ts` | **EDIT** | In `getTeacherFutureSchedule`: (a) fetch notes via `TeacherNotesService.getActiveNotes`, (b) fetch support contact from `SystemSettingsRepository.getStringValue("teacher_support_contact_staff_profile_id")` joined with staff profiles, (c) add `subjectName` + `classType` to FutureClass by joining `recurring_schedules.subject_id` -> `class_subjects.name`. Fix `courseName` to use subject name instead of `cls.studentName`. Fix `location` to use zoom URL. Fix `studentCount` to be real. In `getTeacherWeeklyScheduleGrid`: add `subjectName` to class mapping. |

---

## Phase 5: Pothos GraphQL Layer (PARTIAL PARALLEL — 3 new files parallel, then 1 sequential)

**Depends on:** Phase 4 (services must exist)

### Subagent 5A: Class Category Pothos (parallel)

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/graphql/pothos/class-category.pothos.ts` | **NEW** | `ClassCategoryPothosObject` (id, name, slug, description, isActive, sortOrder), `ClassCategoryCreateInputPothos`, `ClassCategoryUpdateInputPothos`. |

### Subagent 5B: Class Subject Pothos (parallel)

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/graphql/pothos/class-subject.pothos.ts` | **NEW** | `ClassSubjectPothosObject` (id, name, slug, description, isActive, sortOrder, category, resources), `ClassSubjectCreateInputPothos`, `ClassSubjectUpdateInputPothos`, `AttachSubjectResourceInputPothos`. |

### Subagent 5C: Teacher Notes Pothos (parallel)

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `backend/graphql/pothos/teacher-notes.pothos.ts` | **NEW** | `TeacherImportantNotePothosObject` (id, title, body, priority, startsAt, expiresAt), `SupportContactPothosObject` (id, name, role, avatarUrl, phone, skypeId), `CreateTeacherNoteInputPothos`, `UpdateTeacherNoteInputPothos`. |

### Subagent 5D: Query Resolvers — New (SEQUENTIAL — after 5A, 5B, 5C)

**Creates:** 1 new file, 0 edits
**Depends on:** 5A, 5B (Pothos objects must exist to reference in queries)

| File | Action | Details |
|------|--------|---------|
| `backend/graphql/query/class-category.query.ts` | **NEW** | `classCategories` query -> `ClassCategoryService.listCategories`. `classSubjects(categoryId)` query -> `ClassSubjectService.listSubjects`. `classSubject(id)` query -> `ClassSubjectService.getSubjectById`. |

### Subagent 5E: Mutation Resolvers — New (SEQUENTIAL — after 5A, 5B, 5C)

**Creates:** 2 new files, 0 edits
**Depends on:** 5A, 5B, 5C (Pothos input objects must exist)

| File | Action | Details |
|------|--------|---------|
| `backend/graphql/mutation/class-category.mutation.ts` | **NEW** | `createClassCategory`, `updateClassCategory`, `deleteClassCategory` mutations. |
| `backend/graphql/mutation/class-subject.mutation.ts` | **NEW** | `createClassSubject`, `updateClassSubject`, `deleteClassSubject`, `attachSubjectResource`, `detachSubjectResource` mutations. |
| `backend/graphql/mutation/teacher-notes.mutation.ts` | **NEW** | `createTeacherImportantNote`, `updateTeacherImportantNote`, `deleteTeacherImportantNote` mutations. |

### Subagent 5F: Existing Pothos + Query Edits (SEQUENTIAL — after 5B, 5C)

**⚠️ MUTEX:** Edits `class-session.pothos.ts` and `class-session.query.ts` — no concurrent edits on these files
**Depends on:** 5B, 5C (Pothos objects must be importable)

| File | Action | Details |
|------|--------|---------|
| `backend/graphql/pothos/class-session.pothos.ts` | **EDIT** | Add `importantNotes` + `supportContact` to `TeacherFutureSchedulePothosObject`. Add `subjectName` + `classType` to `FutureClassPothosObject`. Add `subjectName` to `WeeklyScheduleClassPothosObject`. |
| `backend/graphql/query/class-session.query.ts` | **EDIT** | Update `teacherFutureSchedule` resolver to pass `teacherId` to service and return notes + contact data. |

---

## Phase 6: Codegen + SQL Migration (SEQUENTIAL — must be single-threaded)

**Depends on:** Phase 5 (all Pothos definitions must be complete)

### Task 6A: Generate GraphQL Schema

```bash
bun run generate:gqlSchema
```

### Task 6B: Generate TypeScript Types

```bash
bun codegen
```

### Task 6C: SQL Migration Files

**⚠️ MUTEX:** Creates migration files, must be sequential with 6A/6B

| File | Action | Details |
|------|--------|---------|
| `backend/db/migration/4-class_categories_and_subjects.sql` | **NEW** | CREATE TABLE for all 4 new tables. ALTER TABLE for `subject_id` on `recurring_schedules` and `class_instances`. ALTER TYPE `app_permission` ADD VALUE for 13 new permissions. INSERT INTO `permissions` for all 13 keys. INSERT INTO `group_permissions` for admin group. INSERT default categories (Quran, Arabic Language, Islamic Studies) and subjects. |
| `backend/db/migration/4b-teacher_support_contact_setting.sql` | **NEW** | INSERT INTO `system_settings` for `teacher_support_contact_staff_profile_id`. |

### Task 6D: Drizzle Migration Generation

```bash
~/.bun/bin/bun run db generate
~/.bun/bin/bun run db migrate
```

---

## Phase 7: Frontend Documents & Stores (PARALLEL — 5 independent subagents)

**Depends on:** Phase 6 (codegen must complete — generated types must exist)

### Subagent 7A: Class Category GraphQL Documents (parallel)

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `frontend/graphql/sharedDocuments/class-category.documents.ts` | **NEW** | `classCategoriesQueryDocument`, `createClassCategoryMutationDocument`, `updateClassCategoryMutationDocument`, `deleteClassCategoryMutationDocument`. Follow `TypedDocumentNode<Operations.XxxQuery, Types.QueryXxxArgs>` pattern. |

### Subagent 7B: Class Subject GraphQL Documents (parallel)

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `frontend/graphql/sharedDocuments/class-subject.documents.ts` | **NEW** | `classSubjectsQueryDocument`, `classSubjectByIdQueryDocument`, `createClassSubjectMutationDocument`, `updateClassSubjectMutationDocument`, `deleteClassSubjectMutationDocument`, `attachSubjectResourceMutationDocument`, `detachSubjectResourceMutationDocument`. |

### Subagent 7C: Teacher Notes GraphQL Documents (parallel)

**Creates:** 1 new file, 0 edits

| File | Action | Details |
|------|--------|---------|
| `frontend/graphql/sharedDocuments/teacher-notes.documents.ts` | **NEW** | `createTeacherImportantNoteMutationDocument`, `updateTeacherImportantNoteMutationDocument`, `deleteTeacherImportantNoteMutationDocument`. |

### Subagent 7D: Zustand Stores (parallel)

**Creates:** 2 new files, 0 edits

| File | Action | Details |
|------|--------|---------|
| `frontend/stores/subjectManagementStore.ts` | **NEW** | `isCreateDialogOpen`, `openCreateDialog()`, `closeCreateDialog()`, `isEditDialogOpen`, `selectedId`, `openEditDialog(id)`, `closeEditDialog()`, `isDeleteDialogOpen`, `pendingDeleteId`, `openDeleteDialog(id)`, `closeDeleteDialog()`. Mirror `permissionManagementStore` pattern. |
| `frontend/stores/futureScheduleDateStore.ts` | **NEW** | `selectedDate` (ISO string), `setSelectedDate(date)`, `viewingMonth` (Date), `setViewingMonth(date)`. Mirror `weeklyScheduleStore` pattern. |

### Subagent 7E: Existing Document Edits + Index (SEQUENTIAL — after 7A, 7B, 7C)

**⚠️ MUTEX:** Edits multiple shared files — must be sequential
**Depends on:** 7A, 7B, 7C (new document files must exist before updating index)

| File | Action | Details |
|------|--------|---------|
| `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` | **EDIT** | Update `teacherFutureScheduleQueryDocument` to include `importantNotes`, `supportContact`, `subjectName`, `classType`. Add `teacherId` arg. |
| `frontend/graphql/sharedDocuments/weekly-schedule.documents.ts` | **EDIT** | Add `subjectName` and `classType` to classes selection. |
| `frontend/graphql/sharedDocuments/index.ts` | **EDIT** | Add re-exports for new document files. |

---

## Phase 8: Frontend — Subject Management Pages (PARALLEL — 3 independent subagents)

**Depends on:** Phase 7 (frontend docs + stores must exist)

### Subagent 8A: Subject Management — Home Page

**Creates:** 7 new files, 0 edits (all new, no shared files)

| File | Action | Details |
|------|--------|---------|
| `frontend/views/dashboard/subjects/home/types.ts` | **NEW** | All prop interfaces: `SubjectsViewProps`, `SubjectCardProps`, `SubjectItem`, `CategoriesSectionProps`, `CreateSubjectDialogProps`, `EditSubjectDialogProps`, `DeleteSubjectDialogProps`, `CreateCategoryDialogProps`, `EditCategoryDialogProps`, `DeleteCategoryDialogProps`, `SubjectsContainerProps`. |
| `frontend/views/dashboard/subjects/home/SubjectsView.tsx` | **NEW** | Responsive view with `PageContainer` + `PageHeader` + category tabs + subject grid. |
| `frontend/views/dashboard/subjects/home/components/SubjectCard.tsx` | **NEW** | Subject card with name, slug, category, resource count, edit/delete. |
| `frontend/views/dashboard/subjects/home/components/CreateSubjectDialog.tsx` | **NEW** | Form dialog with name, slug (auto), category select, description, isActive. |
| `frontend/views/dashboard/subjects/home/components/EditSubjectDialog.tsx` | **NEW** | Pre-populated edit form. |
| `frontend/views/dashboard/subjects/home/components/DeleteSubjectDialog.tsx` | **NEW** | Confirmation dialog. |
| `frontend/views/dashboard/subjects/home/SubjectsContainer.stories.tsx` | **NEW** | Storybook story. |

### Subagent 8B: Subject Management — Category Section

**Creates:** 4 new files, 0 edits (all new, no shared files)

| File | Action | Details |
|------|--------|---------|
| `frontend/views/dashboard/subjects/home/components/CategoriesSection.tsx` | **NEW** | Category list with inline add/edit/delete. |
| `frontend/views/dashboard/subjects/home/components/CreateCategoryDialog.tsx` | **NEW** | Form: name, slug, description, isActive. |
| `frontend/views/dashboard/subjects/home/components/EditCategoryDialog.tsx` | **NEW** | Pre-populated edit form. |
| `frontend/views/dashboard/subjects/home/components/DeleteCategoryDialog.tsx` | **NEW** | Confirmation dialog. |

### Subagent 8C: Subject Detail Page (Materials Viewer)

**Creates:** 4 new files, 0 edits (all new, no shared files)

| File | Action | Details |
|------|--------|---------|
| `frontend/views/dashboard/subjects/detail/types.ts` | **NEW** | `SubjectDetailViewProps`, `SubjectDetailContainerProps`, `SubjectResourceItem`. |
| `frontend/views/dashboard/subjects/detail/SubjectDetailView.tsx` | **NEW** | Subject name, category, description, resource list with download links. `PageContainer` + `PageHeader`, breadcrumbs: Subjects > [Name]. |
| `frontend/views/dashboard/subjects/detail/SubjectDetailContainer.tsx` | **NEW** | Apollo `useQuery(classSubjectByIdQueryDocument)`. Permission: `AppPermission.SubjectsViewResources`. |
| `frontend/views/dashboard/subjects/detail/SubjectDetailContainer.stories.tsx` | **NEW** | Storybook story. |

### Subagent 8D: App Router Pages + Container (SEQUENTIAL — after 8A)

**Depends on:** 8A (SubjectsContainer must exist)
**⚠️ MUTEX:** Creates page files, edits navigation config

| File | Action | Details |
|------|--------|---------|
| `app/[locale]/(dashboard)/subjects/page.tsx` | **NEW** | Server Component with auth guard, renders `<SubjectsContainer />`. |
| `app/[locale]/(dashboard)/subjects/[id]/page.tsx` | **NEW** | Server Component, renders `<SubjectDetailContainer subjectId={id} />`. |
| `frontend/views/dashboard/subjects/home/SubjectsContainer.tsx` | **NEW** | Container: Apollo queries + mutations, `useNotifications`, `RequirePermission`. Wires store dialogs. Passes data to `SubjectsView`. |

### Subagent 8E: Sidebar + Navigation (SEQUENTIAL — after Phase 0)

**⚠️ MUTEX:** Edits `navigationConfig.ts`, i18n nav keys — no concurrent edits
**Depends on:** Phase 0 (permissions must exist)

| File | Action | Details |
|------|--------|---------|
| `frontend/views/dashboard/config/navigationConfig.ts` | **EDIT** | Add `subjects` nav item: key `"subjects"`, href `/subjects`, icon, permission `AppPermission.SubjectsList`, section `"main"`. Position after "resources". Add to `BOTTOM_NAV_ITEMS` as well. |
| `shared/messages/types/dashboard/core/nav.ts` | **EDIT** | Add `readonly subjects: string;` to `DashboardNavigationLabels`. |
| `shared/messages/en.ts` | **EDIT** | Add English nav label. |
| `shared/messages/ar/dashboard/core/nav.ts` | **EDIT** | Add Arabic nav label. |

---

## Phase 9: Schedule Route Refactors (PARALLEL — 2 independent subagents)

**Depends on:** Phase 7 (frontend docs must exist for updated GraphQL queries)
**Note:** These two subagents touch completely different directories — `schedule/weekly/` vs `futureSchedule/`

### Subagent 9A: Weekly Schedule Refactor

**Files in scope:** All files under `frontend/views/dashboard/teachers/schedule/weekly/` + `app/.../schedule/weekly/page.tsx`

| File | Action | Details |
|------|--------|---------|
| `frontend/views/dashboard/teachers/schedule/weekly/types.ts` | **NEW** | Move all in-file types: `ScheduledClass` (with `ClassExecutionState`/`ClassOutcome` enums), `TeacherWeeklySchedule`, all `*Props` interfaces. |
| `frontend/views/dashboard/teachers/schedule/weekly/WeeklyScheduleGrid.tsx` | **EDIT** | Remove in-file type exports. Import from `types.ts`. |
| `frontend/views/dashboard/teachers/schedule/weekly/MobileScheduleList.tsx` | **EDIT** | Change `ScheduledClass` import from `WeeklyScheduleGrid` to `types.ts`. Remove in-file prop types, import from `types.ts`. |
| `frontend/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleView.tsx` | **EDIT** | Remove in-file types, import from `types.ts`. Remove `ScheduledClass` import from `WeeklyScheduleGrid`. |
| `frontend/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer.tsx` | **EDIT** | Add `useNotifications` for success/error on `handleRemoveClass` + `handleClearSchedule`. Fix `lastUpdated` to use `schedule.weekEnd`. Remove in-file container props, import from `types.ts`. Update mapping to use enum values for `executionState`/`outcome`. |
| `frontend/views/dashboard/teachers/schedule/weekly/components/CreateRecurringClassDialog.tsx` | **EDIT** | Type `classType` as `ClassType` enum. Use `CLASS_TYPE_OPTIONS` + `TIMEZONE_OPTIONS`. Replace `Alert` with `notifications.show()`. Remove `errorMsg`/`successMsg` state. i18n hardcoded strings. Remove in-file props, import from `types.ts`. |
| `app/[locale]/(dashboard)/teachers/[id]/schedule/weekly/page.tsx` | **EDIT** | Add auth guard via `getServerUserContext()`. Add `setRequestLocale(locale)`. |

### Subagent 9B: Future Schedule Refactor

**Files in scope:** All files under `frontend/views/dashboard/teachers/futureSchedule/` + `app/.../schedule/future/page.tsx`

| File | Action | Details |
|------|--------|---------|
| `frontend/views/dashboard/teachers/futureSchedule/types.ts` | **NEW** | Move all in-file types: `FutureScheduleViewProps`, `JumpToDateHeaderProps`, `FutureClassCardProps`, `MiniCalendarDate`, `ImportantNoteItem`, `ImportantNotesProps`, `SupportContactData`, `SupportContactProps`. |
| `frontend/views/dashboard/teachers/futureSchedule/FutureScheduleView.tsx` | **EDIT** | Remove `leaveError`/`onDismissError` props + `Alert` block. Add `selectedDate`/`onDateChange`/`notes`/`contact`/`onViewMaterials` props. Pass to children. Import from `types.ts`. |
| `frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer.tsx` | **EDIT** | Accept `teacherId` prop, pass to query. Add `useNotifications`, remove `leaveError` state. Replace `Alert` with notifications. Use `futureScheduleDateStore` for date state. Pass notes + contact from query data. Import from `types.ts`. |
| `frontend/views/dashboard/teachers/futureSchedule/components/JumpToDateHeader.tsx` | **EDIT** | Add `selectedDate`/`onDateChange` props. Wire chevron buttons. Render dynamic date. Remove hardcoded "October 24, 2023". Import from `types.ts`. |
| `frontend/views/dashboard/teachers/futureSchedule/components/MiniCalendar.tsx` | **EDIT** | Add `viewingMonth`/`onPrevMonth`/`onNextMonth`/`classDates`/`selectedDate`/`onSelectDate` props. Compute grid dynamically. Remove hardcoded Oct 2023. Import from `types.ts`. |
| `frontend/views/dashboard/teachers/futureSchedule/components/ImportantNotes.tsx` | **EDIT** | Accept `notes` prop, remove hardcoded data. Import from `types.ts`. |
| `frontend/views/dashboard/teachers/futureSchedule/components/SupportContact.tsx` | **EDIT** | Accept `contact` prop, remove hardcoded "Sarah Jenkins". Wire "Contact Admin" to `logTeacherSupportRequest` mutation + notifications. Import from `types.ts`. |
| `frontend/views/dashboard/teachers/futureSchedule/components/FutureClassCard.tsx` | **EDIT** | Add `onViewMaterials` prop. Wire "View Materials" button to navigate `/subjects/[subjectId]` or show info notification. Import from `types.ts`. |
| `app/[locale]/(dashboard)/teachers/[id]/schedule/future/page.tsx` | **EDIT** | Add `PageProps`, extract `{ id, locale }`. Add auth guard via `getServerUserContext()`. Pass `teacherId={id}` to `FutureScheduleContainer`. Add `setRequestLocale(locale)`. |
| `frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer.stories.tsx` | **EDIT** | Update mock to match new prop shape. |

---

## Phase 10: i18n Updates (PARALLEL with Phase 8/9 — but file-aware)

**⚠️ CONFLICT RULES:** i18n files are shared. Only ONE subagent edits any given i18n file at a time.
**Strategy:** Batch all i18n edits into a single subagent that runs after Phase 8 and Phase 9 are structurally complete.

### Subagent 10A: All i18n Updates (SEQUENTIAL — after Phases 8 & 9)

| File | Action | Keys to Add/Update |
|------|--------|-------------------|
| `shared/messages/types/dashboard/teachers/future.schedule.ts` | **EDIT** | `noSubjectAssigned`, `supportRequestSent`, `leaveRequested` (under `notifications`). Rename/keep `viewMaterials`. |
| `shared/messages/types/dashboard/teachers/weekly.schedule.ts` | **EDIT** | `classDeleted`, `classDeleteFailed`, `scheduleCleared`, `scheduleClearFailed` (under `notifications`). |
| `shared/messages/types/dashboard/teachers/create-recurring-class.ts` | **EDIT** | i18n duration error, class type labels, timezone labels. |
| `shared/messages/types/dashboard/subjects/index.ts` | **NEW** | All subject page i18n type definitions. |
| `shared/messages/types/dashboard/core/nav.ts` | **EDIT** | `subjects` label (if not already done by 8E). |
| `shared/messages/en.ts` | **EDIT** | English values for all new keys. |
| `shared/messages/ar/dashboard/teachers/future.schedule.ts` | **EDIT** | Arabic values. |
| `shared/messages/ar/dashboard/teachers/weekly.schedule.ts` | **EDIT** | Arabic values. |
| `shared/messages/ar/dashboard/teachers/create-recurring-class.ts` | **EDIT** | Arabic values. |
| `shared/messages/ar/dashboard/subjects/` | **NEW** | Arabic subject page translations. |

---

## Phase 11: Validation & Testing (SEQUENTIAL)

**Depends on:** All previous phases complete

### Task 11A: Type Check

```bash
bun tsgo
```

### Task 11B: Format + Lint

```bash
bun biome:check
```

### Task 11C: ESLint

```bash
bun lint
```

### Task 11D: Database Tests (for new repos)

```bash
bun run test:db
```

### Task 11E: GraphQL Integration Tests

```bash
bun run test:graphql
```

### Task 11F: Full Quality Gate

```bash
bun quality-gate
```

---

## Parallelization Summary

| Phase | Tasks | Parallelizable? | Max Subagents |
|-------|-------|-----------------|---------------|
| 0 | Permission enum + AGENTS reads | No (shared file) | 1 |
| 1 | Schema files | **Yes** (1A ∥ 1B), then 1C sequential, then 1D | 2 → 1 → 1 |
| 2 | Type definitions | **Yes** (2A ∥ 2B ∥ 2C), then 2D | 3 → 1 |
| 3 | Repositories | **Yes** (3A ∥ 3B ∥ 3C ∥ 3D), then 3E | 4 → 1 |
| 4 | Services | **Yes** (4A ∥ 4B ∥ 4C), then 4D | 3 → 1 |
| 5 | Pothos | **Yes** (5A ∥ 5B ∥ 5C), then 5D → 5E → 5F | 3 → 1 → 1 → 1 |
| 6 | Codegen + Migration | No (sequential by nature) | 1 |
| 7 | Frontend docs + stores | **Yes** (7A ∥ 7B ∥ 7C ∥ 7D), then 7E | 4 → 1 |
| 8 | Subject pages | **Yes** (8A ∥ 8B ∥ 8C), then 8D → 8E | 3 → 1 → 1 |
| 9 | Schedule refactors | **Yes** (9A ∥ 9B) | 2 |
| 10 | i18n | No (shared files) | 1 |
| 11 | Validation | No (sequential checks) | 1 |

### Recommended Subagent Dispatch Order

```
Wave 1:  P0 (sequential)

Wave 2:  P1A ∥ P1B (parallel new schema files)
Wave 3:  P1C → P1D (sequential edits to shared files)

Wave 4:  P2A ∥ P2B ∥ P2C (parallel type files)
Wave 5:  P2D (sequential edit)

Wave 6:  P3A ∥ P3B ∥ P3C ∥ P3D (parallel repo files)
Wave 7:  P3E (sequential edit)

Wave 8:  P4A ∥ P4B ∥ P4C (parallel service files)
Wave 9:  P4D (sequential edit)

Wave 10: P5A ∥ P5B ∥ P5C (parallel pothos files)
Wave 11: P5D → P5E → P5F (sequential: queries, mutations, existing file edits)

Wave 12: P6 (sequential: codegen + migration)

Wave 13: P7A ∥ P7B ∥ P7C ∥ P7D (parallel frontend docs + stores)
Wave 14: P7E (sequential: edit existing docs + index)

Wave 15: P8A ∥ P8B ∥ P8C (parallel subject page components)
Wave 16: P8D → P8E (sequential: container + sidebar/nav)

Wave 17: P9A ∥ P9B (parallel schedule route refactors — different directories)

Wave 18: P10 (sequential: all i18n)

Wave 19: P11 (sequential: validation)
```

### 🚫 Mutex Files (never edit concurrently)

| File | Phase(s) that edit it | Strategy |
|------|----------------------|----------|
| `shared/lib/enum.ts` | P0 only | Single edit at start |
| `backend/db/schema/scheduling.ts` | P1C only | Isolated to one sequential task |
| `backend/db/schema/index.ts` | P1D only | Isolated to one sequential task |
| `backend/db/repo/index.ts` | P3E only | Isolated to one sequential task |
| `backend/db/repo/scheduling/scheduling-queries.repository.ts` | P3E only | Isolated to one sequential task |
| `backend/services/schedule/schedule.service.ts` | P4D only | Isolated to one sequential task |
| `backend/graphql/pothos/class-session.pothos.ts` | P5F only | Isolated to one sequential task |
| `backend/graphql/query/class-session.query.ts` | P5F only | Isolated to one sequential task |
| `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` | P7E only | Isolated to one sequential task |
| `frontend/graphql/sharedDocuments/weekly-schedule.documents.ts` | P7E only | Isolated to one sequential task |
| `frontend/graphql/sharedDocuments/index.ts` | P7E only | Isolated to one sequential task |
| `frontend/views/dashboard/config/navigationConfig.ts` | P8E only | Isolated to one sequential task |
| All i18n files | P10 only | Batched into single subagent |

---

## File Count Summary

| Category | New Files | Edited Files | Total |
|----------|-----------|-------------|-------|
| DB Schema | 4 | 2 | 6 |
| SQL Migrations | 2 | 0 | 2 |
| Types | 3 | 1 | 4 |
| Repositories | 4 | 2 | 6 |
| Services | 3 | 1 | 4 |
| Pothos GraphQL | 3 | 1 | 4 |
| Query/Mutation Resolvers | 3 | 1 | 4 |
| Frontend Documents | 3 | 3 | 6 |
| Frontend Stores | 2 | 0 | 2 |
| Frontend Types (schedule) | 2 | 0 | 2 |
| Frontend Types (subjects) | 2 | 0 | 2 |
| Frontend Views (subjects) | 14 | 0 | 14 |
| Frontend Views (schedule refactor) | 0 | 13 | 13 |
| App Router Pages | 3 | 2 | 5 |
| Navigation/Sidebar | 0 | 2 | 2 |
| i18n | 2 | 8 | 10 |
| Permissions | 0 | 1 | 1 |
| Stories | 2 | 1 | 3 |
| **Total** | **52** | **36** | **88** |

---

## Task Progress Tracker

> **See:** `.opencode/plans/tasks.md` — Checkbox-style task tracker with `[ ]` not implemented / `[-]` in progress / `[x]` done / `[!]` blocked status for every task. Subagents update this file to track progress.
