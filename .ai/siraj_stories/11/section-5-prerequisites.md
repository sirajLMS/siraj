## Section 5: Prerequisites Verification (BLOCKING)

### 5.0 Security Artifact Verification (Extending Prior Sprint Work)

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Student status trigger | `backend/db/migration/student_status_transition_trigger.sql` | psql query | Function exists ✅ |
| System permissions trigger | `backend/db/migration/3-system_permissions_and_groups.sql` (trg_protect_system_permissions) | psql query | Trigger active ✅ |
| Story 10 services | `backend/services/student/suspended-lock.service.ts` | File exists | Exists ✅ |
| Story 10 services | `backend/services/student/student-leave-processing.service.ts` | File exists | Exists ✅ |
| Permissions RLS | `backend/db/migration/permissions_rls_policies.sql` | psql query | Policies applied ✅ |

**If any artifact is missing or failing, the corresponding security task is BLOCKING before story work begins.**

---

### 5.1 Database Schema Verification

- [ ] Verify `students` table exists with columns: `id`, `parent_id`, `primary_teacher_id`, `name`, `status`, `classes_total`, `classes_remaining`, `hours_per_week`, `created_at`, `updated_at`. ✅ (verified — backend/db/schema/students.ts:47–89)
- [ ] Verify `staff_profiles` table exists with columns: `id`, `user_id`, `phone`, `skype_id`, `status`, `created_at`, `updated_at`. ✅ (verified — backend/db/schema/staff.ts:5–19)
- [ ] Verify `learning_resources` table exists with columns: `id`, `display_name`, `file_path`, `uploaded_by_user_id`, `created_at`, `deleted_at`. ✅ (verified — backend/db/schema/communications.ts:167–181)
- [ ] Verify `storage_files` table exists with columns: `id`, `path`, `is_protected`. ✅ (verified — backend/db/schema/storage.ts:11–15)
- [ ] Verify `learning_resource_files` junction table exists with columns: `id`, `file_id`, `learning_resource_id`, `usage_type`, `created_at`. ✅ (verified — backend/db/schema/storage.ts:131–148)
- [ ] Verify `permissions` table exists with columns: `id`, `key`, `resource`, `action`, `description`, `category`, `is_system`. ✅ (verified — backend/db/schema/permissions.ts:11–23)
- [ ] Verify `permission_groups` table exists with columns: `id`, `name`, `description`, `is_system`, `slug`, `created_by_user_id`. ✅ (verified — backend/db/schema/permissions.ts:25–34)
- [ ] Verify `group_permissions` junction table exists. ✅ (verified — backend/db/schema/permissions.ts:36–50)
- [ ] Verify `users` table exists with `id`, `name`, `email` columns. ✅ (verified — backend/db/schema/users.ts)

---

### 5.2 Migration Verification

- [ ] Run `bun run scripts/dbActions.ts push` to ensure all migrations are applied.
- [ ] Verify `backend/db/migration/3-system_permissions_and_groups.sql` is applied (existing permissions seeded). ✅ (verified)
- [ ] Verify the `protect_system_permissions` trigger is active on `permissions` and `permission_groups` tables. ✅ (verified)
- [ ] Verify existing permissions are present: `students.list`, `staff.view_directory`, `staff.edit_profile`, `resources.list`, `resources.upload`. ✅ (verified — migration file lines 347–463, 573–634)
- [ ] Verify `system_automated` group exists in migration. ✅ (verified — migration file lines 847–855)

---

### 5.3 Test Suite Verification

- [ ] Run `bun run test:db` — all existing database tests pass (0 failures).
- [ ] Run `bun run test:graphql` — all existing GraphQL integration tests pass (0 failures).
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.

---

### 5.4 Existing Code Verification

- [ ] Verify `StudentRepository.fetchWithFilters()` exists and works. ✅ (verified — backend/db/repo/student.repository.ts:14–50)
- [ ] Verify `StudentHistoryRepository.getMonthlyCalendar()` exists and works. ✅ (verified — backend/db/repo/student-history.repository.ts:21–50)
- [ ] Verify `StudentHistoryRepository.getMonthlyMetrics()` exists and works. ✅ (verified — backend/db/repo/student-history.repository.ts)
- [ ] Verify `SoftDeleteRepository.softDeleteLearningResource()` exists. ✅ (verified — backend/db/repo/soft-delete.repository.ts:157–158)
- [ ] Verify `PermissionsService.hasPermission()` and `PermissionsService.hasAnyPermission()` exist. ✅ (verified — backend/services/auth/permissions.service.ts)
- [ ] Verify `getBackendTranslations()` helper is available. ✅ (verified — backend/lib/intl.ts)
- [ ] Verify `StorageService` is available via `getStorageService()`. ✅ (verified — backend/storage/storage.service.ts:54)
- [ ] Verify `StorageService.uploadFile()` method exists. ✅ (verified — backend/storage/disk/storage.service.interface.ts:25)
- [ ] Verify `StorageDbRepository.createFile()` exists. ✅ (verified — backend/db/repo/storage.repository.ts:43)
- [ ] Verify no `LearningResourceRepository` exists yet. ❌ (not verified — does NOT exist, needs creation)
- [ ] Verify no `staff-profile.repository.ts` exists yet. ❌ (not verified — does NOT exist, needs creation)
- [ ] Verify no resource service directory exists. ❌ (not verified — `backend/services/resource/` does NOT exist, needs creation)

---

### 5.5 Frontend Verification

- [ ] Verify `StudentsContainer` currently imports from `mockStudentsStore`. ✅ (verified — frontend/views/dashboard/students/home/StudentsContainer.tsx:6–7)
- [ ] Verify `ManagersContainer` currently imports from `mockManagersStore`. ✅ (verified — frontend/views/dashboard/managers/home/ManagersContainer.tsx:4)
- [ ] Verify `ResourcesContainer` currently imports from `mockResourcesStore` and `mockUserStore`. ✅ (verified — frontend/views/dashboard/resources/ResourcesContainer.tsx:6–7)
- [ ] Verify `StudentHistoryContainer` already uses `useQuery`. ✅ (verified — frontend/views/dashboard/students/history/StudentHistoryContainer.tsx:3,24)
- [ ] Verify `ResourcesContainer` has inline permission check via `useUserStore`. ✅ (verified — checks `AppPermission.ResourcesList` and `AppPermission.ResourcesDelete`)
- [ ] Verify `StudentsContainer` has NO inline permission check. ✅ (verified — relies on navigation gate only)
- [ ] Verify `ManagersContainer` has NO inline permission check. ✅ (verified — relies on navigation gate only)
- [ ] Verify i18n keys exist for `dashboard.studentDirectory`, `dashboard.managersDirectory`, `dashboard.resources` namespaces. ✅ (verified — shared/messages/en.ts)
- [ ] Verify Next.js route pages exist for `/students`, `/managers`, `/resources`. ✅ (verified — app/[locale]/(dashboard)/students/page.tsx, managers/page.tsx, resources/page.tsx)
- [ ] Verify existing frontend documents: `student.documents.ts` (studentsQueryDocument, studentByIdQueryDocument). ✅ (verified — frontend/graphql/sharedDocuments/student.documents.ts)
- [ ] Verify existing frontend documents: `student-history.documents.ts` (studentClassHistoryQueryDocument). ✅ (verified — frontend/graphql/sharedDocuments/student-history.documents.ts)
- [ ] Verify NO existing frontend documents for managers directory or learning resources. ❌ (not verified — does NOT exist, needs creation)
