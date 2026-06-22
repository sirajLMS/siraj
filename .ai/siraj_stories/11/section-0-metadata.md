## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/11.md` (Part 12 - Permissions & Permission Groups, timestamps 00:00 - 02:00)
- **Security baseline:** `.ai/siraj_stories/10/` (mandatory prerequisite — Automated Student Status Enforcement sprint must be fully deployed)
- **Story scope:** Implements permission-gated access to three core academy modules: the Global Student Directory, the Managers Directory (with profile editing), and the Learning Resources Repository (view/upload). Maps story-level permission concepts to existing codebase permission keys, adds one new system-level permission (`system.restrict_resource_access`), adjusts permission group assignments for `academy_admin` and `system_automated`, builds full-stack backend infrastructure (repositories, services, GraphQL) for the three domains, and migrates three frontend containers from mock Zustand stores to real Apollo `useQuery` hooks with RBAC enforcement.
- **Target roles:** System Administrator (manager directory + profile editing), Academy Admin (student directory + resource management), Teacher (resource viewing), System Automated (resource access restriction).
- **Status:** Planning phase — awaiting approval for execution.

---

### 0.1 Business Objectives

1. **Global Student Auditing (`student.view_directory` → `students.list`):** Academy Admins gain access to the Master Student Directory — a flattened, cross-relational data table exposing all active and inactive students with parent names, teacher names, countries, and hours-per-week metrics. This is distinct from `student.view_associated` (Story 9) which only allows viewing students through a parent's profile. The directory permission provides an academy-wide operational view, enabling admins to find any student without knowing their family first.

2. **Administrative Staff Management (`manager.view_directory` → `staff.view_directory`, `manager.edit_profile` → `staff.edit_profile`):** System Administrators can view the Managers List — a directory of all staff members with administrative backend access, exposing contact details, Skype IDs, and privilege types. The edit permission allows modification of fellow administrative users' profiles (National ID, Skype, Phones). This is highly sensitive — modifying other Admins' profiles could enable privilege escalation, so it is strictly reserved for System Administrators.

3. **Learning Resources Repository (`resource.view` → `resources.list`, `resource.upload` → `resources.upload`):** Establishes a strict one-way distribution channel for academy curriculum materials. Teachers can consume (view/download) official syllabus materials via `resources.list`. Only Academy Admins can dictate what those official materials are via `resources.upload`. This separation ensures content governance — teachers cannot upload unauthorized materials.

4. **System-Level Resource Access Security (`system.restrict_resource_access`):** A system-internal security gate that enforces strict isolation of the learning resources storage directory. Automatically evaluates any request attempting to access resource files — if the user lacks `resources.list` permission (e.g., a Student or Parent attempting to bypass the curriculum), the system blocks the request and prevents the download. This operates at the service/storage layer, not the UI.

5. **Mock-to-Real Data Migration:** Three frontend containers (`StudentsContainer`, `ManagersContainer`, `ResourcesContainer`) currently import from mock Zustand stores with hardcoded dummy data. This sprint replaces them with real Apollo `useQuery` hooks backed by GraphQL queries, real generated `TypedDocumentNode` types, and proper RBAC enforcement via `<RequirePermission>` wrappers.

---

### 0.2 Scope Boundaries

**In scope:**
- New permission seed in `backend/db/migration/3-system_permissions_and_groups.sql` for `system.restrict_resource_access`
- New `AppPermission` enum entry: `SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access"` in `shared/lib/enum.ts`
- Permission group assignment adjustments: `academy_admin` gains `students.list` and `resources.upload`; `system_automated` gains `system.restrict_resource_access`
- New repository: `LearningResourceRepository` in `backend/db/repo/learning-resource.repository.ts` (list + create methods)
- Extended repository: `StaffProfileRepository` methods for manager directory listing and profile editing in `backend/db/repo/staff-profile.repository.ts` (NEW file)
- Extended repository: `StudentRepository.getDirectoryRows()` for enriched student directory query
- New service: `StudentDirectoryService` in `backend/services/student/student-directory.service.ts`
- New service: `ManagerDirectoryService` in `backend/services/staff/manager-directory.service.ts`
- New service: `ManagerProfileService` in `backend/services/staff/manager-profile.service.ts`
- New service: `LearningResourceService` in `backend/services/resource/learning-resource.service.ts`
- New Pothos objects and query/mutation fields for student directory, manager directory, manager profile, and learning resources
- New frontend `TypedDocumentNode` query and mutation documents
- GraphQL integration tests for all new operations
- New Zustand stores replacing mock stores for students directory, managers directory, and resources
- Migration of `StudentsContainer.tsx`, `ManagersContainer.tsx`, `ResourcesContainer.tsx` to real `useQuery` + RBAC gates
- i18n keys for any new UI strings
- Repository tests for all new repository methods
- Navigation config permission gate updates

**Out of scope:**
- New database tables or schema columns (all tables already exist: `students`, `staff_profiles`, `learning_resources`, `storage_files`, `learning_resource_files`)
- Modifying existing DB triggers (student status transition trigger, protect_system_permissions trigger)
- `student.view_associated` permission (Story 9 — already implemented)
- `student.manage_status` permission (Story 9 — already implemented)
- `system.enforce_suspended_lock` and `system.process_student_leave` (Story 10 — already implemented)
- `StudentHistoryContainer` migration (already uses real `useQuery(studentClassHistoryQueryDocument)`)
- Manager onboarding flow (separate story — `ManagerOnboardingContainer` uses `mockManagerOnboardingStore`)
- Teacher reassignment flow (already implemented)
- Automated email/push notifications on resource upload
- File storage adapter changes (existing `StorageService` handles disk/cloud)
- New Next.js App Router page files (routes for `/students`, `/managers`, `/resources` already exist)
- Storybook story file modifications (mock stores remain for `*.stories.tsx` files)