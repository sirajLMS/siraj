# Task B — Repositories: New Methods for Parent Profile, Billing History, Documents & Student Quota

**Objective:** Implement all missing repository methods required for this story across four repository files: `ParentRepository`, `BillingRepository`, `StorageDbRepository`, and `StudentRepository`.

**Dependencies:** Depends on Task A — the `AppPermission` enum values must exist in `shared/lib/enum.ts` (used by services in Task D; repos themselves don't use them, but this ensures build coherence).

**Layer-Specific Rules (Database Repositories — Flattened from backend/db/repo/AGENTS.md):**
- Use Drizzle standard query syntax `db.select().from(table).leftJoin()` for multi-table joins — avoid `db.query.tableName.findMany` with nested `with` for complex joins.
- Wrap all writes that modify multiple tables in `db.transaction()`.
- Use `type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]` for the transaction type.
- All error messages must use `getBackendTranslations({ locale, namespace: "errors" })` — no hardcoded strings.
- Export from the namespace using `export const methodName = async (...) => {...}` pattern.

**Target Files:**
- `backend/db/repo/parent.repository.ts` — Add `getParentProfile`, `deactivateParent`, `getAssociatedStudents`
- `backend/db/repo/billing.repository.ts` — Add `getInvoicesForParent`
- `backend/db/repo/storage.repository.ts` — Add `getFilesForParent`, `linkFileToParent`
- `backend/db/repo/student.repository.ts` — Add `setClassesRemaining`

---

## Detailed Implementation Steps

### Step 1: `ParentRepository.getParentProfile(parentId, tx?)`

Add to `backend/db/repo/parent.repository.ts`. This method joins `parents` with `users` to return the full profile data needed by the UI (name, email, avatarUrl, phone, nationality, address, social links, fee details, status, timezone).

```typescript
export type ParentProfileResult = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  twitter: string | null;
  skype: string | null;
  defaultZoomLink: string | null;
  invoiceType: string | null;
  feeAmount: string | null;
  paymentMethod: string | null;
  currency: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export const getParentProfile = async (
  parentId: string,
  tx?: DBTransaction
): Promise<ParentProfileResult | null> => {
  const queryDb = tx ?? db;

  const results = await queryDb
    .select({
      id: parents.id,
      userId: parents.userId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: parents.status,
      phone: parents.phone,
      nationality: parents.nationality,
      address: parents.address,
      facebook: parents.facebook,
      whatsapp: parents.whatsapp,
      twitter: parents.twitter,
      skype: parents.skype,
      defaultZoomLink: parents.defaultZoomLink,
      invoiceType: parents.invoiceType,
      feeAmount: parents.feeAmount,
      paymentMethod: parents.paymentMethod,
      currency: parents.currency,
      timezone: parents.timezone,
      createdAt: parents.createdAt,
      updatedAt: parents.updatedAt,
    })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(eq(parents.id, parentId))
    .limit(1);

  return results[0] ?? null;
};
```

### Step 2: `ParentRepository.deactivateParent(parentId, tx?)`

This method sets `status = 'DEACTIVATED'` and returns the updated parent record including the `userId` for session invalidation.

```typescript
export type DeactivatedParentResult = {
  id: string;
  userId: string;
  status: string;
  updatedAt: Date;
};

export const deactivateParent = async (
  parentId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<DeactivatedParentResult> => {
  const queryDb = tx ?? db;

  // Fetch current record first to confirm existence
  const existing = await queryDb
    .select({ id: parents.id, userId: parents.userId, status: parents.status })
    .from(parents)
    .where(eq(parents.id, parentId))
    .limit(1);

  if (existing.length === 0) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("parentNotFound", { id: parentId }));
  }

  const current = existing[0];
  if (current.status === "DEACTIVATED") {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("parentAlreadyDeactivated", { id: parentId }));
  }

  const [updated] = await queryDb
    .update(parents)
    .set({ status: "DEACTIVATED", updatedAt: new Date() })
    .where(eq(parents.id, parentId))
    .returning({
      id: parents.id,
      userId: parents.userId,
      status: parents.status,
      updatedAt: parents.updatedAt,
    });

  return updated;
};
```

### Step 3: `ParentRepository.getAssociatedStudents(parentId, tx?)`

Returns the full student list for a parent, including primary teacher name, hoursPerWeek, classesRemaining, classesTotal, status. This replaces the limited `getStudentsForParent` (which only returned `{ name }`).

```typescript
// Add import for teachers and teachers schema at top of file
// import { invoices, parents, students, teachers, users } from "@/backend/db/schema";

export type AssociatedStudentRow = {
  id: string;
  name: string;
  status: string;
  primaryTeacherId: string | null;
  teacherName: string | null;
  hoursPerWeek: string;
  classesRemaining: number;
  classesTotal: number;
  language: string | null;
  gender: string | null;
  updatedAt: Date;
};

export const getAssociatedStudents = async (
  parentId: string,
  tx?: DBTransaction
): Promise<AssociatedStudentRow[]> => {
  const queryDb = tx ?? db;

  const results = await queryDb
    .select({
      id: students.id,
      name: students.name,
      status: students.status,
      primaryTeacherId: students.primaryTeacherId,
      teacherName: users.name,
      hoursPerWeek: students.hoursPerWeek,
      classesRemaining: students.classesRemaining,
      classesTotal: students.classesTotal,
      language: students.language,
      gender: students.gender,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(students.parentId, parentId))
    .orderBy(students.name);

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    primaryTeacherId: r.primaryTeacherId,
    teacherName: r.teacherName ?? null,
    hoursPerWeek: r.hoursPerWeek,
    classesRemaining: r.classesRemaining,
    classesTotal: r.classesTotal,
    language: r.language ?? null,
    gender: r.gender ?? null,
    updatedAt: r.updatedAt,
  }));
};
```

**Note:** The `teachers` table reference requires adding `teachers` to the import from `@/backend/db/schema`. Verify the teachers schema has a `userId` column (confirmed in `backend/db/schema/teachers.ts` — referenced by `teacher.repository.ts`).

---

### Step 4: `BillingRepository.getInvoicesForParent(parentId, tx?)`

Add to `backend/db/repo/billing.repository.ts`. Returns all invoices for a specific parent ordered by `issueDate` descending.

```typescript
export type ParentInvoiceHistoryRow = {
  id: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  amount: string;
  currency: string;
  status: string;
  invoiceType: string;
  studentId: string | null;
};

export const getInvoicesForParent = async (
  parentId: string,
  tx?: DBTransaction
): Promise<ParentInvoiceHistoryRow[]> => {
  const queryDb = tx ?? db;

  const results = await queryDb
    .select({
      id: invoices.id,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      amount: invoices.amount,
      currency: invoices.currency,
      status: invoices.status,
      invoiceType: invoices.invoiceType,
      studentId: invoices.studentId,
    })
    .from(invoices)
    .where(and(eq(invoices.parentId, parentId), isNull(invoices.deletedAt)))
    .orderBy(desc(invoices.issueDate));

  return results.map((r) => ({
    id: r.id,
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    paidDate: r.paidDate ?? null,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    invoiceType: r.invoiceType,
    studentId: r.studentId ?? null,
  }));
};
```

**Note:** Must add `isNull` to the drizzle-orm import (`import { and, desc, eq, type SQL, sql, isNull } from "drizzle-orm";`).

---

### Step 5: `StorageDbRepository.getFilesForParent(parentId, tx?)`

Add to `backend/db/repo/storage.repository.ts`. Returns all storage files linked to a parent with their paths.

```typescript
export type ParentFileRow = {
  id: string;
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};

export const getFilesForParent = async (
  parentId: string,
  tx?: DBTransaction
): Promise<ParentFileRow[]> => {
  const queryDb = tx ?? db;

  const results = await queryDb
    .select({
      id: parentFiles.id,
      fileId: parentFiles.fileId,
      filePath: storageFiles.path,
      isProtected: storageFiles.isProtected,
      usageType: parentFiles.usageType,
      createdAt: parentFiles.createdAt,
    })
    .from(parentFiles)
    .innerJoin(storageFiles, eq(parentFiles.fileId, storageFiles.id))
    .where(eq(parentFiles.parentId, parentId))
    .orderBy(desc(parentFiles.createdAt));

  return results.map((r) => ({
    id: r.id,
    fileId: r.fileId,
    filePath: r.filePath,
    isProtected: r.isProtected,
    usageType: r.usageType,
    createdAt: r.createdAt,
  }));
};
```

**Note:** `parentFiles` is already imported from `@/backend/db/schema/storage` at line 8 of `storage.repository.ts`. `storageFiles` is also already imported. Add `desc` to the drizzle-orm import if not present.

---

### Step 6: `StorageDbRepository.linkFileToParent(parentId, fileId, usageType, tx?)`

```typescript
export const linkFileToParent = async (
  parentId: string,
  fileId: string,
  usageType: string,
  tx?: DBTransaction
): Promise<{ id: string; fileId: string; parentId: string; usageType: string; createdAt: Date }> => {
  const queryDb = tx ?? db;

  const [result] = await queryDb
    .insert(parentFiles)
    .values({
      fileId,
      parentId,
      usageType,
      createdAt: new Date(),
    })
    .returning({
      id: parentFiles.id,
      fileId: parentFiles.fileId,
      parentId: parentFiles.parentId,
      usageType: parentFiles.usageType,
      createdAt: parentFiles.createdAt,
    });

  return result;
};
```

---

### Step 7: `StudentRepository.setClassesRemaining(studentId, newClassesRemaining, expectedVersion?, tx?, locale?)`

Add to `backend/db/repo/student.repository.ts`. This is a **direct override** (not a delta), protected by optimistic locking via `version`. Uses advisory lock pattern consistent with existing `deductClasses`/`addClasses`.

```typescript
export const setClassesRemaining = async (
  studentId: string,
  newClassesRemaining: number,
  expectedVersion?: number,
  tx?: DBTransaction,
  locale?: string
): Promise<Types.StudentEntity> => {
  const runner = async (t: DBTransaction) => {
    // Acquire advisory lock to prevent concurrent modifications
    await t.execute(sql`SELECT pg_advisory_xact_lock(hashtext('student_' || ${studentId}::text))`);

    const results = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (results.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }
    const current = results[0];

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

    // newClassesRemaining >= 0 is enforced by DB CHECK constraint
    // newClassesRemaining <= classesTotal is validated in service layer (not repo)
    const [updated] = await t
      .update(students)
      .set({
        classesRemaining: newClassesRemaining,
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

## Test Execution Requirements

```bash
# Run the full database test suite to ensure no regressions
bun run test:db
```

---

## Success Criteria / Check Progress Points

- [ ] `ParentRepository.getParentProfile(parentId)` returns full profile data or `null`.
- [ ] `ParentRepository.deactivateParent(parentId)` sets status to `DEACTIVATED`, throws if already deactivated or not found.
- [ ] `ParentRepository.getAssociatedStudents(parentId)` returns students with teacher name, hoursPerWeek, classesRemaining.
- [ ] `BillingRepository.getInvoicesForParent(parentId)` returns full invoice history ordered by issueDate desc, filtering soft-deleted rows.
- [ ] `StorageDbRepository.getFilesForParent(parentId)` returns linked files with path.
- [ ] `StorageDbRepository.linkFileToParent(parentId, fileId, usageType)` inserts a `parent_files` record.
- [ ] `StudentRepository.setClassesRemaining(studentId, newValue)` updates `classesRemaining` directly, increments `version`, uses advisory lock.
- [ ] `bun run test:db` passes with 0 failures.
- [ ] No TypeScript errors in any modified repository file.

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
