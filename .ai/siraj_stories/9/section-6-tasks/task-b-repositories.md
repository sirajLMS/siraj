### Task B — Repositories: Billing Delete/MarkPaid & Student Reassign/ManageStatus

**Objective:** Add 4 new repository methods:
1. `BillingRepository.deleteInvoice()` — soft-delete an invoice by setting `deletedAt = now()`
2. `BillingRepository.markInvoiceAsPaid()` — convenience wrapper around existing `updateInvoiceStatus` for the PAID transition, enforcing the UNPAID guard inside the transaction
3. `StudentRepository.reassignTeacher()` — update a student's `primaryTeacherId`
4. `StudentRepository.changeStatus()` — update a student's `status`, letting the DB trigger enforce valid transitions

**Dependencies:** Depends on Task A — `AppPermission.BILLING_CREATE_INVOICE`, `AppPermission.BILLING_UPDATE_STATUS_PAID`, `AppPermission.BILLING_DELETE_INVOICE`, `AppPermission.STUDENT_REASSIGN_TEACHER`, `AppPermission.STUDENT_MANAGE_STATUS`, `AppPermission.SYSTEM_SYNC_NOTIFICATIONS` enum values are now available. No new schema columns required — operations target existing `invoices.deletedAt`, `invoices.status`, `invoices.paidDate`, `students.primaryTeacherId`, `students.status`.

**Layer-Specific Rules (Database Repositories — Flattened from `backend/db/repo/AGENTS.md`):**
- Use Drizzle standard syntax `db.select().from(table).where()` for single-row lookups — NOT relational `findMany` with nested `with`.
- Wrap all operations that modify multiple columns atomically in `db.transaction()`.
- Advisory locks (`pg_advisory_xact_lock`) must be used for invoice operations to prevent concurrent modification — use the existing `acquireInvoiceLock` pattern already present in `billing.repository.ts`.
- Repository methods MUST NOT import from `backend/services/` — no circular dependency.
- Repository methods receive locale as an optional parameter for localized error messages via `getBackendTranslations`.
- All not-found conditions must throw localized errors, not return null.

**Target Files:**
- `backend/db/repo/billing.repository.ts` — Add `deleteInvoice()` and `markInvoiceAsPaid()` methods
- `backend/db/repo/student.repository.ts` — Add `reassignTeacher()` and `changeStatus()` methods

---

#### Step 1: Add `BillingRepository.deleteInvoice()` to `billing.repository.ts`

This method performs a **soft-delete** by setting `deletedAt = now()` on the target invoice. It acquires an advisory lock, verifies the invoice exists and is not already soft-deleted, then writes `deletedAt`.

Add the following method to the `BillingRepository` namespace in `backend/db/repo/billing.repository.ts`, after the existing `getInvoicesForParent` method:

```typescript
/**
 * Soft-deletes an invoice by setting deletedAt = now().
 * Uses advisory lock to prevent concurrent modification.
 * Throws if the invoice is not found or already deleted.
 *
 * @param invoiceId - UUID of the invoice to delete
 * @param tx - Optional existing transaction
 * @param locale - Locale for localized error messages
 * @returns The soft-deleted invoice record
 */
export const deleteInvoice = async (
  invoiceId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<Types.InvoiceSelectType> => {
  const runner = async (t: DBTransaction) => {
    await acquireInvoiceLock(t, invoiceId);

    const existing = await t
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invoiceNotFound", { id: invoiceId }));
    }

    const now = new Date();
    const [deleted] = await t
      .update(invoices)
      .set({
        deletedAt: now.toISOString(),
        updatedAt: now,
        version: sql`${invoices.version} + 1`,
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return deleted;
  };

  return tx ? runner(tx) : db.transaction(runner);
};
```

**Important:** The `invoices.deletedAt` column type is verified as a date string column (matching the existing `getInvoicesForParent` filter `isNull(invoices.deletedAt)`). Use `.toISOString()` to match the column's string format.

---

#### Step 2: Add `BillingRepository.markInvoiceAsPaid()` to `billing.repository.ts`

This is a focused wrapper around `updateInvoiceStatus` that enforces the UNPAID guard. The advisory lock is already acquired inside `updateInvoiceStatus` → `acquireInvoiceLock`, so no double-locking is needed. However, the UNPAID check must happen **after** the lock is acquired (inside the transaction) to prevent TOCTOU.

Add this method after `deleteInvoice`:

