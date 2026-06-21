### Task D — Services: BillingManagementService, StudentLifecycleService, NotificationSyncService

**Objective:** Implement three new domain services:
1. `BillingManagementService` — orchestrates `createManualInvoice`, `markInvoicePaid`, `deleteInvoice` with permission checks and notification sync
2. `StudentLifecycleService` — orchestrates `reassignTeacher` and `changeStudentStatus` with permission checks and pre-validation
3. `NotificationSyncService` — refreshes the unpaid invoices notification summary after billing mutations

**Dependencies:** Depends on Task B — `BillingRepository.deleteInvoice()`, `BillingRepository.markInvoiceAsPaid()`, `StudentRepository.reassignTeacher()`, `StudentRepository.changeStatus()` are implemented and tested.

**Layer-Specific Rules (Services — Flattened from `backend/services/AGENTS.md`):**
- **🚫 Services MUST NOT import from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle module.** Services may ONLY depend on `backend/db/repo/`.
- All orchestration, validation, and permission checks reside in services.
- Use `PermissionsService.hasPermission()` for permission checks — throw localized error on denial.
- Use `getBackendTranslations()` for all error messages — no hardcoded strings.
- Use `import { logger } from '@/backend/lib/logger'` for logging — never `console.*`.
- Services must be SSR-compatible — no `@apollo/client` or browser-only APIs.
- Domain-driven: each service is scoped to its domain. No monolithic service files.

**Target Files:**
- `backend/services/billing/billing-management.service.ts` — NEW file
- `backend/services/student/student-lifecycle.service.ts` — NEW file
- `backend/services/system/notification-sync.service.ts` — NEW file (create `system/` directory if needed)

---

#### Step 1: Create `backend/services/billing/billing-management.service.ts`

This service handles manual invoice creation, paid marking, and deletion with full permission gating and notification sync.

```typescript
// backend/services/billing/billing-management.service.ts

import { BillingRepository } from "@/backend/db/repo/billing.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { NotificationSyncService } from "@/backend/services/system/notification-sync.service";
import { AppPermission } from "@/shared/lib/enum";

export interface CreateManualInvoiceInput {
  readonly parentId: string;
  readonly studentId?: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly invoiceType: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly exchangeRateSnapshot?: string | null;
  readonly exchangeRateSource?: string | null;
}

export interface ManualInvoiceResult {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly status: string;
  readonly invoiceType: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly version: number;
  readonly createdAt: Date;
}

export interface MarkInvoicePaidResult {
  readonly invoice: {
    readonly id: string;
    readonly parentId: string;
    readonly status: string;
    readonly paidDate: string | null;
    readonly version: number;
  };
  readonly notificationSummaryUpdated: boolean;
}

export interface DeleteInvoiceResult {
  readonly invoice: {
    readonly id: string;
    readonly parentId: string;
    readonly deletedAt: string | null;
    readonly version: number;
  };
  readonly notificationSummaryUpdated: boolean;
}

export namespace BillingManagementService {
  /**
   * Creates a manual invoice outside the automated renewal cycle.
   * Requires: billing.create_invoice permission.
   *
   * Business Rules:
   * - Invoice is created with status = 'UNPAID' by default
   * - Exchange rate snapshot is resolved automatically if currency !== 'USD'
   * - Idempotency is not enforced here (handled at mutation input level if needed)
   */
  export async function createManualInvoice(
    actorUserId: string,
    input: CreateManualInvoiceInput,
    locale?: string
  ): Promise<ManualInvoiceResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_CREATE_INVOICE
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    if (!input.parentId || input.parentId.trim().length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidParentId"));
    }

    const amountNum = Number.parseFloat(input.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidInvoiceAmount"));
    }

    try {
      const created = await BillingRepository.createInvoice(
        {
          parentId: input.parentId,
          studentId: input.studentId ?? null,
          amount: input.amount,
          currency: input.currency,
          status: "UNPAID",
          invoiceType: input.invoiceType,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          exchangeRateSnapshot: input.exchangeRateSnapshot ?? null,
          exchangeRateSource: input.exchangeRateSource ?? null,
        },
        undefined,
        locale
      );

      logger.info("Manual invoice created", {
        actorUserId,
        invoiceId: created.id,
        parentId: created.parentId,
        amount: created.amount,
        currency: created.currency,
      });

      return {
        id: created.id,
        parentId: created.parentId,
        studentId: created.studentId ?? null,
        amount: created.amount,
        currency: created.currency,
        status: created.status,
        invoiceType: created.invoiceType,
        issueDate: created.issueDate,
        dueDate: created.dueDate,
        paidDate: created.paidDate ?? null,
        version: created.version,
        createdAt: created.createdAt,
      };
    } catch (error) {
      logger.error("Failed to create manual invoice", { actorUserId, input, error });
      throw error;
    }
  }

  /**
   * Marks an UNPAID invoice as PAID with the current server timestamp as paidDate.
   * Requires: billing.update_status_paid permission.
   * Acquires advisory lock — safe against concurrent settlement.
   * Syncs notification tray after successful payment (non-blocking).
   */
  export async function markInvoicePaid(
    actorUserId: string,
    invoiceId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<MarkInvoicePaidResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_UPDATE_STATUS_PAID
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const updated = await BillingRepository.markInvoiceAsPaid(invoiceId, expectedVersion, undefined, locale);

      logger.info("Invoice marked as paid", {
        actorUserId,
        invoiceId: updated.id,
        parentId: updated.parentId,
        paidDate: updated.paidDate,
      });

      // Sync notification tray after billing update — non-blocking, non-throwing
      const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale).catch(
        err => {
          logger.error("Notification sync failed after markInvoicePaid", {
            invoiceId,
            err,
          });
          return null;
        }
      );

      return {
        invoice: {
          id: updated.id,
          parentId: updated.parentId,
          status: updated.status,
          paidDate: updated.paidDate ?? null,
          version: updated.version,
        },
        notificationSummaryUpdated: syncResult !== null,
      };
    } catch (error) {
      logger.error("Failed to mark invoice as paid", { actorUserId, invoiceId, error });
      throw error;
    }
  }

  /**
   * Soft-deletes an invoice (sets deletedAt = now()).
   * Requires: billing.delete_invoice permission.
   * Acquires advisory lock — safe against concurrent modification.
   * Syncs notification tray after successful deletion (non-blocking).
   */
  export async function deleteInvoice(
    actorUserId: string,
    invoiceId: string,
    locale?: string
  ): Promise<DeleteInvoiceResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_DELETE_INVOICE
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const deleted = await BillingRepository.deleteInvoice(invoiceId, undefined, locale);

      logger.info("Invoice deleted", {
        actorUserId,
        invoiceId: deleted.id,
        parentId: deleted.parentId,
        deletedAt: deleted.deletedAt,
      });

      // Sync notification tray — non-blocking, non-throwing
      const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale).catch(
        err => {
          logger.error("Notification sync failed after deleteInvoice", { invoiceId, err });
          return null;
        }
      );

      return {
        invoice: {
          id: deleted.id,
          parentId: deleted.parentId,
          deletedAt: deleted.deletedAt ?? null,
          version: deleted.version,
        },
        notificationSummaryUpdated: syncResult !== null,
      };
    } catch (error) {
      logger.error("Failed to delete invoice", { actorUserId, invoiceId, error });
      throw error;
    }
  }
}
```

