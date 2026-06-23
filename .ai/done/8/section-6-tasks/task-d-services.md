# Task D — Services: ParentProfileService, BillingHistoryService, ParentDocumentService, StudentManagementService

**Objective:** Implement the four domain services that orchestrate permission checks, business rule validation, and repository calls for all six new permissions. Services are the sole layer that applies permission gates — repositories and resolvers must NOT duplicate this logic.

**Dependencies:** Depends on Task B (repository methods) and Task A (AppPermission enum values).

**Layer-Specific Rules (Backend Services — Flattened from backend/services/AGENTS.md):**
- **🚫 Services MUST NOT import from DB/Drizzle** — No `drizzle-orm`, `backend/db/schema`, or `backend/db/index`. Only import from `backend/db/repo/`.
- Domain-driven: One service file per domain. Do NOT create a single monolithic parent service.
- Use `PermissionsService.hasPermission(actorUserId, AppPermission.XXX)` for all permission checks.
- Use `getBackendTranslations({ locale, namespace: "errors" })` for all error messages — no hardcoded strings.
- Use `import { logger } from '@/backend/lib/logger'` — no `console.*`.
- Services must work in Next.js Server Components — no Apollo client, no browser APIs.

**Target Files:**
- `backend/services/parent/parent-profile.service.ts` — NEW
- `backend/services/billing/billing-history.service.ts` — NEW
- `backend/services/parent/parent-document.service.ts` — NEW (within existing `parent/` subdir)
- `backend/services/student/student-management.service.ts` — NEW (or extend if exists)

---

## Detailed Implementation Steps

### Step 1: Create `backend/services/parent/parent-profile.service.ts`

```typescript
import { ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ParentProfileResult {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly status: string;
  readonly phone: string | null;
  readonly nationality: string | null;
  readonly address: string | null;
  readonly facebook: string | null;
  readonly whatsapp: string | null;
  readonly twitter: string | null;
  readonly skype: string | null;
  readonly defaultZoomLink: string | null;
  readonly invoiceType: string | null;
  readonly feeAmount: string | null;
  readonly paymentMethod: string | null;
  readonly currency: string | null;
  readonly timezone: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AssociatedStudentResult {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly primaryTeacherId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly language: string | null;
  readonly gender: string | null;
  readonly updatedAt: Date;
}

export interface DeactivateParentResult {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
}

export namespace ParentProfileService {
  /**
   * Retrieves the full profile for a specific parent.
   * Requires: parent.view_profile permission.
   */
  export async function getProfile(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentProfileResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.PARENT_VIEW_PROFILE
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const profile = await ParentRepository.getParentProfile(parentId);
    if (!profile) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { id: parentId }));
    }

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      status: profile.status,
      phone: profile.phone,
      nationality: profile.nationality,
      address: profile.address,
      facebook: profile.facebook,
      whatsapp: profile.whatsapp,
      twitter: profile.twitter,
      skype: profile.skype,
      defaultZoomLink: profile.defaultZoomLink,
      invoiceType: profile.invoiceType,
      feeAmount: profile.feeAmount,
      paymentMethod: profile.paymentMethod,
      currency: profile.currency,
      timezone: profile.timezone,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Returns the list of students associated with a parent.
   * Requires: student.view_associated permission.
   */
  export async function getAssociatedStudents(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<AssociatedStudentResult[]> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.STUDENT_VIEW_ASSOCIATED
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return ParentRepository.getAssociatedStudents(parentId);
  }

  /**
   * Deactivates a parent account by setting status to DEACTIVATED.
   * Requires: parent.manage_status permission.
   * Also invalidates all active sessions for the parent's userId.
   */
  export async function deactivateAccount(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<DeactivateParentResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.PARENT_MANAGE_STATUS
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const result = await ParentRepository.deactivateParent(parentId, undefined, locale);

    // Invalidate all active Redis sessions for this parent's user account
    // Import SessionRepository lazily to avoid circular dependency
    try {
      const { SessionRepository } = await import("@/backend/db/repo");
      await SessionRepository.invalidateSessionsForUser(result.userId);
    } catch (sessionError) {
      // Session invalidation failure is logged but does NOT roll back the deactivation
      const { logger } = await import("@/backend/lib/logger");
      logger.error("Failed to invalidate sessions after parent deactivation", {
        parentId,
        userId: result.userId,
        error: sessionError,
      });
    }

    return {
      id: result.id,
      userId: result.userId,
      status: result.status,
    };
  }
}
```

---

### Step 2: Create `backend/services/billing/billing-history.service.ts`

Check if `backend/services/billing/` directory exists — if not, create it.

```typescript
import { BillingRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ParentInvoiceHistoryRow {
  readonly id: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly status: string;
  readonly invoiceType: string;
  readonly studentId: string | null;
}

export namespace BillingHistoryService {
  /**
   * Retrieves the full invoice history for a specific parent.
   * Requires: billing.view_history permission.
   */
  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentInvoiceHistoryRow[]> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_VIEW_HISTORY
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return BillingRepository.getInvoicesForParent(parentId);
  }
}
```

---

### Step 3: Create `backend/services/parent/parent-document.service.ts`

