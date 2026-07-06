# Meta Plan: Create Implementation Plan for Story 11

## Story 11 — Permissions & Permission Groups (Part 12): Students Directory, Managers, Learning Resources

---

## 1. Goal

Produce the full set of split-file implementation plan documents for **Story 11** (`.ai/siraj_stories/11.md`) inside the sprint directory `.ai/siraj_stories/11/`, strictly following the protocol defined in `AGENTS_STORY_PLANNING.md`.

---

## 2. Key Observations from Codebase Analysis

### 2.1 Permission Key Naming Mismatch (CRITICAL — needs clarification)

Story 11 uses permission keys that **do not match** the existing `AppPermission` enum values in `shared/lib/enum.ts`:

| **Story 11 Key** | **Existing Enum Entry** | **Enum Value** |
|---|---|---|
| `student.view_directory` | `STUDENTS_LIST` | `"students.list"` (plural domain) |
| `student.view_history` | `HISTORY_VIEW_CALENDAR` / `HISTORY_VIEW_DETAILS` | `"history.view_calendar"` / `"history.view_details"` |
| `manager.view_directory` | `STAFF_VIEW_DIRECTORY` | `"staff.view_directory"` |
| `manager.edit_profile` | `STAFF_EDIT_PROFILE` | `"staff.edit_profile"` |
| `resource.view` | `RESOURCES_LIST` | `"resources.list"` |
| `resource.upload` | `RESOURCES_UPLOAD` | `"resources.upload"` |
| `system.restrict_resource_access` | ❌ Does NOT exist | — |

**Decision needed:** Should the plan:
- **(A)** Map story permissions to the **existing** enum values (e.g., treat `student.view_directory` as `STUDENTS_LIST = "students.list"`)?
- **(B)** Create **new** enum entries with the story's exact keys (e.g., `STUDENT_VIEW_DIRECTORY = "student.view_directory"`)?

### 2.2 Frontend Container State (Mock vs Real)

| **Container** | **Current State** | **Action Needed** |
|---|---|---|
| `StudentsContainer.tsx` | Uses `mockStudentsStore` | Migrate to real `useQuery` + RBAC gate |
| `StudentHistoryContainer.tsx` | Already uses `useQuery(studentClassHistoryQueryDocument)` | Add `student.view_history` RBAC gate |
| `ManagersContainer.tsx` | Uses `mockManagersStore` | Migrate to real `useQuery` + RBAC gate |
| `ResourcesContainer.tsx` | Uses `mockResourcesStore` + `mockUserStore` | Migrate to real `useQuery` + RBAC gate |

### 2.3 Existing Backend Infrastructure

- **Schema tables:** `students`, `staff_profiles`, `learning_resources`, `storage_files` — all exist
- **Repositories:** `StudentRepository`, `StudentHistoryRepository`, `StorageDbRepository` — exist with various methods
- **Services:** `StaffProfileService` (teacher profile only), `StudentManagementService`, `StudentLifecycleService` — exist
- **No dedicated `manager` repository** exists — staff_profiles is the closest
- **No dedicated `LearningResourceRepository`** or `ResourceService` exists

---

## 3. Sprint Directory Structure

Create the following directory and files:

```
.ai/siraj_stories/11/
├── section-0-metadata.md
├── section-1-core-principles.md
├── section-2-rbac-permissions.md
├── section-4-security-threats.md
├── section-5-prerequisites.md
├── section-6-tasks/
│   ├── task-a-migration-enum.md
│   ├── task-b-repositories.md
│   ├── task-c-repo-tests.md
│   ├── task-d-services.md
│   ├── task-e-graphql-pothos.md
│   ├── task-f-frontend-documents.md
│   ├── task-g-graphql-tests.md
│   ├── task-h-frontend-stores.md
│   ├── task-i-frontend-views.md
│   └── task-j-i18n.md
├── section-7-final-verification.md
└── appendix.md
```

