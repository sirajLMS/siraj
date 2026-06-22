## Appendix: Story 11 — File Creation Summary, Dependency Graph & Task Overview

---

### A-1. New Files Created

| **File Path** | **Task** | **Type** | **Description** |
|---|---|---|---|
| `backend/db/repo/staff-profile.repository.ts` | B | NEW | Manager directory listing + profile editing repository |
| `backend/db/repo/learning-resource.repository.ts` | B | NEW | Learning resource CRUD repository |
| `backend/db/test/repo/student-directory.test.ts` | C | NEW | Tests for `StudentRepository.getDirectoryRows()` |
| `backend/db/test/repo/staff-profile.test.ts` | C | NEW | Tests for all `StaffProfileRepository` methods |
| `backend/db/test/repo/learning-resource.test.ts` | C | NEW | Tests for all `LearningResourceRepository` methods |
| `backend/services/student/student-directory.service.ts` | D | NEW | Student directory query with `students.list` permission gate |
| `backend/services/staff/manager-directory.service.ts` | D | NEW | Manager directory with `staff.view_directory` permission gate |
| `backend/services/staff/manager-profile.service.ts` | D | NEW | Manager profile update with hierarchical privilege checks |
| `backend/services/resource/learning-resource.service.ts` | D | NEW | Learning resource CRUD with `resources.list`/`resources.upload` gates |
| `backend/graphql/pothos/student-directory.pothos.ts` | E | NEW | Student directory Pothos object type + query field |
| `backend/graphql/pothos/learning-resource.pothos.ts` | E | NEW | Learning resource Pothos types + query/mutation fields |
| `frontend/graphql/sharedDocuments/student-directory.documents.ts` | F | NEW | Student directory TypedDocumentNode query |
| `frontend/graphql/sharedDocuments/learning-resource.documents.ts` | F | NEW | Learning resource query + upload mutation documents |
| `frontend/views/dashboard/students/home/types.ts` | G | NEW | Extracted shared types for student directory (re-exports generated + UI-specific types) |
| `frontend/views/dashboard/managers/home/types.ts` | G | NEW | Extracted shared types for managers directory (re-exports generated + UI-specific types) |
| `frontend/views/dashboard/resources/types.ts` | G | NEW | Extracted shared types for resources (re-exports generated + UI-specific types) |
| `frontend/graphql/test/student-directory-graphql.test.ts` | H | NEW | GraphQL tests for `studentDirectory` query |
| `frontend/graphql/test/manager-directory-graphql.test.ts` | H | NEW | GraphQL tests for `managerDirectory` query + mutation |
| `frontend/graphql/test/learning-resource-graphql.test.ts` | H | NEW | GraphQL tests for `learningResources` query + upload |
| `frontend/stores/studentDirectoryStore.ts` | K | NEW | UI state store for student directory (search query) |
| `frontend/stores/managersDirectoryStore.ts` | K | NEW | UI state store for managers directory (role/status filters) |
| `frontend/stores/learningResourcesStore.ts` | K | NEW | UI state store for resources (search, filter, sort, dialogs) |

**Total: 22 new files**

---

### A-2. Modified Files

| **File Path** | **Task** | **Changes** |
|---|---|---|
| `backend/db/migration/3-system_permissions_and_groups.sql` | A | Add `system.restrict_resource_access` permission row + update `academy_admin` and `system_automated` group assignments |
| `shared/lib/enum.ts` | A | Add `SYSTEM_RESTRICT_RESOURCE_ACCESS` enum entry |
| `backend/db/repo/student.repository.ts` | B | Add `getDirectoryRows()` method |
| `backend/db/repo/index.ts` | B | Export new `staff-profile.repository` and `learning-resource.repository` |
| `backend/graphql/pothos/staff-directory.pothos.ts` | E | Add `ManagerDirectoryRow` type + `managerDirectory` query field |
| `backend/graphql/pothos/index.ts` | E | Export new `student-directory.pothos` and `learning-resource.pothos` |
| `frontend/graphql/sharedDocuments/staff-directory.documents.ts` | F | Add `managerDirectoryQueryDocument` |
| `frontend/graphql/sharedDocuments/index.ts` | F | Export new document files |
| `frontend/stores/mockStudentsStore.ts` | G | Remove type definitions, re-import from `students/home/types.ts` |
| `frontend/stores/mockManagersStore.ts` | G | Remove type definitions, re-import from `managers/home/types.ts` |
| `frontend/stores/mockResourcesStore.ts` | G | Remove type definitions, re-import from `resources/types.ts` |
| `frontend/views/dashboard/students/home/StudentsContainer.stories.tsx` | I | Replace mock store with `MockedProvider` + mock GraphQL responses |
| `frontend/views/dashboard/managers/home/ManagersContainer.stories.tsx` | I | Replace mock store with `MockedProvider` + mock GraphQL responses |
| `frontend/views/dashboard/resources/ResourcesContainer.stories.tsx` | I | Replace mock store with `MockedProvider` + mock query/mutation responses |
| `frontend/views/dashboard/students/home/StudentsContainer.tsx` | L | Replace `mockStudentsStore` with `useQuery` + RBAC gate |
| `frontend/views/dashboard/managers/home/ManagersContainer.tsx` | L | Replace `mockManagersStore` with `useQuery` + RBAC gate |
| `frontend/views/dashboard/resources/ResourcesContainer.tsx` | L | Replace `mockResourcesStore` with `useQuery` + `useMutation` + RBAC gate |
| `shared/messages/en.ts` | J | Add missing backend error translation keys (if needed) |
| `shared/messages/ar/errors.ts` | J | Add Arabic backend error translations (if needed) |