---

#### Step 2: Create `backend/services/student/student-lifecycle.service.ts`

```typescript
// backend/services/student/student-lifecycle.service.ts

import { StudentRepository } from "@/backend/db/repo/student.repository";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ReassignTeacherResult {
  readonly id: string;
  readonly primaryTeacherId: string | null;
  readonly version: number;
}

export interface ChangeStudentStatusResult {
  readonly id: string;
  readonly status: string;
  readonly version: number;
}

/**
 * Allowed student status transitions matching the DB trigger fn_enforce_student_status_transition.
 * Service pre-validates before calling the repo to provide a clear business error message.
 */
const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  ON_TRIAL: ["REGULAR", "DEACTIVATED"],
  REGULAR: ["SUSPENDED", "ON_LEAVE", "DEACTIVATED", "GRADUATED"],
  SUSPENDED: ["REGULAR", "DEACTIVATED"],
  ON_LEAVE: ["REGULAR", "DEACTIVATED"],
  DEACTIVATED: ["REGULAR"],
  GRADUATED: [], // Terminal state — no transitions allowed
};

export namespace StudentLifecycleService {
  /**
   * Reassigns a student's primary teacher.
   * Requires: student.reassign_teacher permission.
   *
   * Business Rules:
   * - Target teacher must exist (validated via TeacherRepository)
   * - Uses optimistic locking via version field
   */
  export async function reassignTeacher(
    actorUserId: string,
    studentId: string,
    newTeacherId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<ReassignTeacherResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.STUDENT_REASSIGN_TEACHER
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    // Validate target teacher exists
    const teacher = await TeacherRepository.findById(newTeacherId);
    if (!teacher) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: newTeacherId }));
    }

    // Validate student exists before reassignment
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    try {
      const updated = await StudentRepository.reassignTeacher(
        studentId,
        newTeacherId,
        expectedVersion,
        undefined,
        locale
      );

      logger.info("Student teacher reassigned", {
        actorUserId,
        studentId,
        previousTeacherId: student.primaryTeacherId,
        newTeacherId,
      });

      return {
        id: updated.id,
        primaryTeacherId: updated.primaryTeacherId ?? null,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to reassign student teacher", {
        actorUserId,
        studentId,
        newTeacherId,
        error,
      });
      throw error;
    }
  }

  /**
   * Changes a student's enrollment status.
   * Requires: student.manage_status permission.
   *
   * Business Rules:
   * - Pre-validates the transition using ALLOWED_STATUS_TRANSITIONS map
   * - DB trigger fn_enforce_student_status_transition acts as final safety net
   * - Cascading effects on scheduling are out of scope for this story
   */
  export async function changeStudentStatus(
    actorUserId: string,
    studentId: string,
    newStatus: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<ChangeStudentStatusResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.STUDENT_MANAGE_STATUS
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    // Fetch current student to validate transition
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    const currentStatus = student.status;
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTargets.includes(newStatus)) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("invalidStatusTransition", {
          currentStatus,
          newStatus,
        })
      );
    }

    try {
      const updated = await StudentRepository.changeStatus(
        studentId,
        newStatus,
        expectedVersion,
        undefined,
        locale
      );

      logger.info("Student status changed", {
        actorUserId,
        studentId,
        previousStatus: currentStatus,
        newStatus: updated.status,
      });

      return {
        id: updated.id,
        status: updated.status,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to change student status", {
        actorUserId,
        studentId,
        newStatus,
        error,
      });
      throw error;
    }
  }
}
```