```typescript
/**
 * Marks an UNPAID invoice as PAID, injecting paidDate = now().
 * Acquires advisory lock to prevent concurrent settlement.
 * Throws billing.invoiceAlreadyPaid if invoice status !== 'UNPAID'.
 * Throws invoiceNotFound if invoice does not exist or is soft-deleted.
 *
 * @param invoiceId - UUID of the invoice to mark as paid
 * @param expectedVersion - Optional optimistic lock version
 * @param tx - Optional existing transaction
 * @param locale - Locale for localized error messages
 * @returns The updated invoice record with status = 'PAID'
 */
export const markInvoiceAsPaid = async (
  invoiceId: string,
  expectedVersion?: number,
  tx?: DBTransaction,
  locale?: string
): Promise<Types.InvoiceSelectType> => {
  const runner = async (t: DBTransaction) => {
    await acquireInvoiceLock(t, invoiceId);

    // Re-fetch AFTER lock to prevent TOCTOU
    const existing = await t
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invoiceNotFound", { id: invoiceId }));
    }

    const current = existing[0];

    if (current.status !== "UNPAID") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invoiceAlreadyPaid", { id: invoiceId, status: current.status }));
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("invoiceVersionMismatch", {
          id: invoiceId,
          expectedVersion,
          gotVersion: current.version,
        })
      );
    }

    const paidDate = new Date();
    const [updated] = await t
      .update(invoices)
      .set({
        status: "PAID",
        paidDate: paidDate.toISOString().split("T")[0],
        version: sql`${invoices.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return updated;
  };

  return tx ? runner(tx) : db.transaction(runner);
};
```

---

#### Step 3: Add `StudentRepository.reassignTeacher()` to `student.repository.ts`

This method updates a student's `primaryTeacherId`. It uses the existing advisory lock pattern and optimistic versioning.

Add the following method to the `StudentRepository` namespace in `backend/db/repo/student.repository.ts`, after the existing `setClassesRemaining` method:

```typescript
/**
 * Reassigns a student's primary teacher to the specified teacherId.
 * Uses advisory lock to prevent concurrent modification.
 * Throws if student is not found.
 * NOTE: Teacher existence validation is delegated to the service layer.
 *
 * @param studentId - UUID of the student to update
 * @param newTeacherId - UUID of the new teacher (must be verified active by service)
 * @param expectedVersion - Optional optimistic lock version
 * @param tx - Optional existing transaction
 * @param locale - Locale for localized error messages
 * @returns The updated student entity
 */
export const reassignTeacher = async (
  studentId: string,
  newTeacherId: string,
  expectedVersion?: number,
  tx?: DBTransaction,
  locale?: string
): Promise<Types.StudentEntity> => {
  const runner = async (t: DBTransaction) => {
    await acquireStudentLock(t, studentId);

    const existing = await t
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (existing.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    const current = existing[0];

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("studentVersionMismatch", {
          id: studentId,
          expectedVersion,
          gotVersion: current.version,
        })
      );
    }

    const [updated] = await t
      .update(students)
      .set({
        primaryTeacherId: newTeacherId,
        version: sql`${students.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    return updated;
  };

  return tx ? runner(tx) : db.transaction(runner);
};
```

---

#### Step 4: Add `StudentRepository.changeStatus()` to `student.repository.ts`

This method updates a student's `status`. The DB trigger `fn_enforce_student_status_transition` (BEFORE UPDATE on students) will enforce valid transitions at the database level as the final safety net. The service layer pre-validates transitions before calling this method.

Add after `reassignTeacher`:

```typescript
/**
 * Changes a student's enrollment status.
 * The DB trigger fn_enforce_student_status_transition enforces valid transitions.
 * Service layer must pre-validate the transition before calling this method.
 * Uses advisory lock to prevent concurrent modification.
 * Throws if student is not found or DB trigger rejects the transition.
 *
 * @param studentId - UUID of the student to update
 * @param newStatus - Target enrollment status string
 * @param expectedVersion - Optional optimistic lock version
 * @param tx - Optional existing transaction
 * @param locale - Locale for localized error messages
 * @returns The updated student entity
 */
export const changeStatus = async (
  studentId: string,
  newStatus: string,
  expectedVersion?: number,
  tx?: DBTransaction,
  locale?: string
): Promise<Types.StudentEntity> => {
  const runner = async (t: DBTransaction) => {
    await acquireStudentLock(t, studentId);

    const existing = await t
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (existing.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    const current = existing[0];

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("studentVersionMismatch", {
          id: studentId,
          expectedVersion,
          gotVersion: current.version,
        })
      );
    }

    // DB trigger fn_enforce_student_status_transition will reject invalid transitions
    // Service layer must pre-validate before calling this method
    const [updated] = await t
      .update(students)
      .set({
        status: newStatus as Types.StudentEntity["status"],
        version: sql`${students.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    return updated;
  };

  return tx ? runner(tx) : db.transaction(runner);
};
```

---

#### Step 5: Verify `BillingRepository` Index Export

Open `backend/db/repo/index.ts` and verify that `BillingRepository` and `StudentRepository` are already exported. They should be since they existed before this task. If `deleteInvoice` and `markInvoiceAsPaid` are added to the namespace, they are automatically available via the existing export.

If `index.ts` uses named re-exports like `export { BillingRepository } from "./billing.repository"`, no changes are needed. Verify:

```bash
grep -n "BillingRepository\|StudentRepository" backend/db/repo/index.ts
```

Expected output: both repositories are exported.

---

**Test Execution Requirements:**
```bash
bun run test:db
```
All database tests must pass with 0 failures.

---

**Success Criteria / Check Progress Points:**
- [ ] `BillingRepository.deleteInvoice(invoiceId, tx?, locale?)` is implemented with advisory lock, soft-delete via `deletedAt`, and not-found guard
- [ ] `BillingRepository.markInvoiceAsPaid(invoiceId, expectedVersion?, tx?, locale?)` is implemented with advisory lock, UNPAID status guard (post-lock re-fetch), and version check
- [ ] `StudentRepository.reassignTeacher(studentId, newTeacherId, expectedVersion?, tx?, locale?)` is implemented with advisory lock, not-found guard, and version check
- [ ] `StudentRepository.changeStatus(studentId, newStatus, expectedVersion?, tx?, locale?)` is implemented with advisory lock, not-found guard, version check, and DB trigger as final guard
- [ ] No `any` types or blind casts in new methods
- [ ] No imports from `backend/services/` in repository files
- [ ] `bun run test:db` passes with 0 failures (no regressions)
- [ ] TypeScript compilation passes with 0 errors on both modified files

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
