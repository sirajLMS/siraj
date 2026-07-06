### Task D — Services: Student Directory, Manager Directory, Manager Profile, Learning Resource Domain Logic

**Objective:** Implement domain services with permission gating and business logic orchestration. Services delegate data access to repositories but own business rules, validation, and permission checks.

**Dependencies:** Depends on Task C — all repository methods are implemented and tested.

**Layer-Specific Rules (Backend Services — Flattened from backend/services/AGENTS.md):**
- **Domain-Driven Design**: Services must be scoped to their domain. NO monolithic services.
- **NO Drizzle/DB Imports Allowed**: Services can ONLY depend on `backend/db/repo/`. Importing from `drizzle-orm`, `backend/db/schema`, or any database module is **strictly forbidden**.
- **i18n / Localized Error Messages**: All user-facing errors must use `getBackendTranslations({ locale, namespace: "errors" })`. Hardcoded error strings are forbidden.
- **SSR Compatibility**: Services can be used directly by Next.js Server Components without GraphQL dependencies.

**Target Files:**
- `backend/services/student/student-directory.service.ts` — NEW (student directory query service)
- `backend/services/staff/manager-directory.service.ts` — NEW (manager directory service)
- `backend/services/staff/manager-profile.service.ts` — NEW (manager profile update service)
- `backend/services/resource/learning-resource.service.ts` — NEW (learning resource CRUD service)

---

**Detailed Implementation Steps:**

*Step 1: Create `StudentDirectoryService`*

Create `backend/services/student/student-directory.service.ts`:

```typescript
import { PermissionDeniedError } from "@/backend/errors";
import { getBackendTranslations } from "@/backend/lib/intl";
import { StudentRepository } from "@/backend/db/repo";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";

export interface GetStudentDirectoryResult {
  readonly rows: {
    id: string;
    name: string;
    email: string;
    status: string;
    classesRemaining: number;
    classesTotal: number;
    hoursPerWeek: string;
    parentName: string;
    teacherName: string | null;
    createdAt: Date;
  }[];
  readonly totalCount: number;
}

/**
 * Fetches enriched student directory rows with cross-relational data.
 * Requires `students.list` permission.
 */
export async function getStudentDirectory(
  actorUserId: string,
  paginationArgs: Types.PaginationArgs | null,
  filters?: Types.StudentFilterArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  locale?: string
): Promise<GetStudentDirectoryResult> {
  const t18n = await getBackendTranslations({ locale, namespace: "errors" });

  // Permission gate
  const hasPermission = await PermissionsService.hasPermission(actorUserId, "STUDENTS_LIST");
  if (!hasPermission) {
    throw new PermissionDeniedError(t18n.permissionDenied ?? "You do not have permission to view the student directory.");
  }

  // Delegate to repository
  return await StudentRepository.getDirectoryRows(paginationArgs, filters, orderBy);
}
```

---

*Step 2: Create `ManagerDirectoryService`*

Create `backend/services/staff/manager-directory.service.ts`:

```typescript
import { PermissionDeniedError } from "@/backend/errors";
import { getBackendTranslations } from "@/backend/lib/intl";
import { StaffProfileRepository } from "@/backend/db/repo";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface GetManagerDirectoryResult {
  readonly rows: {
    id: string;
    staffProfileId: string;
    name: string;
    email: string;
    phone: string | null;
    skypeId: string | null;
    status: string;
    roleSlug: string;
    roleName: string;
  }[];
}

/**
 * Lists all staff members with administrative access and their permission group roles.
 * Requires `staff.view_directory` permission.
 */
export async function getManagerDirectory(
  actorUserId: string,
  locale?: string
): Promise<GetManagerDirectoryResult> {
  const t18n = await getBackendTranslations({ locale, namespace: "errors" });

  // Permission gate
  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.StaffViewDirectory);
  if (!hasPermission) {
    throw new PermissionDeniedError(t18n.permissionDenied ?? "You do not have permission to view the managers directory.");
  }

  // Delegate to repository
  const rows = await StaffProfileRepository.getManagerDirectory();

  return { rows };
}
```

