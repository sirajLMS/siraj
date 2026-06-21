## Section 4: Security Threat Remediation

See [Section 3](./section-3-state-machine.md) for state machine diagrams and [Section 5](./section-5-prerequisites.md) for prerequisite verification.

---

### Threat 1: Double-Settlement / Race Condition on Invoice Payment

**Risk:** Two concurrent admin sessions simultaneously executing `markInvoicePaid` on the same invoice could result in duplicate `paidDate` writes or a corrupted `version` counter, violating the immutability contract of paid invoices.

**Current State:** `BillingRepository.updateInvoiceStatus` already uses `pg_advisory_xact_lock(hashtext('invoice_' || invoiceId))` — this is verified at `backend/db/repo/billing.repository.ts:26-28`. However, the new `markInvoicePaid` service path must validate `invoice.status === "UNPAID"` **inside the locked transaction** (after acquiring the lock but before writing) to prevent TOCTOU (Time-of-Check Time-of-Use) vulnerabilities.

**Fix in `BillingManagementService.markInvoicePaid()`:**
1. Acquire advisory lock via the existing `BillingRepository.updateInvoiceStatus` path (which calls `acquireInvoiceLock` internally).
2. Inside the transaction, re-fetch the invoice status after lock acquisition.
3. If `invoice.status !== "UNPAID"`, throw a localized `billing.invoiceAlreadyPaid` error — do NOT proceed with the update.
4. Return the updated invoice with `status = "PAID"` and `paidDate = now()`.

**Test Requirements:**
- Concurrent payment of same invoice → second call receives `billing.invoiceAlreadyPaid` error ✅
- Payment of PAID invoice → `billing.invoiceAlreadyPaid` error ✅
- Payment of UNPAID invoice by authorized admin → succeeds, `status = "PAID"`, `paidDate` populated ✅
- Payment attempt by unauthorized user → `insufficientPermissions` error ✅

---

### Threat 2: IDOR on Invoice Operations (Cross-Parent Access)

**Risk:** An admin could theoretically pass any `invoiceId` to `markInvoicePaid` or `deleteInvoice`, including an invoice belonging to a parent they should not access. Although all Academy Admins have full access, the system must not expose raw DB IDs in a way that enables enumeration attacks.

**Current State:** Invoice IDs are UUIDs (v4 via `gen_random_uuid()`), making enumeration infeasible. Service layer verifies permission via `PermissionsService.hasPermission()` before any data access.

**Fix:** Service methods verify `BILLING_UPDATE_STATUS_PAID` / `BILLING_DELETE_INVOICE` before fetching the invoice. No further ownership check is required — Academy Admins have any-scoped access to billing operations. The UUID format prevents guessable enumeration.

**Test Requirements:**
- Unauthorized user (no `billing.update_status_paid`) calling `markInvoicePaid` → `insufficientPermissions` error ✅
- Unauthorized user (no `billing.delete_invoice`) calling `deleteInvoice` → `insufficientPermissions` error ✅
- Non-existent invoice ID → `invoiceNotFound` error ✅
- Already soft-deleted invoice → `invoiceNotFound` error (soft-delete check must be in `deleteInvoice` repo method) ✅

---

### Threat 3: Student Status Transition Bypass

**Risk:** A caller could attempt to bypass the DB trigger by directly updating student status to an invalid target (e.g., `GRADUATED → REGULAR`). The DB trigger `fn_enforce_student_status_transition` must be the final enforcement line.

**Current State:** `backend/db/migration/student_status_transition_trigger.sql` defines the trigger `trg_enforce_student_status_transition` (BEFORE UPDATE on `students`). The existing `StudentRepository.partiallyUpdate()` method writes any status value without pre-validation.

**Fix in `StudentLifecycleService.changeStudentStatus()`:**
1. Verify `student.manage_status` permission first.
2. Fetch current student to determine current status.
3. Build an allowed-transitions map in the service (matches the DB trigger logic) and validate the target status before calling the repo — returning a clear business error message if invalid, rather than letting the DB throw a raw Postgres exception.
4. Call `StudentRepository.partiallyUpdate()` — the DB trigger serves as the final safety net.

**Allowed Transitions (service-side pre-validation, matching trigger):**
```
ON_TRIAL    → REGULAR, DEACTIVATED
REGULAR     → SUSPENDED, ON_LEAVE, DEACTIVATED, GRADUATED
SUSPENDED   → REGULAR, DEACTIVATED
ON_LEAVE    → REGULAR, DEACTIVATED
DEACTIVATED → REGULAR
GRADUATED   → (none — terminal)
```

**Test Requirements:**
- Valid transition `REGULAR → SUSPENDED` → succeeds ✅
- Valid transition `SUSPENDED → REGULAR` → succeeds ✅
- Invalid transition `GRADUATED → REGULAR` → `invalidStatusTransition` error (service-level) ✅
- Invalid transition `ON_LEAVE → GRADUATED` → `invalidStatusTransition` error ✅
- Unauthorized user (no `student.manage_status`) → `insufficientPermissions` error ✅
- Non-existent student → `studentNotFound` error ✅

---

### Threat 4: Teacher Reassignment to Non-Active Teacher

**Risk:** An admin could reassign a student to a deactivated, deleted, or non-existent teacher ID, corrupting the student-teacher relational integrity.

**Current State:** `StudentRepository.partiallyUpdate()` does not validate that `primaryTeacherId` references an active teacher.

**Fix in `StudentLifecycleService.reassignTeacher()`:**
1. Verify `student.reassign_teacher` permission.
2. Validate that the target `teacherId` exists and belongs to an active user via `TeacherRepository.findById()` (or equivalent).
3. Only then call `StudentRepository.partiallyUpdate({ id: studentId, primaryTeacherId: teacherId })`.

**Test Requirements:**
- Reassignment to valid active teacher → succeeds, student's `primaryTeacherId` updated ✅
- Reassignment to non-existent teacher ID → `teacherNotFound` error ✅
- Unauthorized user (no `student.reassign_teacher`) → `insufficientPermissions` error ✅
- Non-existent student → `studentNotFound` error ✅

---

### Threat 5: Notification Sync Failure Masking Billing Success

**Risk:** If `NotificationSyncService.syncUnpaidNotifications()` throws an exception after a successful `markInvoicePaid` or `deleteInvoice`, the entire mutation transaction could roll back, causing the billing record to appear un-updated even though the admin intended to settle it.

**Fix:** `NotificationSyncService.syncUnpaidNotifications()` must be called **outside** the billing repository transaction — it is a read-only summary refresh and should not participate in the invoice write transaction. If sync fails, it logs the error but does NOT throw — the billing mutation has already committed successfully.

**Implementation:**
```typescript
// In BillingManagementService.markInvoicePaid():
const updatedInvoice = await BillingRepository.updateInvoiceStatus(invoiceId, "PAID", new Date(), ...);
// Sync notifications after commit — non-throwing
const notificationSummary = await NotificationSyncService.syncUnpaidNotifications(locale).catch(err => {
  logger.error("Notification sync failed after markInvoicePaid", { invoiceId, err });
  return null;
});
return { invoice: updatedInvoice, notificationSummary };
```

**Test Requirements:**
- Sync service failure after successful markInvoicePaid → invoice is still PAID, sync error is logged but NOT re-thrown ✅
- Sync service succeeds → returns updated `UnpaidInvoicesSummary` alongside invoice ✅