---

#### Step 3: Create `backend/services/system/notification-sync.service.ts`

First, create the `backend/services/system/` directory if it does not already exist.

```typescript
// backend/services/system/notification-sync.service.ts

import { BillingRepository } from "@/backend/db/repo/billing.repository";
import { logger } from "@/backend/lib/logger";
import type * as Types from "@/backend/types";

export namespace NotificationSyncService {
  /**
   * Re-evaluates the global unpaid invoices summary.
   * Called after billing mutations (markInvoicePaid, deleteInvoice) to refresh
   * the notification tray. Returns updated summary.
   *
   * NOTE: This method must NOT be called inside a billing transaction.
   * It is a read-only summary refresh that runs AFTER the commit.
   *
   * IMPORTANT: Callers should catch errors from this method and log them
   * without re-throwing — notification sync failure must not mask billing success.
   *
   * @param locale - Locale for any localized error messages
   * @returns Updated UnpaidInvoicesSummary
   */
  export async function syncUnpaidNotifications(locale?: string): Promise<Types.UnpaidInvoicesSummaryResult> {
    try {
      const summary = await BillingRepository.getUnpaidInvoicesSummary();
      logger.info("Notification tray synced after billing mutation", {
        totalOverdueInvoices: summary.totalOverdueInvoices,
        totalOverdueAmount: summary.totalOverdueAmount,
      });
      return summary;
    } catch (error) {
      logger.error("Failed to sync notification tray", { locale, error });
      throw error; // Caller is responsible for catch + non-rethrow pattern
    }
  }
}
```

---

#### Step 4: Verify `TeacherRepository.findById()` Exists

The `StudentLifecycleService.reassignTeacher()` calls `TeacherRepository.findById(newTeacherId)`. Verify this method exists:

```bash
grep -n "findById" backend/db/repo/teacher.repository.ts
```

If `TeacherRepository.findById()` does not exist, add a minimal implementation to `backend/db/repo/teacher.repository.ts`:

```typescript
// Add to TeacherRepository namespace if not already present:
export const findById = async (id: string): Promise<Types.TeacherEntity | null | undefined> => {
  return await db.query.teachers.findFirst({
    where: { id: id },
  });
};
```

After adding, run `bun tsgo` to confirm compilation.

---

**Test Execution Requirements:**
```bash
bun run test:db
bun tsgo
```

---

**Success Criteria / Check Progress Points:**
- [ ] `backend/services/billing/billing-management.service.ts` created with `createManualInvoice`, `markInvoicePaid`, `deleteInvoice` methods
- [ ] `backend/services/student/student-lifecycle.service.ts` created with `reassignTeacher`, `changeStudentStatus` methods
- [ ] `backend/services/system/notification-sync.service.ts` created with `syncUnpaidNotifications` method
- [ ] All services import ONLY from `backend/db/repo/`, `backend/lib/`, `backend/services/auth/`, `shared/lib/enum` — zero Drizzle/DB schema imports
- [ ] `ALLOWED_STATUS_TRANSITIONS` map in `StudentLifecycleService` matches the DB trigger logic exactly
- [ ] `NotificationSyncService.syncUnpaidNotifications()` does NOT participate in billing transactions
- [ ] `BillingManagementService.markInvoicePaid()` and `deleteInvoice()` call `NotificationSyncService.syncUnpaidNotifications()` in a `.catch()` non-throwing pattern
- [ ] All permission checks use `PermissionsService.hasPermission()` with correct `AppPermission` enum values
- [ ] All error messages use `getBackendTranslations()` — no hardcoded strings
- [ ] `logger.info` and `logger.error` used — no `console.*` calls
- [ ] `bun tsgo` passes with 0 TypeScript errors on all 3 new service files
- [ ] `bun run test:db` passes with 0 failures (no regressions)

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