**Total: 16 modified files**

---

### A-3. Files NOT Changed (Explicitly Out of Scope)

| **File Path** | **Reason Not Changed** |
|---|---|
| `backend/db/schema/students.ts` | All columns already exist — no schema changes needed |
| `backend/db/schema/staff.ts` | `staff_profiles` table already has all needed columns |
| `backend/db/schema/communications.ts` | `learning_resources` table already has all needed columns |
| `backend/db/schema/storage.ts` | `storage_files` and `learning_resource_files` tables already exist |
| `backend/db/migration/student_status_transition_trigger.sql` | No state machine changes in Story 11 |
| `frontend/stores/mockStudentsStore.ts` | **Modified in Task G** — types extracted, mock data kept for Storybook |
| `frontend/stores/mockManagersStore.ts` | **Modified in Task G** — types extracted, mock data kept for Storybook |
| `frontend/stores/mockResourcesStore.ts` | **Modified in Task G** — types extracted, mock data kept for Storybook |
| `frontend/views/dashboard/students/home/StudentsContainer.stories.tsx` | **Modified in Task I** — migrated to `MockedProvider` pattern |
| `frontend/views/dashboard/managers/home/ManagersContainer.stories.tsx` | **Modified in Task I** — migrated to `MockedProvider` pattern |
| `frontend/views/dashboard/resources/ResourcesContainer.stories.tsx` | **Modified in Task I** — migrated to `MockedProvider` pattern |
| `frontend/views/dashboard/students/history/StudentHistoryContainer.tsx` | Already uses real `useQuery` — no migration needed |
| `frontend/views/dashboard/config/navigationConfig.ts` | Navigation permission gates already correct |
| `app/[locale]/(dashboard)/students/page.tsx` | Route page already exists |
| `app/[locale]/(dashboard)/managers/page.tsx` | Route page already exists |
| `app/[locale]/(dashboard)/resources/page.tsx` | Route page already exists |

---

### A-4. Task Dependency Graph

```
Task A (Migration & Enum)
  └──► Task B (Repositories)
         └──► Task C (Repo Tests)
                └──► Task D (Services)
                       └──► Task E (GraphQL Pothos + Resolvers)
                              └──► Task F (Frontend Apollo Documents)
                                     └──► Task G (Type Extraction)
                                            ├──► Task H (GraphQL Tests)
                                            └──► Task I (Storybook Migration)
                                                   └──► Task J (i18n)
                                                   └──► Task K (Frontend Stores)
                                                          └──► Task L (Frontend Views)
                                                                 └──► Section 7 (Final Verification)
```

Tasks H and I are both dependent on G but are independent of each other — they MAY be run in parallel. Task I (Storybook Migration) prepares the story infrastructure (`MockedProvider` decorators) before containers are migrated. Task J (i18n) can run after stories are prepared. Task K (Frontend Stores) depends on G for types. Task L (Frontend Views) depends on K for stores and I for story readiness.

---

### A-5. Permission Catalog Summary

