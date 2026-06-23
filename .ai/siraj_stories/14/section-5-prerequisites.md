## Section 5: Prerequisites Verification (BLOCKING)

### 5.0 Security Artifact Verification

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Soft-delete for complaints | `backend/db/repo/soft-delete.repository.ts:145-151` | Code review | `softDeleteComplaint()` exists ✅ |
| Complaint files storage | `backend/db/repo/storage.repository.ts:300-301` | Code review | `complaintFiles` handling exists ✅ |
| Permissions service | `backend/services/auth/permissions.service.ts` | Code review | `hasPermission()`, `hasAnyPermission()` exist ✅ |
| Audit repository | `backend/db/repo/audit.repository.ts` | Code review | `createAuditLog()` exists ✅ |

### 5.1 Database Schema Verification

- [ ] Verify `complaints` table exists with columns: `id`, `parentId`, `studentId`, `category`, `submitterEmail`, `body`, `status`, `createdAt`, `updatedAt`, `deletedAt`. ✅ (verified — `backend/db/schema/communications.ts:116-133`)
- [ ] Verify `complaintResponses` table exists with columns: `id`, `complaintId`, `responderUserId`, `body`, `emailSent`, `createdAt`. ✅ (verified — `backend/db/schema/communications.ts:135-148`)
- [ ] Verify `suggestions` table exists with columns: `id`, `parentId`, `submitterName`, `body`, `emailSentAt`, `createdAt`. ✅ (verified — `backend/db/schema/communications.ts:150-163`)
- [ ] Verify `complaintFiles` junction table exists. ✅ (verified — `backend/db/schema/storage.ts:112-129`)
- [ ] Verify `complaintCategoryEnum` with values `REGARDING_TEACHER`, `REGARDING_SYSTEM`, `OTHER`. ✅ (verified — `backend/db/schema/enums.ts:54`, `shared/lib/enum.ts`)
- [ ] Verify `complaintStatusEnum` with values `UNANSWERED`, `ANSWERED`. ✅ (verified — `backend/db/schema/enums.ts:56`, `shared/lib/enum.ts`)
- [ ] Verify Drizzle relations for complaints → parent, student, responses. ✅ (verified — `backend/db/drizzleRelations.ts:389-418`)
- [ ] Verify Drizzle relations for suggestions → parent. ✅ (verified — `backend/db/drizzleRelations.ts:413-418`)
- [ ] Verify `notificationDeliveries` table exists for on-app channel. ✅ (verified — `backend/db/schema/communications.ts:81-112`)

### 5.2 Migration Verification

- [ ] Run `bun run scripts/dbActions.ts push` to ensure all migrations are applied.
- [ ] Verify `backend/db/migration/3-system_permissions_and_groups.sql` is applied. ✅ (verified)
- [ ] Verify existing `complaints.list`, `complaints.delete`, `complaints.respond` permissions exist in enum. ✅ (verified — `shared/lib/enum.ts`)
- [ ] Verify the `protect_system_permissions` trigger is active on `permissions` and `permission_groups` tables. ✅ (verified)
- [ ] Verify `NotificationEventType` enum exists with `COMPLAINT_RESPONSE` value. ✅ (verified — `shared/lib/enum.ts`)

### 5.3 Test Suite Verification

- [ ] Run `bun run test:db` — all existing database tests pass (0 failures).
- [ ] Run `bun run test:graphql` — all existing GraphQL integration tests pass (0 failures).
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.

### 5.4 Existing Code Verification

- [ ] Verify `ParentRepository.findByUserId()` exists. ✅ (verified — `backend/db/repo/parent.repository.ts:232-236`)
- [ ] Verify `SoftDeleteRepository.softDeleteComplaint()` exists. ✅ (verified — `backend/db/repo/soft-delete.repository.ts:145-151`)
- [ ] Verify `PermissionsService.hasPermission()` exists. ✅ (verified — `backend/services/auth/permissions.service.ts`)
- [ ] Verify `getBackendTranslations()` helper is available. ✅ (verified — `backend/lib/intl.ts`)
- [ ] Verify `NotificationAlertsService.getAlerts()` queries complaints directly (needs refactoring). ✅ (verified — `backend/services/notification/notification-alerts.service.ts:36-45`)
- [ ] Verify `Email` value object exists. ✅ (verified — `backend/lib/email.ts`)

### 5.5 Frontend Verification

- [ ] Verify `ParentComplaintsContainer` imports from `mockParentComplaintsStore`. ✅ (verified — `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx`)
- [ ] Verify `AdminComplaintsContainer` imports from `mockAdminComplaintsStore`. ✅ (verified — `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx`)
- [ ] Verify `ParentSuggestionsContainer` imports from `mockParentSuggestionsStore`. ✅ (verified — `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx`)
- [ ] Verify `AdminSuggestionsContainer` imports from `mockAdminSuggestionsStore`. ✅ (verified — `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx`)
- [ ] Verify i18n keys exist for `dashboard.complaints` namespace. ✅ (verified — `shared/messages/en.ts:1993-2052`)
- [ ] Verify i18n keys exist for `dashboard.suggestions` namespace. ✅ (verified — `shared/messages/en.ts:1932-1992`)
- [ ] Verify no complaint/suggestion GraphQL documents exist. ✅ (verified — no files in `frontend/graphql/sharedDocuments/`)
- [ ] Verify no complaint/suggestion Zustand stores exist. ✅ (verified — no files in `frontend/stores/`)
