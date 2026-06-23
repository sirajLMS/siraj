### Task C — Repository Tests: Comprehensive Test Coverage for Story 10 Repo Methods

**Objective:** Write comprehensive test cases for all four new repository methods introduced in Task B: `getStatusTrackingRows()`, `bulkFreezeStudentClasses()`, `bulkUnfreezeStudentClasses()`, and `getStudentFutureClasses()`. All tests must achieve 100% line + function coverage on the new methods.

**Dependencies:** Depends on Task B — all four new repository methods must be implemented and exported from `scheduling.repository.ts`.

**Layer-Specific Rules (Database Tests — Flattened from backend/db/repo/AGENTS.md):**
- Tests use the real test database (not mocks) — Drizzle queries run against an actual PostgreSQL instance.
- Test data must be created via existing seeder helpers or direct INSERT statements using Drizzle.
- Each test is independent — `beforeEach` or `afterEach` must clean up test data.
- Tests must cover: valid input success, invalid/nonexistent ID (0 rows returned, no error), state-filtered results, boundary conditions.
- IDOR protection: tests must verify that operations are correctly scoped to the provided `studentId`.

**Target File:**
- `backend/db/test/repo/scheduling.repository.test.ts` (Modify — add new `describe` blocks)

---

**Detailed Implementation Steps:**

### Step 1: Understand the Test File Structure

Before adding tests, read the existing `backend/db/test/repo/scheduling.repository.test.ts` to understand:
- How test students, teachers, and class instances are created
- What helper functions exist (e.g., `createTestStudent()`, `createTestClassInstance()`)
- The `describe`/`it` structure used in existing tests
- How `beforeEach`/`afterEach` cleanup is handled

### Step 2: Add Test Suite for `getStatusTrackingRows()`

Add a new `describe("getStatusTrackingRows", ...)` block after the existing test blocks:

```typescript
describe("getStatusTrackingRows", () => {
  let testStudentId: string;
  let testTeacherId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user for teacher
    testUserId = await createTestUser({ name: "Teacher Smith" });
    // Create test teacher linked to user
    testTeacherId = await createTestTeacher({ userId: testUserId });
    // Create test student
    testStudentId = await createTestStudent({
      name: "Alice Johnson",
      status: "REGULAR",
    });
  });

  afterEach(async () => {
    await cleanupTestData([testStudentId, testTeacherId, testUserId]);
  });

  it("returns class rows for a given date with correct student status", async () => {
    const today = new Date();
    const scheduledStart = new Date(today);
    scheduledStart.setHours(10, 0, 0, 0);
    const scheduledEnd = new Date(today);
    scheduledEnd.setHours(11, 0, 0, 0);

    const classInstanceId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const rows = await SchedulingRepository.getStatusTrackingRows(today);

    const found = rows.find(r => r.id === classInstanceId);
    expect(found).toBeDefined();
    expect(found?.studentName).toBe("Alice Johnson");
    expect(found?.studentStatus).toBe("REGULAR");
    expect(found?.teacherName).toBe("Teacher Smith");
    expect(found?.executionState).toBe("NOT_ACTIVATED");
    expect(found?.isFrozen).toBe(false);
    expect(found?.outcome).toBe("PENDING");
  });

  it("computes studentInitials from student name (first 2 words)", async () => {
    const today = new Date();
    const scheduledStart = new Date(today);
    scheduledStart.setHours(10, 0, 0, 0);
    const scheduledEnd = new Date(today);
    scheduledEnd.setHours(11, 0, 0, 0);

    await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const rows = await SchedulingRepository.getStatusTrackingRows(today);
    const found = rows.find(r => r.studentId === testStudentId);

    // "Alice Johnson" → initials = "AJ"
    expect(found?.studentInitials).toBe("AJ");
  });

  it("filters by search term on student name (case-insensitive)", async () => {
    const today = new Date();
    const scheduledStart = new Date(today);
    scheduledStart.setHours(10, 0, 0, 0);
    const scheduledEnd = new Date(today);
    scheduledEnd.setHours(11, 0, 0, 0);

    // Create a second student who should NOT appear in search results
    const anotherStudentId = await createTestStudent({ name: "Bob Williams", status: "REGULAR" });
    const anotherClassId = await createTestClassInstance({
      studentId: anotherStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const rows = await SchedulingRepository.getStatusTrackingRows(today, { search: "alice" });

    expect(rows.every(r => r.studentName.toLowerCase().includes("alice"))).toBe(true);
    expect(rows.some(r => r.id === anotherClassId)).toBe(false);

    await cleanupTestData([anotherStudentId]);
  });

  it("filters by search term on teacher name (case-insensitive)", async () => {
    const today = new Date();
    const scheduledStart = new Date(today);
    scheduledStart.setHours(10, 0, 0, 0);
    const scheduledEnd = new Date(today);
    scheduledEnd.setHours(11, 0, 0, 0);

    // Create a second teacher who should NOT appear
    const anotherUserId = await createTestUser({ name: "Jane Doe Teacher" });
    const anotherTeacherId = await createTestTeacher({ userId: anotherUserId });
    const anotherStudentId = await createTestStudent({ name: "Charlie", status: "REGULAR" });

    await createTestClassInstance({
      studentId: anotherStudentId,
      teacherId: anotherTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    // Search by teacher name "smith" — should only return rows for Teacher Smith
    const rows = await SchedulingRepository.getStatusTrackingRows(today, { search: "smith" });

    expect(rows.every(r => r.teacherName.toLowerCase().includes("smith"))).toBe(true);
    expect(rows.some(r => r.studentId === anotherStudentId)).toBe(false);

    await cleanupTestData([anotherStudentId, anotherTeacherId, anotherUserId]);
  });

  it("returns isFrozen: true for classes with frozen flag", async () => {
    const today = new Date();
    const scheduledStart = new Date(today);
    scheduledStart.setHours(10, 0, 0, 0);
    const scheduledEnd = new Date(today);
    scheduledEnd.setHours(11, 0, 0, 0);

    const frozenClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: true,
    });

    const rows = await SchedulingRepository.getStatusTrackingRows(today);
    const found = rows.find(r => r.id === frozenClassId);

    expect(found).toBeDefined();
    expect(found?.isFrozen).toBe(true);
  });

  it("returns empty array when no classes are scheduled on the date", async () => {
    const pastDate = new Date("2020-01-01");
    const rows = await SchedulingRepository.getStatusTrackingRows(pastDate);
    // There should be no classes scheduled on Jan 1, 2020 in the test DB
    expect(rows).toEqual([]);
  });

  it("orders results by scheduledStartAt ascending", async () => {
    const today = new Date();
    const earlyStart = new Date(today);
    earlyStart.setHours(8, 0, 0, 0);
    const lateStart = new Date(today);
    lateStart.setHours(14, 0, 0, 0);

    const earlyEnd = new Date(today);
    earlyEnd.setHours(9, 0, 0, 0);
    const lateEnd = new Date(today);
    lateEnd.setHours(15, 0, 0, 0);

    const lateClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: lateStart,
      scheduledEndAt: lateEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const earlyClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: earlyStart,
      scheduledEndAt: earlyEnd,
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const rows = await SchedulingRepository.getStatusTrackingRows(today);
    const foundEarlyIndex = rows.findIndex(r => r.id === earlyClassId);
    const foundLateIndex = rows.findIndex(r => r.id === lateClassId);

    expect(foundEarlyIndex).toBeGreaterThanOrEqual(0);
    expect(foundLateIndex).toBeGreaterThanOrEqual(0);
    expect(foundEarlyIndex).toBeLessThan(foundLateIndex);
  });
});
```

### Step 3: Add Test Suite for `bulkFreezeStudentClasses()`