| **Permission Key** | **Enum Value** | **Category** | **Is New** | **Assigned Groups** |
|---|---|---|---|---|
| `students.list` | `STUDENTS_LIST` | Students | No (existing) | Super Admin, Staff Default, **Academy Admin** (NEW assignment) |
| `history.view_calendar` | `HISTORY_VIEW_CALENDAR` | History | No (existing) | (unchanged) |
| `staff.view_directory` | `STAFF_VIEW_DIRECTORY` | Staff | No (existing) | Super Admin, Academy Admin (unchanged) |
| `staff.edit_profile` | `STAFF_EDIT_PROFILE` | Staff | No (existing) | Super Admin, Academy Admin (unchanged) |
| `resources.list` | `RESOURCES_LIST` | Resources | No (existing) | Super Admin, Teacher Default (unchanged) |
| `resources.upload` | `RESOURCES_UPLOAD` | Resources | No (existing) | Super Admin, **Academy Admin** (NEW assignment) |
| `system.restrict_resource_access` | `SYSTEM_RESTRICT_RESOURCE_ACCESS` | System | **YES** | System Automated (NEW) |

---

### A-6. GraphQL Schema Additions Summary

**New Queries (3):**

| **Query Name** | **Input Args** | **Return Type** | **Permission Required** |
|---|---|---|---|
| `studentDirectory` | `paginationArgs`, `filterArgs`, `orderBy` | `[StudentDirectoryRow]` | `students.list` |
| `managerDirectory` | None | `[ManagerDirectoryRow]` | `staff.view_directory` |
| `learningResources` | `searchQuery: String?` | `[LearningResourceRow]` | `resources.list` |

**New Mutations (1):**

| **Mutation Name** | **Input Args** | **Return Type** | **Permission Required** |
|---|---|---|---|
| `uploadLearningResource` | `input: ResourceUploadInput!` | `LearningResourceRow` | `resources.upload` |

**New Object Types (3):**

| **Type Name** | **Fields** |
|---|---|
| `StudentDirectoryRow` | `id`, `name`, `email`, `status`, `classesRemaining`, `classesTotal`, `hoursPerWeek`, `parentName`, `teacherName`, `createdAt` |
| `ManagerDirectoryRow` | `id`, `staffProfileId`, `name`, `email`, `phone`, `skypeId`, `status`, `roleSlug`, `roleName` |
| `LearningResourceRow` | `id`, `displayName`, `filePath`, `uploadedByUserId`, `uploadedByUserName`, `fileSize`, `contentType`, `createdAt` |

**New Input Types (1):**

| **Type Name** | **Fields** |
|---|---|
| `ResourceUploadInput` | `displayName: String!`, `filePath: String!`, `fileId: ID!` |

---

### A-7. Repository Method Summary

| **Method** | **Repository** | **Signature** | **Purpose** | **Used By** |
|---|---|---|---|---|
| `getDirectoryRows` | `StudentRepository` | `(paginationArgs, filters?, orderBy?, tx?) → { rows, totalCount }` | Enriched student directory with parent/teacher names | `StudentDirectoryService.getStudentDirectory()` |
| `getManagerDirectory` | `StaffProfileRepository` | `(tx?) → ManagerDirectoryRow[]` | List all staff with permission group roles | `ManagerDirectoryService.getManagerDirectory()` |
| `findByUserId` | `StaffProfileRepository` | `(userId, locale?, tx?) → ManagerDirectoryRow \| null` | Get single staff profile by user ID | `ManagerProfileService.updateManagerProfile()` |
| `updateManagerProfile` | `StaffProfileRepository` | `(staffProfileId, input, locale?, tx?) → ManagerDirectoryRow` | Update staff phone/skypeId atomically | `ManagerProfileService.updateManagerProfile()` |
| `getUserPermissionGroupSlugs` | `StaffProfileRepository` | `(userId, tx?) → string[]` | Get permission group slugs for hierarchical checks | `ManagerProfileService.updateManagerProfile()` |
| `listResources` | `LearningResourceRepository` | `(searchQuery?, tx?) → { rows, totalCount }` | List non-deleted resources ordered by date | `LearningResourceService.listResources()` |
| `createResource` | `LearningResourceRepository` | `(input, locale?, tx?) → LearningResourceRow` | Create resource + file association atomically | `LearningResourceService.createResource()` |
| `findById` | `LearningResourceRepository` | `(resourceId, tx?) → LearningResourceRow \| null` | Get single non-deleted resource | `LearningResourceService.checkAccess()` |

---

### A-8. Service Architecture Summary