**Note:** Section 3 (State Machine) is **omitted** — this story has no state transitions.

---

## 4. File Creation Plan (Step-by-Step)

### Step 1: Create Sprint Directory

```bash
mkdir -p .ai/siraj_stories/11/section-6-tasks
```

### Step 2: Write `section-0-metadata.md`

**Content scope (~50 lines):**
- Source story reference: `.ai/siraj_stories/11.md` (Part 12)
- Security baseline: `.ai/siraj_stories/10/` (Story 10 must be fully deployed)
- Story scope: Permission-gated access to Students Directory, Student Class History, Managers Directory, Manager Profile Editing, Learning Resources (view/upload), and a system-level resource access security gate
- Target roles: System Administrator (manager.*), Admin (student.*, resource.*), Teacher (resource.view), System Automated (system.restrict_resource_access)
- Business objectives (3-4 items explaining WHY for each permission group)
- Scope boundaries: IN scope vs OUT of scope

### Step 3: Write `section-1-core-principles.md`

**Content scope (~120 lines):**
- Standard core principles from `AGENTS_STORY_PLANNING.md` Section 1
- Service layer architecture rules (no monoliths, no Drizzle imports in services)
- GraphQL resolver rules (no DB/repo imports)
- Type safety rules (no `any`, no casts)
- Task ordering & dependency integrity rules
- Zero Incomplete Implementation Policy table
- Testing requirements (repo tests, security logic tests, GraphQL integration tests)
- Mock data migration rules
- Logging & observability rules

### Step 4: Write `section-2-rbac-permissions.md`

**Content scope (~180 lines):**
- New permissions table (7 permissions with key, category, group, UI gate, service method, GraphQL operation)
- Permission mapping to existing permissions (relationship table)
- Permission group assignments (System Administrator, Admin, Teacher, System Automated)
- Self-scoping vs any-scoping analysis (e.g., `student.view_directory` is any-scoped for Admin, `resource.view` is shared)
- New AppPermission enum entries (exact code to add)
- Migration SQL changes (exact INSERT statements)
- Verification commands

**⚠️ This section MUST resolve the naming mismatch question from Section 2.1 above.**

### Step 5: Write `section-4-security-threats.md`

**Content scope (~120 lines):**
- **Threat 1: IDOR on student directory** — Users must not see students they're not authorized to view
- **Threat 2: IDOR on manager profile editing** — Only System Administrators can edit other admin profiles; prevent privilege escalation
- **Threat 3: Unauthorized resource upload** — Only Admin can upload; Teachers are read-only
- **Threat 4: Direct URL access to resources** — `system.restrict_resource_access` blocks unauthenticated/unauthorized file downloads
- **Threat 5: Student history cross-access** — Viewing history of students not in viewer's scope
- Each threat includes: Current Gap, Fix approach, Test Requirements

### Step 6: Write `section-5-prerequisites.md`

**Content scope (~100 lines):**
- Security artifact verification table (prior sprint artifacts)
- Database schema verification (students, staff_profiles, learning_resources tables)
- Migration verification (all prior migrations applied)
- Test suite verification (existing tests pass)
- Existing code verification (repo methods, services, permissions)
- Frontend verification (current mock store usage in containers)

### Step 7: Write Task Files in `section-6-tasks/`

