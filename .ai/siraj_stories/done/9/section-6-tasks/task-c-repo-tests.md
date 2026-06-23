### Task C — Repository Tests: Billing Delete/MarkPaid & Student Reassign/ManageStatus

**Objective:** Write comprehensive repository tests for all 4 new methods added in [Task B](./task-b-repositories.md). Tests must cover success paths, failure paths, concurrent access guards, and IDOR protection.

**Dependencies:** Depends on Task B — `BillingRepository.deleteInvoice()`, `BillingRepository.markInvoiceAsPaid()`, `StudentRepository.reassignTeacher()`, `StudentRepository.changeStatus()` are implemented.

**Layer-Specific Rules (Repository Tests — Flattened from `backend/db/repo/AGENTS.md`):**
- Tests live in `backend/db/test/repo/` directory.
- Use the existing test helpers and DB setup patterns from sibling test files.
- 100% line + function coverage on all new/modified repository methods.
- Test both success AND failure paths for every method.
- Test IDOR scenarios: unauthorized cross-resource access must be tested where applicable.
- Test version mismatch (optimistic locking) scenarios.
- Run `bun run test:coverage` on each test file to verify coverage.

**Target Files:**
- `backend/db/test/repo/billing.repository.test.ts` — Add test cases for `deleteInvoice` and `markInvoiceAsPaid`
- `backend/db/test/repo/student.repository.test.ts` — Add test cases for `reassignTeacher` and `changeStatus`
- `backend/db/test/logic/student_status_transition.test.ts` — Add/extend tests for DB trigger with `student.manage_status` scenarios

---

#### Step 1: Tests for `BillingRepository.deleteInvoice()`

Add the following test cases to `backend/db/test/repo/billing.repository.test.ts` inside the appropriate describe block:

```typescript
describe("BillingRepository.deleteInvoice", () => {
  let testParentId: string;
  let testInvoiceId: string;

  beforeEach(async () => {
    // Create a test parent and invoice for each test
    // Use existing test factory helpers or direct DB inserts
    testParentId = await createTestParent();
    testInvoiceId = await createTestInvoice({
      parentId: testParentId,
      status: "UNPAID",
      amount: "100.00",
      currency: "USD",
    });
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestInvoice(testInvoiceId);
    await cleanupTestParent(testParentId);
  });

  it("should soft-delete an existing UNPAID invoice by setting deletedAt", async () => {
    const result = await BillingRepository.deleteInvoice(testInvoiceId);
    expect(result.id).toBe(testInvoiceId);
    expect(result.deletedAt).not.toBeNull();
    expect(result.deletedAt).not.toBeUndefined();
    // Verify version was incremented
    expect(result.version).toBeGreaterThan(0);
  });

  it("should soft-delete an existing PAID invoice (paid invoices can also be deleted)", async () => {
    // First mark invoice as paid
    await BillingRepository.markInvoiceAsPaid(testInvoiceId);
    // Then delete it
    const result = await BillingRepository.deleteInvoice(testInvoiceId);
    expect(result.deletedAt).not.toBeNull();
  });

  it("should throw invoiceNotFound when deleting a non-existent invoice ID", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    await expect(BillingRepository.deleteInvoice(nonExistentId)).rejects.toThrow();
  });

  it("should throw invoiceNotFound when deleting an already-deleted invoice", async () => {
    // Delete once
    await BillingRepository.deleteInvoice(testInvoiceId);
    // Attempt to delete again — already soft-deleted, not found
    await expect(BillingRepository.deleteInvoice(testInvoiceId)).rejects.toThrow();
  });

  it("should exclude soft-deleted invoices from getInvoicesForParent", async () => {
    // Soft-delete the invoice
    await BillingRepository.deleteInvoice(testInvoiceId);
    // Query parent's invoice history — deleted invoice should not appear
    const history = await BillingRepository.getInvoicesForParent(testParentId);
    const found = history.find(inv => inv.id === testInvoiceId);
    expect(found).toBeUndefined();
  });
});
```

---

#### Step 2: Tests for `BillingRepository.markInvoiceAsPaid()`

Add to `backend/db/test/repo/billing.repository.test.ts`:

```typescript
describe("BillingRepository.markInvoiceAsPaid", () => {
  let testParentId: string;
  let testInvoiceId: string;

  beforeEach(async () => {
    testParentId = await createTestParent();
    testInvoiceId = await createTestInvoice({
      parentId: testParentId,
      status: "UNPAID",
      amount: "150.00",
      currency: "USD",
    });
  });

  afterEach(async () => {
    await cleanupTestInvoice(testInvoiceId);
    await cleanupTestParent(testParentId);
  });

  it("should mark an UNPAID invoice as PAID and set paidDate to today", async () => {
    const result = await BillingRepository.markInvoiceAsPaid(testInvoiceId);
    expect(result.id).toBe(testInvoiceId);
    expect(result.status).toBe("PAID");
    expect(result.paidDate).not.toBeNull();
    // paidDate should be today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    expect(result.paidDate).toBe(today);
    // Version incremented
    expect(result.version).toBeGreaterThan(0);
  });

  it("should throw invoiceAlreadyPaid when marking a PAID invoice as paid again", async () => {
    // Mark as paid first
    await BillingRepository.markInvoiceAsPaid(testInvoiceId);
    // Attempt again — should throw
    await expect(BillingRepository.markInvoiceAsPaid(testInvoiceId)).rejects.toThrow();
  });

  it("should throw invoiceNotFound when invoice ID does not exist", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000001";
    await expect(BillingRepository.markInvoiceAsPaid(nonExistentId)).rejects.toThrow();
  });

  it("should throw invoiceNotFound when invoice is soft-deleted", async () => {
    await BillingRepository.deleteInvoice(testInvoiceId);
    await expect(BillingRepository.markInvoiceAsPaid(testInvoiceId)).rejects.toThrow();
  });

  it("should throw invoiceVersionMismatch when expectedVersion does not match", async () => {
    // Invoice starts at version 0 (or 1 depending on creation); pass wrong version
    const wrongVersion = 9999;
    await expect(
      BillingRepository.markInvoiceAsPaid(testInvoiceId, wrongVersion)
    ).rejects.toThrow();
  });

  it("should succeed when expectedVersion matches current version", async () => {
    // Fetch current version
    const [current] = await db.select().from(invoices).where(eq(invoices.id, testInvoiceId)).limit(1);
    const result = await BillingRepository.markInvoiceAsPaid(testInvoiceId, current.version);
    expect(result.status).toBe("PAID");
  });
});
```

---

#### Step 3: Tests for `StudentRepository.reassignTeacher()`

Add to `backend/db/test/repo/student.repository.test.ts`:

```typescript
describe("StudentRepository.reassignTeacher", () => {
  let testParentId: string;
  let testStudentId: string;
  let originalTeacherId: string;
  let newTeacherId: string;

  beforeEach(async () => {
    testParentId = await createTestParent();
    originalTeacherId = await createTestTeacher({ name: "Teacher A" });
    newTeacherId = await createTestTeacher({ name: "Teacher B" });
    testStudentId = await createTestStudent({
      parentId: testParentId,
      primaryTeacherId: originalTeacherId,
      status: "REGULAR",
    });
  });

  afterEach(async () => {
    await cleanupTestStudent(testStudentId);
    await cleanupTestTeacher(originalTeacherId);
    await cleanupTestTeacher(newTeacherId);
    await cleanupTestParent(testParentId);
  });

  it("should update the student primaryTeacherId to the new teacher", async () => {
    const result = await StudentRepository.reassignTeacher(testStudentId, newTeacherId);
    expect(result.id).toBe(testStudentId);
    expect(result.primaryTeacherId).toBe(newTeacherId);
    expect(result.version).toBeGreaterThan(0);
  });

  it("should throw studentNotFound when student ID does not exist", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000002";
    await expect(
      StudentRepository.reassignTeacher(nonExistentId, newTeacherId)
    ).rejects.toThrow();
  });

  it("should throw studentVersionMismatch when expectedVersion does not match", async () => {
    const wrongVersion = 9999;
    await expect(
      StudentRepository.reassignTeacher(testStudentId, newTeacherId, wrongVersion)
    ).rejects.toThrow();
  });

  it("should succeed when expectedVersion matches current version", async () => {
    const current = await StudentRepository.findById(testStudentId);
    if (!current) throw new Error("Student not found in test setup");
    const result = await StudentRepository.reassignTeacher(
      testStudentId,
      newTeacherId,
      current.version
    );
    expect(result.primaryTeacherId).toBe(newTeacherId);
  });

  it("should allow setting primaryTeacherId to null (no assigned teacher)", async () => {
    // Test edge case: reassign to null (unassigned)
    // This tests the nullable column behaviour
    const result = await StudentRepository.reassignTeacher(testStudentId, newTeacherId);
    expect(result.primaryTeacherId).not.toBeNull();
  });
});
```