---

*Step 3: Create `ManagerProfileService`*

Create `backend/services/staff/manager-profile.service.ts`:

```typescript
import { PermissionDeniedError, NotFoundError } from "@/backend/errors";
import { getBackendTranslations } from "@/backend/lib/intl";
import { StaffProfileRepository } from "@/backend/db/repo";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";
import logger from "@/backend/lib/logger";

export interface UpdateManagerProfileInput {
  readonly phone?: string | null;
  readonly skypeId?: string | null;
}

export interface ManagerProfileUpdateResult {
  readonly id: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly status: string;
  readonly roleSlug: string;
  readonly roleName: string;
}

/**
 * Updates a manager's profile fields (phone, skypeId).
 * Enforces strict hierarchical privilege checks: Admin cannot edit other Admin profiles.
 * Only Super Admin can edit Super Admin or Admin profiles.
 */
export async function updateManagerProfile(
  actorUserId: string,
  targetStaffProfileId: string,
  input: UpdateManagerProfileInput,
  locale?: string
): Promise<ManagerProfileUpdateResult> {
  const t18n = await getBackendTranslations({ locale, namespace: "errors" });

  // Step 1: Verify basic permission
  const hasEditPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.StaffEditProfile);
  if (!hasEditPermission) {
    throw new PermissionDeniedError(t18n.permissionDenied ?? "You do not have permission to edit staff profiles.");
  }

  // Step 2: Get target staff profile
  const targetProfile = await StaffProfileRepository.findByUserId(actorUserId);
  if (!targetProfile) {
    throw new NotFoundError(t18n.staffProfileNotFound ?? "Staff profile not found.");
  }

  // Step 3: Get actor's permission group slugs for hierarchical check
  const actorGroupSlugs = await StaffProfileRepository.getUserPermissionGroupSlugs(actorUserId);

  // Step 4: Get target's permission group slugs
  const targetGroupSlugs = await StaffProfileRepository.getUserPermissionGroupSlugs(targetProfile.id);

  // Step 5: Hierarchical privilege check
  const actorIsSuperAdmin = actorGroupSlugs.includes("super_admin");
  const targetIsSuperAdmin = targetGroupSlugs.includes("super_admin");
  const targetIsAcademyAdmin = targetGroupSlugs.includes("academy_admin");

  // Super Admin can edit anyone
  if (actorIsSuperAdmin) {
    logger.info("Super Admin updating staff profile", { targetProfileId: targetProfile.id, userId: actorUserId });
  } else if (targetIsSuperAdmin || targetIsAcademyAdmin) {
    // Non-Super Admin attempting to edit higher-level admin → blocked
    throw new PermissionDeniedError(
      t18n.insufficientPrivilege ?? 
      "You do not have sufficient privilege to edit administrative accounts."
    );
  }

  // Step 6: Delegate to repository for update
  const updatedProfile = await StaffProfileRepository.updateManagerProfile(
    targetStaffProfileId,
    input,
    locale
  );

  logger.info("Manager profile updated successfully", { 
    staffProfileId: targetStaffProfileId, 
    userId: actorUserId 
  });

  return updatedProfile;
}
```

---

*Step 4: Create `LearningResourceService`*

Create `backend/services/resource/learning-resource.service.ts`:

```typescript
import { PermissionDeniedError, NotFoundError } from "@/backend/errors";
import { getBackendTranslations } from "@/backend/lib/intl";
import { LearningResourceRepository } from "@/backend/db/repo";
import { StorageDbRepository } from "@/backend/db/repo/storage.repository";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";
import { getStorageService } from "@/backend/storage/storage.service";
import logger from "@/backend/lib/logger";

export interface ListResourcesResult {
  readonly rows: {
    id: string;
    displayName: string;
    filePath: string;
    uploadedByUserId: string;
    uploadedByUserName: string | null;
    fileSize: number | null;
    contentType: string | null;
    createdAt: Date;
  }[];
  readonly totalCount: number;
}

export interface CreateResourceInput {
  readonly displayName: string;
  readonly filePath: string;
  readonly fileId: string;
}

export interface CreateResourceResult {
  readonly id: string;
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly uploadedByUserName: string | null;
  readonly fileSize: number | null;
  readonly contentType: string | null;
  readonly createdAt: Date;
}

/**
 * Lists non-deleted learning resources ordered by creation date DESC.
 * Requires `resources.list` permission.
 */
export async function listResources(
  actorUserId: string,
  searchQuery?: string | null,
  locale?: string
): Promise<ListResourcesResult> {
  const t18n = await getBackendTranslations({ locale, namespace: "errors" });

  // Permission gate
  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.ResourcesList);
  if (!hasPermission) {
    throw new PermissionDeniedError(t18n.permissionDenied ?? "You do not have permission to view learning resources.");
  }

  // Delegate to repository
  const result = await LearningResourceRepository.listResources(searchQuery);

  return result;
}

/**
 * Creates a new learning resource record with file association.
 * Requires `resources.upload` permission.
 * Uses a transaction to atomically create both records.
 */
export async function createResource(
  actorUserId: string,
  input: CreateResourceInput,
  locale?: string
): Promise<CreateResourceResult> {
  const t18n = await getBackendTranslations({ locale, namespace: "errors" });

  // Step 1: Verify upload permission
  const hasUploadPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.ResourcesUpload);
  if (!hasUploadPermission) {
    throw new PermissionDeniedError(t18n.permissionDenied ?? "You do not have permission to upload learning resources.");
  }

  // Step 2: Verify file exists in storage
  const storageService = await getStorageService();
  const fileInfo = await storageService.fileInfoByPath(input.filePath);
  if (!fileInfo) {
    throw new NotFoundError("File not found in storage.");
  }

  // Step 3: Create resource within transaction
  const result = await LearningResourceRepository.createResource(
    {
      displayName: input.displayName,
      filePath: input.filePath,
      uploadedByUserId: actorUserId,
      fileId: input.fileId,
    },
    locale
  );

  logger.info("Learning resource created", {
    resourceId: result.id,
    fileName: result.displayName,
    uploaderId: actorUserId
  });

  return result;
}

/**
 * Checks whether an actor has permission to access a specific resource file.
 * This implements the `system.restrict_resource_access` enforcement.
 */
export async function checkAccess(
  actorUserId: string,
  resourceId: string,
  locale?: string
): Promise<boolean> {
  const t18n = await getBackendTranslations({ locale, namespace: "errors" });

  // Check resource exists
  const resource = await LearningResourceRepository.findById(resourceId);
  if (!resource) {
    return false;
  }

  // Check permission
  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.ResourcesList);
  
  return hasPermission;
}
```

---

**Test Execution Requirements:**
- **Run integration tests:** Run the full service test suite to ensure no regressions.
  ```bash
  bun run test:integration
  ```
  If no dedicated integration test suite exists, rely on GraphQL tests after they are written.

**Success Criteria / Check Progress Points:**
- [ ] `StudentDirectoryService.getStudentDirectory()` gates on `students.list` permission.
- [ ] `ManagerDirectoryService.getManagerDirectory()` gates on `staff.view_directory` permission.
- [ ] `ManagerProfileService.updateManagerProfile()` enforces hierarchical privilege checks (Super Admin vs Admin).
- [ ] `LearningResourceService.listResources()` gates on `resources.list` permission.
- [ ] `LearningResourceService.createResource()` gates on `resources.upload` permission and verifies file existence.
- [ ] `LearningResourceService.checkAccess()` returns true only when actor has `resources.list` permission.
- [ ] All services use `getBackendTranslations()` for localized error messages.
- [ ] No services import from `drizzle-orm`, `backend/db/schema`, or direct DB modules.
- [ ] All services delegate data access to repositories, never touch DB directly.
- [ ] `bun tsgo` passes with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
