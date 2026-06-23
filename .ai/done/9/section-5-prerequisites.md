## Section 5: Prerequisites Verification (BLOCKING)

All items must be verified **before** executing any task from [Section 6](./section-6-tasks/). If any item is marked ❌, the corresponding work is BLOCKING and must be completed first.

---

### 5.0 Security Artifact Verification (Story 8 Baseline)

Story 9 extends the Parent Profile built in Story 8. The following Story 8 artifacts must be deployed and functional:

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Parent profile GraphQL | `backend/graphql/pothos/parent-profile.pothos.ts` | File exists, `bun tsgo` passes | `parentProfile` query resolves ✅ |
| Parent status mutation | `backend/graphql/pothos/parent-profile.pothos.ts` | `deactivateParent` mutation defined | Mutation exists ✅ |
| Student associated query | `backend/graphql/pothos/parent-profile.pothos.ts` | `parentAssociatedStudents` query defined | Query exists ✅ |
| Billing history service | `backend/services/billing/billing-history.service.ts` | File exists, all methods implemented | `getParentInvoiceHistory` exists ✅ |
| Billing history pothos | `backend/graphql/pothos/billing-history.pothos.ts` | `parentInvoiceHistory` query defined | Query exists ✅ |
| Parent profile container | `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx` | Uses real `useQuery`, no mock store | Apollo wired ✅ |
| Student status trigger | `backend/db/migration/student_status_transition_trigger.sql` | Trigger applied in DB | `fn_enforce_student_status_transition` exists ✅ |
| Student billing history docs | `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts` | `TypedDocumentNode` defined | Document exists ✅ |

**If any artifact is missing or failing, the corresponding Story 8 task is BLOCKING before Story 9 work begins.**

---

### 5.1 Database Schema Verification

- [ ] Verify `invoices` table exists with columns: `id`, `parentId`, `studentId`, `status`, `amount`, `currency`, `issueDate`, `dueDate`, `paidDate`, `invoiceType`, `deletedAt`, `version`, `createdAt`, `updatedAt`.
  ✅ (verified — `backend/db/repo/billing.repository.ts` selects these columns at lines 357–370)

- [ ] Verify `students` table exists with columns: `id`, `parentId`, `primaryTeacherId`, `name`, `status`, `classesTotal`, `classesRemaining`, `version`, `createdAt`, `updatedAt`.
  ✅ (verified — `backend/db/repo/student.repository.ts` uses all these columns at lines 182–196)

- [ ] Verify `student_status_history` table exists (used by logging trigger).
  ✅ (verified — `backend/db/migration/student_status_transition_trigger.sql:51-65` inserts into this table)

- [ ] Verify `parents` table exists with `id`, `userId` columns.
  ✅ (verified — `backend/db/repo/billing.repository.ts:284-298` joins parents table)

- [ ] Verify `users` table exists with `id`, `name`, `email` columns.
  ✅ (verified — `backend/db/repo/billing.repository.ts:287-289` selects from users)

---

### 5.2 Existing Enum Verification

The following `AppPermission` values must be verified as **absent** before Task A adds them (prevents duplicate enum key errors):

- [ ] `BILLING_CREATE_INVOICE` — ❌ (not present — `shared/lib/enum.ts` lines 467–480 confirm absence; must be added in Task A)
- [ ] `BILLING_UPDATE_STATUS_PAID` — ❌ (not present — must be added in Task A)
- [ ] `BILLING_DELETE_INVOICE` — ❌ (not present — must be added in Task A)
- [ ] `STUDENT_REASSIGN_TEACHER` — ❌ (not present — must be added in Task A)
- [ ] `STUDENT_MANAGE_STATUS` — ❌ (not present — must be added in Task A)
- [ ] `SYSTEM_SYNC_NOTIFICATIONS` — ❌ (not present — must be added in Task A)

The following `AppPermission` values must be verified as **present** (used by existing services, do NOT add again):