```typescript
import { StorageDbRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ParentDocumentRow {
  readonly id: string;
  readonly fileId: string;
  readonly filePath: string;
  readonly isProtected: boolean;
  readonly usageType: string;
  readonly createdAt: Date;
}

export namespace ParentDocumentService {
  /**
   * Lists all documents linked to a parent record.
   * Requires: document.manage_parent_docs permission.
   */
  export async function getParentDocuments(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentDocumentRow[]> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.DOCUMENT_MANAGE_PARENT_DOCS
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return StorageDbRepository.getFilesForParent(parentId);
  }

  /**
   * Links an already-uploaded file to a parent's document record.
   * Requires: document.manage_parent_docs permission.
   * @param fileId - ID of a file that was previously uploaded via the signed-URL flow
   * @param usageType - e.g., "contract", "id_verification"
   */
  export async function linkDocumentToParent(
    actorUserId: string,
    parentId: string,
    fileId: string,
    usageType: string,
    locale?: string
  ): Promise<{ id: string; fileId: string; parentId: string; usageType: string; createdAt: Date }> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.DOCUMENT_MANAGE_PARENT_DOCS
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    if (!fileId || typeof fileId !== "string") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidFileId"));
    }

    return StorageDbRepository.linkFileToParent(parentId, fileId, usageType);
  }
}
```

---

### Step 4: Create `backend/services/student/student-management.service.ts`

Check if `backend/services/student/` directory exists — create it if not.

```typescript
import { StudentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface EditQuotaResult {
  readonly id: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly version: number;
}

export namespace StudentManagementService {
  /**
   * Directly overrides a student's classesRemaining quota.
   * Requires: student.edit_quota permission.
   *
   * Business Rules:
   * - newClassesRemaining must be >= 0 (also enforced by DB CHECK constraint)
   * - newClassesRemaining must be <= student.classesTotal (enforced here in service)
   * - Uses optimistic locking via version field
   */
  export async function editQuota(
    actorUserId: string,
    studentId: string,
    newClassesRemaining: number,
    expectedVersion?: number,
    locale?: string
  ): Promise<EditQuotaResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.STUDENT_EDIT_QUOTA
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    if (!Number.isInteger(newClassesRemaining) || newClassesRemaining < 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("quotaMustBeNonNegative"));
    }

    // Fetch current student to validate newValue <= classesTotal
    const current = await StudentRepository.findById(studentId);
    if (!current) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    if (newClassesRemaining > current.classesTotal) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("quotaExceedsTotal", {
          requested: newClassesRemaining,
          total: current.classesTotal,
        })
      );
    }

    const updated = await StudentRepository.setClassesRemaining(
      studentId,
      newClassesRemaining,
      expectedVersion,
      undefined,
      locale
    );

    return {
      id: updated.id,
      classesRemaining: updated.classesRemaining,
      classesTotal: updated.classesTotal,
      version: updated.version,
    };
  }
}
```

---

### Step 5: Verify `SessionRepository.invalidateSessionsForUser` exists

Before finalizing `ParentProfileService.deactivateAccount`, confirm this method exists in `backend/db/repo/session.repository.ts`. Run:

```bash
grep -n "invalidateSessionsForUser" backend/db/repo/session.repository.ts
```

If the method does NOT exist, add it to `session.repository.ts`:

```typescript
export const invalidateSessionsForUser = async (userId: string): Promise<void> => {
  // Deletes all session metadata records for the user (Redis TTL handles actual token expiry)
  await db.delete(sessionMetadata).where(eq(sessionMetadata.userId, userId));
};
```

---

## Test Execution Requirements

```bash
# Run full test suite — services are covered by GraphQL integration tests (Task G)
bun run test:db
bun tsgo
```

---

## Success Criteria / Check Progress Points

- [ ] `ParentProfileService.getProfile()` checks `PARENT_VIEW_PROFILE`, fetches via repo, throws if not found.
- [ ] `ParentProfileService.getAssociatedStudents()` checks `STUDENT_VIEW_ASSOCIATED`.
- [ ] `ParentProfileService.deactivateAccount()` checks `PARENT_MANAGE_STATUS`, calls `deactivateParent`, calls session invalidation.
- [ ] `BillingHistoryService.getParentInvoiceHistory()` checks `BILLING_VIEW_HISTORY`.
- [ ] `ParentDocumentService.getParentDocuments()` checks `DOCUMENT_MANAGE_PARENT_DOCS`.
- [ ] `ParentDocumentService.linkDocumentToParent()` checks `DOCUMENT_MANAGE_PARENT_DOCS` and validates `fileId`.
- [ ] `StudentManagementService.editQuota()` checks `STUDENT_EDIT_QUOTA`, validates `>= 0` and `<= classesTotal`.
- [ ] No service file imports from `drizzle-orm`, `backend/db/schema`, or `backend/db/index`.
- [ ] `bun tsgo` passes with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after each file
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after each file
- [ ] `bun lint` passes with 0 errors & 0 warnings after each file
- [ ] `bun codescene` passes with 0 errors & 0 warnings after each file
- [ ] Loop over tsgo, biome:check, lint, codescene until no issues at all

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after completing all steps
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun lint` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun codescene` passes with 0 errors & 0 warnings after completing all steps
- [ ] Loop over tsgo, biome:check, lint, codescene until no issues at all
