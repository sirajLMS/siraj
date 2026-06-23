# Investigation Findings for Story 12

## 2.1 Resource Domain Investigation
- [x] **Verify existing `resource.upload` permission**: ✅ Exists. It is named `resources.upload` in the DB migration `3-system_permissions_and_groups.sql` and the enum is `RESOURCES_UPLOAD`.
- [x] **Locate resource upload implementation (Part 12)**: ✅ Exists in `backend/db/repo/learning-resource.repository.ts` and `backend/services/resource/learning-resource.service.ts`.
- [x] **Verify resource schema**: ✅ Exists in `backend/db/schema/communications.ts` as `learningResources` table (`id`, `displayName`, `filePath`, `uploadedByUserId`, `createdAt`, `deletedAt`).
- [x] **Locate file storage infrastructure**: ✅ Exists in `backend/db/repo/storage.repository.ts` with methods `deleteFile(path)` and `deleteDirectory(path)`. The junctions are in `backend/db/schema/storage.ts` like `learningResourceFiles`.

## 2.2 Reporting Domain Investigation
- [x] **Verify attendance/session data model**: ✅ Exists in `backend/db/schema/scheduling.ts` (`classInstances` with `outcome` = TAKEN/ABSENT/LEAVE/PENDING, `durationMinutes`, `teacherId`, `scheduledStartAt`).
- [x] **Verify billing/payroll calculation logic**: ✅ `teacher-banking.ts` has rates, or `teachers.ts` has base rates. `classInstances` has `rateAmount` and `rateCurrency`.
- [x] **Check for existing reporting infrastructure**: ❌ None exists. Needs to be built (`report.repository.ts` and `report.service.ts`).
- [x] **Verify report entity structure**: ❌ No `reports` table exists. Reports will be dynamic queries returning ephemeral results.

## 2.3 Frontend State Investigation
- [x] **Locate existing resource management UI**: ✅ Exists in `frontend/views/dashboard/resources`.
- [x] **Determine if reporting UI exists**: ❌ No existing reporting UI. It will be built in `frontend/views/dashboard/reports`.
- [x] **Verify MUI Dialog patterns**: ✅ Exists. The project uses MUI `<Dialog>`, `<DialogTitle>`, `<DialogContent>`, `<DialogActions>` (e.g. in `LiveSessionToolbar.tsx`).

## 2.4 Permission Group Assignment Investigation
- [x] **Verify `academy_admin` permission group exists**: ✅ Exists in `3-system_permissions_and_groups.sql` and enum.
- [x] **Check if Teacher/Parent/Student groups need any new assignments**: ✅ Verified. The story states "None applicable" for these groups.
