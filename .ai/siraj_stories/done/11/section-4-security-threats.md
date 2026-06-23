## Section 4: Security Threat Remediation

### Threat 1: IDOR on Student Directory — Cross-Student Access

**Current Gap:** `StudentRepository.fetchWithFilters()` returns all students regardless of the actor's role. The existing RLS policies on the `students` table restrict parent users to their own children, but admin/teacher users bypass RLS (their user IDs do not exist in the `parents` table). There is no service-layer IDOR check on the student directory query.

**Fix in `StudentDirectoryService.getStudentDirectory()`:** The service method checks `students.list` permission via `PermissionsService.hasPermission(actorUserId, AppPermission.StudentsList)`. If the actor lacks this permission, throw a localized `unauthorized` error. Since the student directory is an any-scoped admin view, no per-student ownership check is needed — the permission gate itself is the security boundary.

**Test Requirements:**
- User without `students.list` permission → `unauthorized` error
- User with `students.list` (Academy Admin) → returns all students
- User with `students.list` (Staff Default) → returns all students
- Parent user (no `students.list`) → `unauthorized` error
- Unauthenticated user → `unauthorized`

---

### Threat 2: Privilege Escalation via Manager Profile Editing

**Current Gap:** `staff.edit_profile` is assigned to both `super_admin` and `academy_admin` groups. The story requires that editing OTHER administrators' profiles is strictly reserved for System Administrators to prevent privilege escalation. An Academy Admin editing a fellow admin's profile could potentially modify system privileges or inject unauthorized permission overrides.

**Fix in `ManagerProfileService.updateManagerProfile()`:** The service performs a dual-check:
1. Verify `staff.edit_profile` permission via `PermissionsService.hasPermission()`.
2. Verify the target staff member's permission group — if the target user holds `super_admin` or `academy_admin` group membership, the actor MUST hold a higher or equal privilege level. Specifically: an Academy Admin cannot edit a Super Admin's profile. Only Super Admin can edit other Super Admin profiles.

This is enforced in the service layer, not via a separate permission key, because the same `staff.edit_profile` permission applies but with a hierarchical constraint.

**Test Requirements:**
- Academy Admin editing Teacher staff profile → succeeds
- Academy Admin editing Super Admin profile → `unauthorized` error (hierarchical constraint)
- Super Admin editing any admin profile → succeeds
- User without `staff.edit_profile` → `unauthorized` error
- Editing non-existent staff profile → `not_found` error

---

### Threat 3: Unauthorized Resource Upload

**Current Gap:** The `resources.upload` permission currently exists only in the `super_admin` group. After Story 11, `academy_admin` also receives this permission. There is no existing `LearningResourceService` to enforce the upload permission gate — the current flow goes directly through the storage service without a domain-specific permission check.

**Fix in `LearningResourceService.uploadResource()`:** The service method checks `resources.upload` permission via `PermissionsService.hasPermission(actorUserId, AppPermission.ResourcesUpload)` before proceeding with the file upload workflow. If the actor lacks this permission, throw a localized `unauthorized` error. The upload workflow then delegates to `StorageService.uploadFile()` for the actual file storage, followed by creating the `learning_resources` record and `learning_resource_files` association within a single transaction.

**Test Requirements:**
- Teacher (holds `resources.list` only, NOT `resources.upload`) → `unauthorized` error
- Academy Admin (holds `resources.upload`) → upload succeeds
- Super Admin (holds `resources.upload`) → upload succeeds
- Parent/Student (no resource permissions) → `unauthorized` error
- Upload with missing file → `validation_error`
- Upload with missing document name → `validation_error`

---

### Threat 4: Direct URL Access to Resource Files

**Current Gap:** Resource files stored in the storage system may be accessible via direct URL if the storage path is known. Students or Parents who discover a resource file URL could bypass the UI and download curriculum materials directly.

**Fix in `ResourceAccessGuardService.checkAccess()` and `LearningResourceService.getResourceFileUrl()`:** Before returning any file URL, download link, or signed URL for a learning resource, the service checks that the requesting user holds `resources.list` permission. The `system.restrict_resource_access` permission documents this enforcement. The check is performed at the service layer whenever a resource file is accessed — whether through the directory listing or a direct file request.

The `StorageService.fileInfoByDbFileId()` method is wrapped by `LearningResourceService.getResourceFileUrl()` which adds the permission gate before delegating to storage.

**Test Requirements:**
- Teacher (holds `resources.list`) → file URL returned successfully
- Academy Admin (holds `resources.list`) → file URL returned successfully
- Student (no `resources.list`) → `unauthorized` error, no URL returned
- Parent (no `resources.list`) → `unauthorized` error, no URL returned
- Accessing deleted resource → `not_found` error

---

### Threat 5: Student History Cross-Access

**Current Gap:** `StudentHistoryRepository.getMonthlyCalendar()` accepts any `studentId` without verifying that the actor is authorized to view that student's history. The `history.view_calendar` permission is required at the navigation level, but there is no service-layer check.

**Fix in `StudentHistoryService.getClassHistory()`:** The service method checks `history.view_calendar` permission via `PermissionsService.hasPermission(actorUserId, AppPermission.HistoryViewCalendar)` before delegating to `StudentHistoryRepository.getMonthlyCalendar()`. Since `StudentHistoryContainer` already uses real GraphQL (`studentClassHistoryQueryDocument`), this fix adds the service-layer permission gate that is currently missing.

**Note:** If the existing `studentClassHistory` GraphQL query already has a resolver-level permission check, this fix extends it to the service layer for SSR compatibility. If no resolver check exists, this adds the first permission gate.

**Test Requirements:**
- User with `history.view_calendar` → returns student history data
- User without `history.view_calendar` → `unauthorized` error
- Non-existent studentId → empty result (not error, for security)
- Cross-student access (User A querying User B's child) → blocked by RLS on `students` table + service permission check