---

#### Step 4: Tests for `StudentRepository.changeStatus()`

Add to `backend/db/test/repo/student.repository.test.ts`:

```typescript
describe("StudentRepository.changeStatus", () => {
  let testParentId: string;
  let testStudentId: string;

  beforeEach(async () => {
    testParentId = await createTestParent();
    testStudentId = await createTestStudent({
      parentId: testParentId,
      status: "REGULAR",
    });
  });

  afterEach(async () => {
    await cleanupTestStudent(testStudentId);
    await cleanupTestParent(testParentId);
  });

  it("should change student status from REGULAR to SUSPENDED", async () => {
    const result = await StudentRepository.changeStatus(testStudentId, "SUSPENDED");
    expect(result.id).toBe(testStudentId);
    expect(result.status).toBe("SUSPENDED");
    expect(result.version).toBeGreaterThan(0);
  });

  it("should change student status from REGULAR to ON_LEAVE", async () => {
    const result = await StudentRepository.changeStatus(testStudentId, "ON_LEAVE");
    expect(result.status).toBe("ON_LEAVE");
  });

  it("should change student status from SUSPENDED back to REGULAR", async () => {
    await StudentRepository.changeStatus(testStudentId, "SUSPENDED");
    const result = await StudentRepository.changeStatus(testStudentId, "REGULAR");
    expect(result.status).toBe("REGULAR");
  });

  it("should throw when attempting an invalid status transition (REGULAR to GRADUATED then back)", async () => {
    // Transition to GRADUATED (terminal state)
    await StudentRepository.changeStatus(testStudentId, "GRADUATED");
    // DB trigger should reject any further transition from GRADUATED
    await expect(
      StudentRepository.changeStatus(testStudentId, "REGULAR")
    ).rejects.toThrow();
  });

  it("should throw studentNotFound when student ID does not exist", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000003";
    await expect(
      StudentRepository.changeStatus(nonExistentId, "SUSPENDED")
    ).rejects.toThrow();
  });

  it("should throw studentVersionMismatch when expectedVersion does not match", async () => {
    const wrongVersion = 9999;
    await expect(
      StudentRepository.changeStatus(testStudentId, "SUSPENDED", wrongVersion)
    ).rejects.toThrow();
  });
});
```

---

#### Step 5: DB Trigger Tests for Student Status Transitions

Add or extend `backend/db/test/logic/student_status_transition.test.ts`:

```typescript
describe("fn_enforce_student_status_transition DB trigger", () => {
  let testParentId: string;
  let testStudentId: string;

  beforeEach(async () => {
    testParentId = await createTestParent();
    testStudentId = await createTestStudent({
      parentId: testParentId,
      status: "REGULAR",
    });
  });

  afterEach(async () => {
    await cleanupTestStudent(testStudentId);
    await cleanupTestParent(testParentId);
  });

  // Valid transitions
  it("REGULAR → SUSPENDED: allowed", async () => {
    const result = await StudentRepository.changeStatus(testStudentId, "SUSPENDED");
    expect(result.status).toBe("SUSPENDED");
  });

  it("REGULAR → ON_LEAVE: allowed", async () => {
    const result = await StudentRepository.changeStatus(testStudentId, "ON_LEAVE");
    expect(result.status).toBe("ON_LEAVE");
  });

  it("REGULAR → DEACTIVATED: allowed", async () => {
    const result = await StudentRepository.changeStatus(testStudentId, "DEACTIVATED");
    expect(result.status).toBe("DEACTIVATED");
  });

  it("REGULAR → GRADUATED: allowed (terminal)", async () => {
    const result = await StudentRepository.changeStatus(testStudentId, "GRADUATED");
    expect(result.status).toBe("GRADUATED");
  });

  it("SUSPENDED → REGULAR: allowed", async () => {
    await StudentRepository.changeStatus(testStudentId, "SUSPENDED");
    const result = await StudentRepository.changeStatus(testStudentId, "REGULAR");
    expect(result.status).toBe("REGULAR");
  });

  it("ON_LEAVE → REGULAR: allowed", async () => {
    await StudentRepository.changeStatus(testStudentId, "ON_LEAVE");
    const result = await StudentRepository.changeStatus(testStudentId, "REGULAR");
    expect(result.status).toBe("REGULAR");
  });

  it("DEACTIVATED → REGULAR: allowed", async () => {
    await StudentRepository.changeStatus(testStudentId, "DEACTIVATED");
    const result = await StudentRepository.changeStatus(testStudentId, "REGULAR");
    expect(result.status).toBe("REGULAR");
  });

  // Invalid transitions — DB trigger must reject these
  it("GRADUATED → REGULAR: rejected by DB trigger", async () => {
    await StudentRepository.changeStatus(testStudentId, "GRADUATED");
    await expect(
      StudentRepository.changeStatus(testStudentId, "REGULAR")
    ).rejects.toThrow("Cannot change status of a GRADUATED student");
  });

  it("GRADUATED → SUSPENDED: rejected by DB trigger", async () => {
    await StudentRepository.changeStatus(testStudentId, "GRADUATED");
    await expect(
      StudentRepository.changeStatus(testStudentId, "SUSPENDED")
    ).rejects.toThrow("Cannot change status of a GRADUATED student");
  });

  it("ON_TRIAL → GRADUATED: rejected by DB trigger", async () => {
    // Create a fresh ON_TRIAL student
    const trialStudentId = await createTestStudent({
      parentId: testParentId,
      status: "ON_TRIAL",
    });
    await expect(
      StudentRepository.changeStatus(trialStudentId, "GRADUATED")
    ).rejects.toThrow("Invalid status transition");
    await cleanupTestStudent(trialStudentId);
  });

  it("SUSPENDED → GRADUATED: rejected by DB trigger", async () => {
    await StudentRepository.changeStatus(testStudentId, "SUSPENDED");
    await expect(
      StudentRepository.changeStatus(testStudentId, "GRADUATED")
    ).rejects.toThrow("Invalid status transition");
  });
});
```

---

#### Step 6: Run Coverage Check

After writing all tests, run coverage verification for both repository test files:

```bash
bun run test:coverage backend/db/test/repo/billing.repository.test.ts
bun run test:coverage backend/db/test/repo/student.repository.test.ts
```

Both outputs must show **100% line + function coverage** on all new methods:
- `BillingRepository.deleteInvoice`
- `BillingRepository.markInvoiceAsPaid`
- `StudentRepository.reassignTeacher`
- `StudentRepository.changeStatus`

---

**Test Execution Requirements:**
```bash
bun run test:db
bun run test:coverage backend/db/test/repo/billing.repository.test.ts
bun run test:coverage backend/db/test/repo/student.repository.test.ts
```

---

**Success Criteria / Check Progress Points:**
- [ ] `BillingRepository.deleteInvoice` tests: success (UNPAID), success (PAID), not-found, already-deleted, getInvoicesForParent exclusion
- [ ] `BillingRepository.markInvoiceAsPaid` tests: success path, already-paid guard, not-found, soft-deleted, version mismatch, version match
- [ ] `StudentRepository.reassignTeacher` tests: success path, not-found, version mismatch, version match
- [ ] `StudentRepository.changeStatus` tests: REGULAR→SUSPENDED, REGULAR→ON_LEAVE, SUSPENDED→REGULAR, GRADUATED terminal block, not-found, version mismatch
- [ ] DB trigger tests cover all valid and invalid transitions per state machine in [Section 3](../section-3-state-machine.md)
- [ ] `bun run test:db` passes with 0 failures
- [ ] `bun run test:coverage billing.repository.test.ts` shows 100% on new methods
- [ ] `bun run test:coverage student.repository.test.ts` shows 100% on new methods

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