#### `task-a-migration-enum.md` (~400 lines)
- **Objective:** Add 7 new permission entries to migration SQL and AppPermission enum
- **Dependencies:** Current project state only
- **Detailed steps:**
  1. Add permission INSERT statements to `3-system_permissions_and_groups.sql`
  2. Add/update permission group assignments (system_administrator, academy_admin, teacher_default, system_automated)
  3. Add AppPermission enum entries in `shared/lib/enum.ts`
  4. Run migration sequence: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`
- **Target files:** migration SQL, enum.ts
- **Quality gates**

#### `task-b-repositories.md` (~500 lines)
- **Objective:** Add/verify repository methods for student directory, manager directory/edit, resource list/upload
- **Dependencies:** Task A (enum values available)
- **Detailed steps:**
  1. Add/verify `StudentRepository.getDirectoryRows()` — paginated student directory with cross-relational data (parent name, teacher name, country, hours/week)
  2. Add/verify `StudentHistoryRepository.getMonthlyCalendar()` — already exists, may need extension
  3. Add `StaffProfileRepository.getDirectoryRows()` — list staff/managers with admin access details
  4. Add `StaffProfileRepository.updateManagerProfile()` — update manager PII (national ID, skype, phones)
  5. Add `LearningResourceRepository.listResources()` — list non-deleted resources with file metadata
  6. Add `LearningResourceRepository.createResource()` — create resource record + file association
- **Target files:** student.repository.ts, student-history.repository.ts, staff-related repo, new learning-resource.repository.ts (or extend existing)

#### `task-c-repo-tests.md` (~500 lines)
- **Objective:** 100% line + function coverage on all new repository methods
- **Dependencies:** Task B
- **Detailed steps:**
  1. Student directory tests (pagination, filtering, cross-relational joins)
  2. Manager directory tests (listing, admin-only visibility)
  3. Manager profile edit tests (valid updates, not-found, IDOR protection)
  4. Resource list tests (soft-delete filtering, pagination)
  5. Resource create tests (valid creation, file association, duplicate handling)
  6. IDOR protection tests for all user-scoped data
- **Target files:** test files in `backend/db/test/repo/`

#### `task-d-services.md` (~500 lines)
- **Objective:** Create domain services with permission gating
- **Dependencies:** Task C (repos tested)
- **Detailed steps:**
  1. `StudentDirectoryService.getStudentDirectory()` — permission-gated on `student.view_directory`
  2. `StudentHistoryService.getClassHistory()` — permission-gated on `student.view_history`
  3. `ManagerDirectoryService.getManagerDirectory()` — permission-gated on `manager.view_directory`
  4. `ManagerProfileService.updateManagerProfile()` — permission-gated on `manager.edit_profile`
  5. `LearningResourceService.listResources()` — permission-gated on `resource.view`
  6. `LearningResourceService.uploadResource()` — permission-gated on `resource.upload`
  7. `ResourceAccessGuardService.checkAccess()` — permission-gated on `system.restrict_resource_access`
- **Target files:** new service files in `backend/services/`

#### `task-e-graphql-pothos.md` (~400 lines)
- **Objective:** Define Pothos GraphQL objects, queries, and mutations
- **Dependencies:** Task D (services implemented)
- **Detailed steps:**
  1. Define `StudentDirectoryRow` Pothos object type
  2. Define `ManagerDirectoryRow` Pothos object type
  3. Define `ManagerProfileUpdateInput` Pothos input type
  4. Define `LearningResource` Pothos object type (if not already defined)
  5. Define `ResourceUploadInput` Pothos input type
  6. Wire query resolvers: `studentDirectory`, `managerDirectory`, `learningResources`
  7. Wire mutation resolvers: `updateManagerProfile`, `uploadLearningResource`
  8. Register modules in index.ts
  9. Run `bun run generate:gqlSchema` + `bun codegen`
- **Target files:** pothos files in `backend/graphql/pothos/`

#### `task-f-frontend-documents.md` (~350 lines)
- **Objective:** Create Apollo TypedDocumentNode query and mutation documents
- **Dependencies:** Task E (GraphQL schema generated)
- **Detailed steps:**
  1. Create `studentDirectoryQueryDocument`
  2. Create `managerDirectoryQueryDocument`
  3. Create `updateManagerProfileMutationDocument`
  4. Create `learningResourcesQueryDocument`
  5. Create `uploadLearningResourceMutationDocument`
  6. Export from index files
  7. Run codegen
- **Target files:** document files in `frontend/graphql/sharedDocuments/`

#### `task-g-graphql-tests.md` (~350 lines)
- **Objective:** GraphQL integration tests for all new operations
- **Dependencies:** Task F (documents created)
- **Detailed steps:**
  1. Test `studentDirectory` query — authorized (Admin) + unauthorized (Teacher/Parent)
  2. Test `managerDirectory` query — authorized (System Admin) + unauthorized (Teacher/Parent)
  3. Test `updateManagerProfile` mutation — authorized (System Admin) + unauthorized (Admin)
  4. Test `learningResources` query — authorized (Teacher/Admin) + unauthorized (Parent/Student)
  5. Test `uploadLearningResource` mutation — authorized (Admin) + unauthorized (Teacher)
  6. Security threat coverage from Section 4
- **Target files:** test files in `frontend/graphql/test/`

#### `task-h-frontend-stores.md` (~350 lines)
- **Objective:** Create real Zustand stores replacing mock stores
- **Dependencies:** Task F (documents available)
- **Detailed steps:**
  1. Create `studentsDirectoryStore` — uses `useQuery(studentDirectoryQueryDocument)` with generated types
  2. Create `managersDirectoryStore` — uses `useQuery(managerDirectoryQueryDocument)` with generated types
  3. Create `resourcesStore` — uses `useQuery(learningResourcesQueryDocument)` with generated types
- **Target files:** new store files in `frontend/stores/`

#### `task-i-frontend-views.md` (~600 lines)
- **Objective:** Migrate containers from mock stores to real data + RBAC gates
- **Dependencies:** Task H (stores created)
- **Detailed steps:**
  1. Migrate `StudentsContainer.tsx` — replace `mockStudentsStore` with `useQuery` + `studentsDirectoryStore`, add `<RequirePermission permissions={["students.list"]}>` (or resolved key)
  2. Add RBAC gate to `StudentHistoryContainer.tsx` — add `<RequirePermission permissions={["history.view_calendar"]}>` (or resolved key)
  3. Migrate `ManagersContainer.tsx` — replace `mockManagersStore` with `useQuery` + `managersDirectoryStore`, add `<RequirePermission>` gate
  4. Migrate `ResourcesContainer.tsx` — replace `mockResourcesStore` with `useQuery` + `resourcesStore`, add `<RequirePermission>` gate, replace upload dialog with `useMutation`
  5. Replace any `globalThis.confirm()` with MUI Dialog
  6. Ensure no `any` or blind casts
- **Target files:** container files in `frontend/views/dashboard/`

#### `task-j-i18n.md` (~200 lines)
- **Objective:** Add translation keys for new UI strings
- **Dependencies:** Task I (views implemented, strings identified)
- **Detailed steps:**
  1. Create type definitions for new translation keys
  2. Add English translations to `shared/messages/en.ts`
  3. Add Arabic translations to `shared/messages/ar/` directory
  4. Update index files
- **Target files:** translation files in `shared/messages/`

### Step 8: Write `section-7-final-verification.md`

**Content scope (~60 lines):**
- Schema & type generation commands
- Quality gate loop (tsgo, biome, lint, codescene)
- Test suites (test:db, test:graphql, test:ui:components, test)
- Repository coverage verification
- Prohibited pattern check (TODO, FIXME)
- Mock data leak check
- Permission enforcement verification

### Step 9: Write `appendix.md`

**Content scope (~150 lines):**
- File creation summary table (every file created/modified with task letter)
- Files NOT changed (explicitly out of scope)
- Task dependency graph (Mermaid)
- Permission catalog summary
- GraphQL schema additions summary
- Repository method summary
- Service architecture summary
- Security threats coverage map
- Data flow diagram

---

## 5. Creation Order

| **Order** | **File** | **Depends On** |
|---|---|---|
| 1 | Sprint directory creation | — |
| 2 | `section-0-metadata.md` | — |
| 3 | `section-1-core-principles.md` | — |
| 4 | `section-2-rbac-permissions.md` | Permission naming decision |
| 5 | `section-4-security-threats.md` | Section 2 |
| 6 | `section-5-prerequisites.md` | Codebase analysis |
| 7 | `task-a-migration-enum.md` | Section 2 |
| 8 | `task-b-repositories.md` | Task A |
| 9 | `task-c-repo-tests.md` | Task B |
| 10 | `task-d-services.md` | Task C |
| 11 | `task-e-graphql-pothos.md` | Task D |
| 12 | `task-f-frontend-documents.md` | Task E |
| 13 | `task-g-graphql-tests.md` | Task F |
| 14 | `task-h-frontend-stores.md` | Task F |
| 15 | `task-i-frontend-views.md` | Task H |
| 16 | `task-j-i18n.md` | Task I |
| 17 | `section-7-final-verification.md` | All tasks |
| 18 | `appendix.md` | All tasks |

---

## 6. Size Targets (Minimum)

| **File** | **Minimum Lines** |
|---|---|
| section-0-metadata.md | 50 |
| section-1-core-principles.md | 120 |
| section-2-rbac-permissions.md | 180 |
| section-4-security-threats.md | 120 |
| section-5-prerequisites.md | 100 |
| task-a-migration-enum.md | 400 |
| task-b-repositories.md | 500 |
| task-c-repo-tests.md | 500 |
| task-d-services.md | 500 |
| task-e-graphql-pothos.md | 400 |
| task-f-frontend-documents.md | 350 |
| task-g-graphql-tests.md | 350 |
| task-h-frontend-stores.md | 350 |
| task-i-frontend-views.md | 600 |
| task-j-i18n.md | 200 |
| section-7-final-verification.md | 60 |
| appendix.md | 150 |
| **TOTAL** | **~4,930** |

---

## 7. Questions to Clarify Before Implementation

1. **Permission key naming** (CRITICAL): Should the plan use the story's exact permission keys (e.g., `student.view_directory`) or map them to existing enum values (e.g., `students.list`)? See Section 2.1 above.
2. **Manager vs Staff domain**: The story uses `manager.*` permissions, but the codebase uses `staff.*`. Should we create new `manager.*` permissions or reuse existing `staff.*`?
3. **Resource upload**: Does the story expect a full file upload workflow (multipart form, storage service integration) or just the database record creation with an existing file path?
4. **`system.restrict_resource_access`**: This is described as a system-level security gate. Should this be implemented as a middleware/interceptor on file download routes, or as a service-layer check?

---

## 8. Output Summary

After completing all files, the final directory tree will be:

```
.ai/siraj_stories/11/
├── section-0-metadata.md                     # Story Metadata & Context
├── section-1-core-principles.md              # Core Principles & Strict Rules
├── section-2-rbac-permissions.md             # RBAC Permissions (Canonical)
├── section-4-security-threats.md             # Security Threat Remediation
├── section-5-prerequisites.md                # Prerequisites Verification
├── section-6-tasks/
│   ├── task-a-migration-enum.md              # Migration & Enum
│   ├── task-b-repositories.md                # Repository Methods
│   ├── task-c-repo-tests.md                  # Repository Tests
│   ├── task-d-services.md                    # Domain Services
│   ├── task-e-graphql-pothos.md              # GraphQL Pothos & Resolvers
│   ├── task-f-frontend-documents.md          # Frontend Apollo Documents
│   ├── task-g-graphql-tests.md               # GraphQL Integration Tests
│   ├── task-h-frontend-stores.md             # Frontend Zustand Stores
│   ├── task-i-frontend-views.md              # Frontend Views & RBAC
│   └── task-j-i18n.md                        # i18n Translation Keys
├── section-7-final-verification.md           # Final Verification Protocol
└── appendix.md                               # Appendices
```

**Total: 16 markdown files** (10 task files + 6 section/appendix files)
