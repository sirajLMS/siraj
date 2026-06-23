## Section 5: Prerequisites Verification (BLOCKING)

### 5.1 Database Schema Verification
- [ ] Verify `learning_resources` table exists with columns: `id`, `display_name`, `file_path`, `uploaded_by_user_id`, `created_at`, `deleted_at`. ✅ (verified — `backend/db/schema/communications.ts:167-181`)
- [ ] Verify `class_instances` table exists with columns for `outcome`, `duration_minutes`, `rate_amount`, `rate_currency`. ✅ (verified — `backend/db/schema/scheduling.ts:109-193`)
- [ ] Verify `storage_file` table and junctions exist. ✅ (verified — `backend/db/schema/storage.ts`)

### 5.2 Migration Verification
- [ ] Run `bun run scripts/dbActions.ts push` to ensure all migrations are applied.
- [ ] Verify `backend/db/migration/3-system_permissions_and_groups.sql` is applied. ✅ (verified)
- [ ] Verify the existing `resources.upload` permission exists in the database. ✅ (verified — `backend/db/migration/3-system_permissions_and_groups.sql:457`)

### 5.3 Test Suite Verification
- [ ] Run `bun run test:db` — all existing database tests pass (0 failures).
- [ ] Run `bun run test:graphql` — all existing GraphQL integration tests pass (0 failures).
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.

### 5.4 Existing Code Verification
- [ ] Verify `StorageRepository.deleteFile(path)` exists and works. ✅ (verified — `backend/db/repo/storage.repository.ts:69`)
- [ ] Verify `LearningResourceRepository` exists. ✅ (verified — `backend/db/repo/learning-resource.repository.ts`)
- [ ] Verify `LearningResourceService` exists. ✅ (verified — `backend/services/resource/learning-resource.service.ts`)
- [ ] Verify `PermissionsService.hasPermission()` exists and works. ✅ (verified — `backend/services/auth/permissions.service.ts`)

### 5.5 Frontend Verification
- [ ] Verify MUI `Dialog` patterns exist in the codebase. ✅ (verified — e.g. `frontend/views/dashboard/classes/details/components/LiveSessionToolbar.tsx`)
- [ ] Verify existing resource management UI. ✅ (verified — `frontend/views/dashboard/resources`)
- [ ] Verify i18n keys exist for relevant namespaces. ✅ (verified — `shared/messages/en.ts`)