- [ ] `BILLING_VIEW_HISTORY = "billing.view_history"` — ✅ (verified — `shared/lib/enum.ts:479`)
- [ ] `BILLING_VIEW_UNPAID_INVOICES = "billing.view_unpaid_invoices"` — ✅ (verified — `shared/lib/enum.ts:467`)
- [ ] `STUDENT_EDIT_QUOTA = "student.edit_quota"` — ✅ (verified — `shared/lib/enum.ts:478`)
- [ ] `STUDENT_VIEW_ASSOCIATED = "student.view_associated"` — ✅ (verified — `shared/lib/enum.ts:477`)

---

### 5.3 Migration Verification

- [ ] Verify `backend/db/migration/3-system_permissions_and_groups.sql` is applied and contains Story 8 permissions (`parent.view_profile`, `parent.manage_status`, `student.view_associated`, `student.edit_quota`, `billing.view_history`, `document.manage_parent_docs`).
  ✅ (verified — lines 654–706 of migration file)

- [ ] Verify the `protect_system_permissions` trigger is active on `permissions` and `permission_groups` tables.
  ✅ (verified — `backend/db/migration/3-system_permissions_and_groups.sql:1001–1054`)

- [ ] Verify `billing.create_invoice`, `billing.update_status_paid`, `billing.delete_invoice`, `student.reassign_teacher`, `student.manage_status`, `system.sync_notifications` are **NOT yet present** in the migration file.
  ✅ (verified — grep of `3-system_permissions_and_groups.sql` returns no matches for these keys)

---

### 5.4 Test Suite Verification

- [ ] Run `bun run test:db` — all existing database tests pass (0 failures).
- [ ] Run `bun run test:graphql` — all existing GraphQL integration tests pass (0 failures).
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.
- [ ] Run `bun biome:check` — zero linting/formatting errors.

---

### 5.5 Existing Code Verification

- [ ] Verify `BillingRepository.createInvoice()` exists — ✅ (verified — `backend/db/repo/billing.repository.ts:167-174`)
- [ ] Verify `BillingRepository.updateInvoiceStatus()` exists — ✅ (verified — `backend/db/repo/billing.repository.ts:206-256`)
- [ ] Verify `BillingRepository.getInvoicesForParent()` exists — ✅ (verified — `backend/db/repo/billing.repository.ts:351-384`)
- [ ] Verify `StudentRepository.partiallyUpdate()` exists — ✅ (verified — `backend/db/repo/student.repository.ts:167-206`)
- [ ] Verify `StudentRepository.findById()` exists — ✅ (verified — `backend/db/repo/student.repository.ts:86-90`)
- [ ] Verify `PermissionsService.hasPermission()` exists — ✅ (verified — `backend/services/auth/permissions.service.ts`)
- [ ] Verify `getBackendTranslations()` helper is available — ✅ (verified — `backend/lib/intl.ts`)
- [ ] Verify `BillingHistoryService.getParentInvoiceHistory()` exists (Story 8) — ✅ (verified — `backend/services/billing/billing-history.service.ts:23-35`)
- [ ] Verify `StudentManagementService.editQuota()` exists (Story 8) — ✅ (verified — `backend/services/student/student-management.service.ts:23-72`)

---

### 5.6 Frontend Verification

- [ ] Verify `AdminBillingContainer` currently imports from `mockAdminBillingStore` — ✅ (verified — `frontend/views/dashboard/billing/AdminBillingContainer.tsx:7`)
- [ ] Verify `ManualInvoiceContainer` currently imports from `mocKAdminManualInvoiceStore` — ✅ (verified — `frontend/views/dashboard/billing/manual/ManualInvoiceContainer.tsx:6`)
- [ ] Verify `ParentStudentsDataGrid` "Teacher" column has a non-functional `SettingsOutlined` icon (no mutation wired) — ✅ (verified — `frontend/views/dashboard/parents/profile/ParentStudentsDataGrid.tsx:120-136`)
- [ ] Verify `ParentStudentsDataGrid` "Status" column renders `StatusBadge` but has no click handler for status change — ✅ (verified — `frontend/views/dashboard/parents/profile/ParentStudentsDataGrid.tsx:138-146`)
- [ ] Verify i18n keys exist in `shared/messages/en.ts` for `dashboard.parentProfile` namespace (Story 8 additions present).