```typescript
describe("bulkFreezeStudentClasses", () => {
  let testStudentId: string;
  let testTeacherId: string;

  beforeEach(async () => {
    const userId = await createTestUser({ name: "Test Teacher" });
    testTeacherId = await createTestTeacher({ userId });
    testStudentId = await createTestStudent({ name: "Freeze Test Student", status: "REGULAR" });
  });

  afterEach(async () => {
    await cleanupTestData([testStudentId, testTeacherId]);
  });

  it("sets isFrozen = true on all NOT_ACTIVATED future classes for the student", async () => {
    const fromDate = new Date();
    const futureDate1 = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const futureDate2 = new Date(Date.now() + 48 * 60 * 60 * 1000); // day after tomorrow

    const classId1 = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate1,
      scheduledEndAt: new Date(futureDate1.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const classId2 = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate2,
      scheduledEndAt: new Date(futureDate2.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const frozenCount = await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);

    expect(frozenCount).toBe(2);

    // Verify in DB
    const class1 = await getClassInstanceById(classId1);
    const class2 = await getClassInstanceById(classId2);
    expect(class1?.isFrozen).toBe(true);
    expect(class2?.isFrozen).toBe(true);
  });

  it("freezes ACTIVATED classes in addition to NOT_ACTIVATED", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const activatedClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const frozenCount = await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);

    expect(frozenCount).toBe(1);
    const cls = await getClassInstanceById(activatedClassId);
    expect(cls?.isFrozen).toBe(true);
  });

  it("does NOT freeze COMPLETED or RUNNING classes", async () => {
    const fromDate = new Date();
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const completedClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: pastDate,
      scheduledEndAt: new Date(pastDate.getTime() + 3600000),
      executionState: "COMPLETED",
      outcome: "TAKEN",
      isFrozen: false,
    });

    const runningClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "RUNNING",
      outcome: "PENDING",
      isFrozen: false,
    });

    const frozenCount = await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);

    expect(frozenCount).toBe(0);
    const completed = await getClassInstanceById(completedClassId);
    const running = await getClassInstanceById(runningClassId);
    expect(completed?.isFrozen).toBe(false);
    expect(running?.isFrozen).toBe(false);
  });

  it("does NOT freeze classes of other students", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const otherStudentId = await createTestStudent({ name: "Other Student", status: "REGULAR" });

    const otherClassId = await createTestClassInstance({
      studentId: otherStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);

    const otherClass = await getClassInstanceById(otherClassId);
    expect(otherClass?.isFrozen).toBe(false);

    await cleanupTestData([otherStudentId]);
  });

  it("returns 0 for non-existent studentId (no error)", async () => {
    const fromDate = new Date();
    const result = await SchedulingRepository.bulkFreezeStudentClasses(
      "non-existent-student-id-00000000",
      fromDate
    );
    expect(result).toBe(0);
  });

  it("calling bulkFreezeStudentClasses twice is idempotent (count = frozen rows only)", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const classId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const count1 = await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);
    // Second call: class is already frozen, but executionState is still NOT_ACTIVATED
    // The WHERE clause matches it again and re-sets isFrozen = true (no-op in practice)
    const count2 = await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);

    expect(count1).toBe(1);
    expect(count2).toBe(1); // Still 1 — same row matched again

    const cls = await getClassInstanceById(classId);
    expect(cls?.isFrozen).toBe(true); // Still true
  });
});
```

### Step 4: Add Test Suite for `bulkUnfreezeStudentClasses()`

```typescript
describe("bulkUnfreezeStudentClasses", () => {
  let testStudentId: string;
  let testTeacherId: string;

  beforeEach(async () => {
    const userId = await createTestUser({ name: "Unfreeze Test Teacher" });
    testTeacherId = await createTestTeacher({ userId });
    testStudentId = await createTestStudent({ name: "Unfreeze Test Student", status: "SUSPENDED" });
  });

  afterEach(async () => {
    await cleanupTestData([testStudentId, testTeacherId]);
  });

  it("sets isFrozen = false on all frozen future classes for the student", async () => {
    const fromDate = new Date();
    const futureDate1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const futureDate2 = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const classId1 = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate1,
      scheduledEndAt: new Date(futureDate1.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: true, // pre-frozen
    });

    const classId2 = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate2,
      scheduledEndAt: new Date(futureDate2.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: true, // pre-frozen
    });

    const unfrozenCount = await SchedulingRepository.bulkUnfreezeStudentClasses(testStudentId, fromDate);

    expect(unfrozenCount).toBe(2);

    const class1 = await getClassInstanceById(classId1);
    const class2 = await getClassInstanceById(classId2);
    expect(class1?.isFrozen).toBe(false);
    expect(class2?.isFrozen).toBe(false);
  });

  it("does NOT modify non-frozen classes", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const unfrozenClassId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const unfrozenCount = await SchedulingRepository.bulkUnfreezeStudentClasses(testStudentId, fromDate);

    expect(unfrozenCount).toBe(0);
    const cls = await getClassInstanceById(unfrozenClassId);
    expect(cls?.isFrozen).toBe(false); // unchanged
  });

  it("does NOT unfreeze classes of other students", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const otherStudentId = await createTestStudent({ name: "Other Frozen Student", status: "SUSPENDED" });
    const otherFrozenClassId = await createTestClassInstance({
      studentId: otherStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: true,
    });

    await SchedulingRepository.bulkUnfreezeStudentClasses(testStudentId, fromDate);

    const otherClass = await getClassInstanceById(otherFrozenClassId);
    expect(otherClass?.isFrozen).toBe(true); // still frozen

    await cleanupTestData([otherStudentId]);
  });

  it("returns 0 for non-existent studentId (no error)", async () => {
    const fromDate = new Date();
    const result = await SchedulingRepository.bulkUnfreezeStudentClasses(
      "non-existent-student-id-00000000",
      fromDate
    );
    expect(result).toBe(0);
  });

  it("full freeze-then-unfreeze cycle restores isFrozen = false", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const classId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    // Freeze
    await SchedulingRepository.bulkFreezeStudentClasses(testStudentId, fromDate);
    const afterFreeze = await getClassInstanceById(classId);
    expect(afterFreeze?.isFrozen).toBe(true);

    // Unfreeze
    await SchedulingRepository.bulkUnfreezeStudentClasses(testStudentId, fromDate);
    const afterUnfreeze = await getClassInstanceById(classId);
    expect(afterUnfreeze?.isFrozen).toBe(false);
  });
});
```