```
StudentDirectoryService.getStudentDirectory()
  ├── [permission check] students.list
  └── StudentRepository.getDirectoryRows()

ManagerDirectoryService.getManagerDirectory()
  ├── [permission check] staff.view_directory
  └── StaffProfileRepository.getManagerDirectory()

ManagerProfileService.updateManagerProfile()
  ├── [permission check] staff.edit_profile
  ├── [hierarchical check] actor groups vs target groups
  ├── StaffProfileRepository.getUserPermissionGroupSlugs()
  └── StaffProfileRepository.updateManagerProfile()

LearningResourceService.listResources()
  ├── [permission check] resources.list
  └── LearningResourceRepository.listResources()

LearningResourceService.createResource()
  ├── [permission check] resources.upload
  ├── StorageService.fileInfoByPath() (verify file exists)
  └── LearningResourceRepository.createResource()

LearningResourceService.checkAccess()
  ├── LearningResourceRepository.findById()
  └── [permission check] resources.list
```

---

### A-9. Security Threats Coverage Map

| **Threat** | **Section 4 Reference** | **Service Fix** | **Test Coverage** |
|---|---|---|---|
| IDOR on Student Directory | Section 4: Threat 1 | `StudentDirectoryService` checks `students.list` permission | Task H: unauthorized actor tests |
| Privilege Escalation via Manager Profile Edit | Section 4: Threat 2 | `ManagerProfileService` hierarchical check (Super Admin vs Academy Admin) | Task H: Academy Admin denied editing Super Admin |
| Unauthorized Resource Upload | Section 4: Threat 3 | `LearningResourceService.createResource()` checks `resources.upload` | Task H: Teacher denied upload test |
| Direct URL Access to Resources | Section 4: Threat 4 | `LearningResourceService.checkAccess()` gates file URL access | Task H: Parent denied resource access |
| Student History Cross-Access | Section 4: Threat 5 | `StudentHistoryService` (future — existing query already real) | Already covered by existing GraphQL tests |

---

### A-10. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Academy Admin UI                           │
│                                                              │
│  StudentsContainer ─── useQuery(studentDirectory)            │
│  Permission: students.list                                   │
│                                                              │
│  ManagersContainer ─── useQuery(managerDirectory)            │
│  Permission: staff.view_directory                            │
│                                                              │
│  ResourcesContainer ─── useQuery(learningResources)          │
│  + useMutation(uploadLearningResource)                       │
│  Permission: resources.list / resources.upload               │
└─────────────────────────┬───────────────────────────────────┘
                          │ GraphQL
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                              │
│                                                              │
│  StudentDirectoryService → StudentRepository                │
│  ManagerDirectoryService → StaffProfileRepository           │
│  ManagerProfileService → StaffProfileRepository             │
│  LearningResourceService → LearningResourceRepository       │
│                        → StorageService (file operations)    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                             │
│                                                              │
│  students ←→ parents ←→ teachers (directory joins)          │
│  staff_profiles ←→ users ←→ permission_groups               │
│  learning_resources ←→ storage_files (junction table)       │
│  permissions → group_permissions → permission_groups         │
└─────────────────────────────────────────────────────────────┘
```

---

### A-11. Glossary of Story 11 Terms

| **Term** | **Definition** |
|---|---|
| Student Directory | The global, flattened view of all students with cross-relational data (parent name, teacher name, hours/week). Gated by `students.list`. |
| Manager Directory | The list of all staff members with administrative backend access, showing their permission group roles. Gated by `staff.view_directory`. |
| Hierarchical Privilege Check | A service-layer enforcement rule where an admin can only edit profiles of users at equal or lower privilege levels. Super Admin can edit anyone; Academy Admin cannot edit Super Admin. |
| Learning Resource | A curriculum material (PDF, PPTX, etc.) stored in the academy's shared repository. Viewable by Teachers and Admins; uploadable only by Academy Admins. |
| Resource Access Gate | A system-level enforcement that prevents unauthorized users from accessing resource files via direct URL. Documented by `system.restrict_resource_access`. |
| Mock-to-Real Migration | The process of replacing mock Zustand stores (with hardcoded data) in production containers with real Apollo `useQuery` hooks backed by GraphQL queries. |
| Type Extraction | Moving shared TypeScript interfaces/types from mock store files into dedicated `.types.ts` files. Generated GraphQL types are re-exported; UI-specific types are defined locally. |
| Storybook MockedProvider | Apollo's testing utility that intercepts GraphQL queries in Storybook and returns predefined mock responses, replacing Zustand mock stores for story rendering. |
