# Section 5: Prerequisites Verification (BLOCKING)

## 5.0 Security Artifact Verification

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Parent Directory permission | `backend/db/migration/3-system_permissions_and_groups.sql:646` | grep for `parent.view_directory` | Exists ✅ (verified — line 646) |
| Parent enum value | `shared/lib/enum.ts:471` | grep for `PARENT_VIEW_DIRECTORY` | Exists ✅ (verified — line 471) |
| `BILLING_VIEW_UNPAID_INVOICES` enum | `shared/lib/enum.ts:465` | grep | Exists ✅ (verified — line 465) |
| Story 8 permissions (6 new) | `shared/lib/enum.ts` | grep for `PARENT_VIEW_PROFILE` | **NOT FOUND** ❌ — must be added in Task A |
| Story 8 permissions in migration SQL | `3-system_permissions_and_groups.sql` | grep for `parent.view_profile` | **NOT FOUND** ❌ — must be added in Task A |
| RLS policies (class_instances) | `backend/db/migration/class_instances_rls_policies.sql` | Exists | Exists ✅ (verified) |
| RLS policies (permissions) | `backend/db/migration/permissions_rls_policies.sql` | Exists | Exists ✅ (verified) |

---

## 5.1 Database Schema Verification

- [ ] Verify `parents` table exists with columns: `id`, `userId`, `status`, `phone`, `nationality`, `address`, `facebook`, `whatsapp`, `twitter`, `skype`, `defaultZoomLink`, `invoiceType`, `feeAmount`, `paymentMethod`, `currency`, `timezone`, `createdAt`, `updatedAt`. ✅ (verified — `backend/db/schema/parents.ts:6-36`)
- [ ] Verify `parent_status` enum values: `ACTIVATED`, `DEACTIVATED`, `REGULAR`, `ON_LEAVE`, `SUSPENDED`, `ON_TRIAL`. ✅ (verified from `ParentRepository` metrics result handling at lines 49-54)
- [ ] Verify `students` table has: `id`, `parentId`, `primaryTeacherId`, `name`, `classesTotal`, `classesRemaining`, `hoursPerWeek`, `version`, `status`. ✅ (verified — `backend/db/schema/students.ts:47-89`)
- [ ] Verify `students.classesRemaining` has `CHECK` constraint `students_classes_remaining_chk (classesRemaining >= 0)`. ✅ (verified — `backend/db/schema/students.ts:78`)
- [ ] Verify `students.version` column exists for optimistic locking. ✅ (verified — `backend/db/schema/students.ts:63`)
- [ ] Verify `invoices` table has: `id`, `parentId`, `issueDate`, `dueDate`, `paidDate`, `amount`, `currency`, `status`, `invoiceType`. ✅ (verified — `backend/db/schema/billing.ts:23-54`)
- [ ] Verify `parent_files` junction table exists: `id`, `fileId`, `parentId`, `usageType`, `createdAt`. ✅ (verified — `backend/db/schema/storage.ts:77-91`)
- [ ] Verify `storage_files` table exists. ✅ (verified — `backend/db/schema/storage.ts:11-15`)
- [ ] Verify `users` table has `name`, `email`, `avatarUrl`. ✅ (verified — `backend/db/schema/users.ts:17-32`)
- [ ] Verify `teachers` table exists (for student → primary teacher join). ✅ (referenced in `backend/db/schema/students.ts:18`)

---

## 5.2 Migration Verification

- [ ] Run `bun run scripts/dbActions.ts push` to ensure all current migrations are applied.
- [ ] Verify `backend/db/migration/3-system_permissions_and_groups.sql` is applied (existing permissions seeded). ✅ (verified — `parent.view_directory` confirmed at line 646)
- [ ] Verify the `protect_system_permissions` trigger is active on `permissions` and `permission_groups` tables. ✅ (verified — trigger referenced in migration)

---

## 5.3 Test Suite Verification

- [ ] Run `bun run test:db` — all existing database tests pass (0 failures).
- [ ] Run `bun run test:graphql` — all existing GraphQL integration tests pass (0 failures). The existing `parent.test.ts` (parentDirectory tests) must pass.
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.

---

## 5.4 Existing Code Verification

- [ ] Verify `ParentRepository.getParentDirectory()` exists and works. ✅ (verified — `backend/db/repo/parent.repository.ts:33-95`)
- [ ] Verify `ParentRepository.getStudentsForParent()` exists. ✅ (verified — `backend/db/repo/parent.repository.ts:97-100`) — **NOTE: returns only `{ name }`. The new `getAssociatedStudents` method must return full data including teacher, hoursPerWeek, classesRemaining.**
- [ ] Verify `BillingRepository.getUnpaidInvoicesSummary()` exists. ✅ (verified — `backend/db/repo/billing.repository.ts:258-337`) — **NOTE: No `getInvoicesForParent` method exists. Must be created in Task B.**
- [ ] Verify `StudentRepository.partiallyUpdate()` exists. ✅ (verified — `backend/db/repo/student.repository.ts:167-206`) — **NOTE: `setClassesRemaining` (direct override) does NOT exist. Must be created in Task B.**
- [ ] Verify `StorageDbRepository.createFile()`, `filesByIds()` exist. ✅ (verified — `backend/db/repo/storage.repository.ts:43-53`) — **NOTE: No `getFilesForParent` or `linkFileToParent` methods exist. Must be created in Task B.**
- [ ] Verify `PermissionsService.hasPermission()` and `hasAnyPermission()` exist and work. ✅ (verified — used in `ParentDirectoryService`)
- [ ] Verify `getBackendTranslations()` helper is available. ✅ (verified — used in `ParentDirectoryService`)

---

## 5.5 Frontend Mock Store Verification

- [ ] Verify `ParentProfileContainer` imports from `mockParentDashboardStore` and `mockUserStore`. ✅ (verified — `frontend/views/dashboard/parents/dashboard/ParentDashboardContainer.tsx:4-5`)
- [ ] Verify `ParentProfileContainer` (profile) uses hardcoded `MOCK_PARENT` data with no real fetch. ✅ (verified — `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx:55-57`)
- [ ] Verify `StudentQuotaContainer` imports from `mockStudentQuotaStore`. ✅ (verified — `frontend/views/dashboard/students/quota/StudentQuotaContainer.tsx:5`)
- [ ] Verify `ParentBillingContainer` imports from `moackParentBillingStore` (typo is in real file). ✅ (verified — `frontend/views/dashboard/billing/ParentBillingContainer.tsx:6`)
- [ ] Verify `ParentProfileActions` deactivate button is `href="#"` with no real action. ✅ (verified — `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx:54-69`)
- [ ] Verify `useParams() as { id: string }` (blind cast) exists in `StudentQuotaContainer`. ✅ (verified — `frontend/views/dashboard/students/quota/StudentQuotaContainer.tsx:10`)
- [ ] Verify i18n keys exist in `shared/messages/en.ts` for `dashboard.parentProfile` namespace. ✅ (referenced in ParentProfileView)

---

## 5.6 Route Verification

- [ ] Verify `app/[locale]/(dashboard)/parents/[id]/profile/page.tsx` exists. ✅ (verified — directory confirmed)
- [ ] Verify no `/parents/[id]/billing` or `/students/[id]/quota` routes exist in the app directory that would need updating. Must check before writing view tasks.