### Step 5: Add Test Suite for `getStudentFutureClasses()`

```typescript
describe("getStudentFutureClasses", () => {
  let testStudentId: string;
  let testTeacherId: string;

  beforeEach(async () => {
    const userId = await createTestUser({ name: "Future Classes Teacher" });
    testTeacherId = await createTestTeacher({ userId });
    testStudentId = await createTestStudent({ name: "Future Classes Student", status: "REGULAR" });
  });

  afterEach(async () => {
    await cleanupTestData([testStudentId, testTeacherId]);
  });

  it("returns only NOT_ACTIVATED and ACTIVATED future classes", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const notActivatedId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const activatedId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: new Date(futureDate.getTime() + 86400000),
      scheduledEndAt: new Date(futureDate.getTime() + 86400000 + 3600000),
      executionState: "ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const completedId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      scheduledEndAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 3600000),
      executionState: "COMPLETED",
      outcome: "TAKEN",
      isFrozen: false,
    });

    const futureClasses = await SchedulingRepository.getStudentFutureClasses(testStudentId, fromDate);

    const ids = futureClasses.map(c => c.id);
    expect(ids).toContain(notActivatedId);
    expect(ids).toContain(activatedId);
    expect(ids).not.toContain(completedId);
  });

  it("returns empty array for student with no future classes", async () => {
    const fromDate = new Date();
    const result = await SchedulingRepository.getStudentFutureClasses(testStudentId, fromDate);
    expect(result).toEqual([]);
  });

  it("returns minimal shape { id, executionState, scheduledStartAt }", async () => {
    const fromDate = new Date();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: futureDate,
      scheduledEndAt: new Date(futureDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const futureClasses = await SchedulingRepository.getStudentFutureClasses(testStudentId, fromDate);

    expect(futureClasses.length).toBe(1);
    expect(typeof futureClasses[0].id).toBe("string");
    expect(typeof futureClasses[0].executionState).toBe("string");
    expect(futureClasses[0].scheduledStartAt).toBeInstanceOf(Date);
    // Should NOT have isFrozen, outcome, studentId, teacherId etc.
    expect("isFrozen" in futureClasses[0]).toBe(false);
    expect("outcome" in futureClasses[0]).toBe(false);
  });

  it("orders results by scheduledStartAt ascending", async () => {
    const fromDate = new Date();
    const laterDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const earlierDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const laterId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: laterDate,
      scheduledEndAt: new Date(laterDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const earlierId = await createTestClassInstance({
      studentId: testStudentId,
      teacherId: testTeacherId,
      scheduledStartAt: earlierDate,
      scheduledEndAt: new Date(earlierDate.getTime() + 3600000),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      isFrozen: false,
    });

    const futureClasses = await SchedulingRepository.getStudentFutureClasses(testStudentId, fromDate);

    const earlierIndex = futureClasses.findIndex(c => c.id === earlierId);
    const laterIndex = futureClasses.findIndex(c => c.id === laterId);
    expect(earlierIndex).toBeLessThan(laterIndex);
  });
});
```

---

**Test Execution Requirements:**

```bash
# Run all database tests
bun run test:db

# Run coverage report specifically for scheduling repository tests
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

**Expected output for coverage:** 100% line + function coverage on all four new methods:
- `getStatusTrackingRows` — all branches (with search, without search, empty result)
- `bulkFreezeStudentClasses` — success path, 0-row path
- `bulkUnfreezeStudentClasses` — success path, 0-row path
- `getStudentFutureClasses` — success path, empty path

---

**Success Criteria / Check Progress Points:**

- [ ] `getStatusTrackingRows` tests pass: correct student status, initials computation, search by student name, search by teacher name, `isFrozen: true` visibility, empty for no classes, ordering
- [ ] `bulkFreezeStudentClasses` tests pass: NOT_ACTIVATED frozen, ACTIVATED frozen, COMPLETED/RUNNING NOT frozen, other students NOT affected, non-existent studentId returns 0, idempotency
- [ ] `bulkUnfreezeStudentClasses` tests pass: frozen classes unfrozen, non-frozen unchanged, other students not affected, non-existent studentId returns 0, full cycle (freeze then unfreeze)
- [ ] `getStudentFutureClasses` tests pass: correct state filter, empty result, minimal shape, ordering
- [ ] `bun run test:db` exits with code 0, 0 failures
- [ ] `bun run test:coverage` shows 100% line + function coverage on all four new methods

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
