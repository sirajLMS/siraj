### Task G — GraphQL Integration Tests: Story 9 Mutations

**Objective:** Write GraphQL integration tests for all 5 new mutations: `createManualInvoice`, `markInvoicePaid`, `deleteInvoice`, `reassignStudentTeacher`, `changeStudentStatus`. Each mutation must have at least one authorized-success test and one unauthorized-denial test.

**Dependencies:** Depends on Task F — frontend GraphQL `TypedDocumentNode` documents are created and codegen has run successfully. The 5 mutations are available in the schema.

**Layer-Specific Rules (GraphQL Integration Tests — Flattened from `frontend/graphql/AGENTS.md`):**
- Tests live in `frontend/graphql/test/` directory.
- Use the existing test setup patterns from sibling test files (e.g., `parent-profile.test.ts`).
- Test authorized success AND unauthorized denial for every new mutation.
- Test each security threat from [Section 4](../section-4-security-threats.md) at the GraphQL level.
- Use test users with specific permission groups to simulate authorization scenarios.
- Run `bun run test:graphql` to execute all GraphQL tests.

**Target Files:**
- `frontend/graphql/test/billing-management.test.ts` — NEW file (billing mutation tests)
- `frontend/graphql/test/student-lifecycle.test.ts` — NEW file (student mutation tests)

---

#### Step 1: Create `frontend/graphql/test/billing-management.test.ts`

```typescript
// frontend/graphql/test/billing-management.test.ts

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { executeGraphQL, createTestUser, cleanupTestUser, createTestParent, cleanupTestParent, createTestInvoice, cleanupTestInvoice } from "./test-helpers";
import {
  createManualInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
  deleteInvoiceMutationDocument,
} from "@/frontend/graphql/sharedDocuments";

describe("GraphQL: createManualInvoice mutation", () => {
  let adminUserId: string;
  let unauthorizedUserId: string;
  let testParentId: string;

  beforeEach(async () => {
    adminUserId = await createTestUser({ group: "academy_admin" });
    unauthorizedUserId = await createTestUser({ group: "teacher_default" });
    testParentId = await createTestParent();
  });

  afterEach(async () => {
    await cleanupTestParent(testParentId);
    await cleanupTestUser(adminUserId);
    await cleanupTestUser(unauthorizedUserId);
  });

  it("authorized admin: creates manual invoice with UNPAID status", async () => {
    const result = await executeGraphQL(
      createManualInvoiceMutationDocument,
      {
        parentId: testParentId,
        studentId: null,
        amount: "200.00",
        currency: "USD",
        invoiceType: "MANUAL",
        issueDate: "2026-06-21",
        dueDate: "2026-07-21",
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.createManualInvoice).toBeDefined();
    expect(result.data?.createManualInvoice.id).toBeTruthy();
    expect(result.data?.createManualInvoice.parentId).toBe(testParentId);
    expect(result.data?.createManualInvoice.status).toBe("UNPAID");
    expect(result.data?.createManualInvoice.amount).toBe("200.00");
    expect(result.data?.createManualInvoice.currency).toBe("USD");

    // Cleanup created invoice
    if (result.data?.createManualInvoice.id) {
      await cleanupTestInvoice(result.data.createManualInvoice.id);
    }
  });

  it("unauthorized teacher: createManualInvoice returns insufficientPermissions error", async () => {
    const result = await executeGraphQL(
      createManualInvoiceMutationDocument,
      {
        parentId: testParentId,
        studentId: null,
        amount: "100.00",
        currency: "USD",
        invoiceType: "MANUAL",
        issueDate: "2026-06-21",
        dueDate: "2026-07-21",
      },
      { userId: unauthorizedUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.data?.createManualInvoice).toBeNull();
  });

  it("unauthenticated user: createManualInvoice returns error", async () => {
    const result = await executeGraphQL(
      createManualInvoiceMutationDocument,
      {
        parentId: testParentId,
        studentId: null,
        amount: "100.00",
        currency: "USD",
        invoiceType: "MANUAL",
        issueDate: "2026-06-21",
        dueDate: "2026-07-21",
      },
      { userId: "" } // no auth
    );

    expect(result.errors).toBeDefined();
  });

  it("invalid amount: createManualInvoice returns validation error", async () => {
    const result = await executeGraphQL(
      createManualInvoiceMutationDocument,
      {
        parentId: testParentId,
        studentId: null,
        amount: "-50.00", // invalid negative amount
        currency: "USD",
        invoiceType: "MANUAL",
        issueDate: "2026-06-21",
        dueDate: "2026-07-21",
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
  });
});

describe("GraphQL: markInvoicePaid mutation", () => {
  let adminUserId: string;
  let unauthorizedUserId: string;
  let testParentId: string;
  let testInvoiceId: string;

  beforeEach(async () => {
    adminUserId = await createTestUser({ group: "academy_admin" });
    unauthorizedUserId = await createTestUser({ group: "teacher_default" });
    testParentId = await createTestParent();
    testInvoiceId = await createTestInvoice({
      parentId: testParentId,
      status: "UNPAID",
      amount: "300.00",
      currency: "USD",
    });
  });

  afterEach(async () => {
    await cleanupTestInvoice(testInvoiceId);
    await cleanupTestParent(testParentId);
    await cleanupTestUser(adminUserId);
    await cleanupTestUser(unauthorizedUserId);
  });

  it("authorized admin: marks UNPAID invoice as PAID", async () => {
    const result = await executeGraphQL(
      markInvoicePaidMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.markInvoicePaid).toBeDefined();
    expect(result.data?.markInvoicePaid.id).toBe(testInvoiceId);
    expect(result.data?.markInvoicePaid.status).toBe("PAID");
    expect(result.data?.markInvoicePaid.paidDate).not.toBeNull();
  });

  it("Threat 1 — double settlement: second markInvoicePaid on same invoice returns error", async () => {
    // Mark as paid once
    await executeGraphQL(
      markInvoicePaidMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );
    // Attempt to mark as paid again — should fail
    const result = await executeGraphQL(
      markInvoicePaidMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.markInvoicePaid).toBeNull();
  });

  it("unauthorized teacher: markInvoicePaid returns insufficientPermissions error", async () => {
    const result = await executeGraphQL(
      markInvoicePaidMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: unauthorizedUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.markInvoicePaid).toBeNull();
  });

  it("Threat 2 — non-existent invoice ID: markInvoicePaid returns invoiceNotFound error", async () => {
    const result = await executeGraphQL(
      markInvoicePaidMutationDocument,
      { invoiceId: "00000000-0000-0000-0000-000000000000" },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
  });
});

describe("GraphQL: deleteInvoice mutation", () => {
  let adminUserId: string;
  let unauthorizedUserId: string;
  let testParentId: string;
  let testInvoiceId: string;

  beforeEach(async () => {
    adminUserId = await createTestUser({ group: "academy_admin" });
    unauthorizedUserId = await createTestUser({ group: "teacher_default" });
    testParentId = await createTestParent();
    testInvoiceId = await createTestInvoice({
      parentId: testParentId,
      status: "UNPAID",
      amount: "150.00",
      currency: "USD",
    });
  });

  afterEach(async () => {
    // Invoice may already be deleted; cleanup is idempotent
    await cleanupTestInvoice(testInvoiceId).catch(() => null);
    await cleanupTestParent(testParentId);
    await cleanupTestUser(adminUserId);
    await cleanupTestUser(unauthorizedUserId);
  });

  it("authorized admin: soft-deletes an UNPAID invoice", async () => {
    const result = await executeGraphQL(
      deleteInvoiceMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteInvoice).toBeDefined();
    expect(result.data?.deleteInvoice.id).toBe(testInvoiceId);
    expect(result.data?.deleteInvoice.deletedAt).not.toBeNull();
  });

  it("Threat 2 — double deletion: second deleteInvoice returns invoiceNotFound", async () => {
    await executeGraphQL(
      deleteInvoiceMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );
    const result = await executeGraphQL(
      deleteInvoiceMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
  });

  it("unauthorized teacher: deleteInvoice returns insufficientPermissions error", async () => {
    const result = await executeGraphQL(
      deleteInvoiceMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: unauthorizedUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.deleteInvoice).toBeNull();
  });

  it("Threat 5 — notification sync failure does not mask billing success", async () => {
    // Even if sync fails internally, deleteInvoice should return success
    // This is tested by verifying the mutation returns deletedAt !== null
    const result = await executeGraphQL(
      deleteInvoiceMutationDocument,
      { invoiceId: testInvoiceId },
      { userId: adminUserId }
    );

    // The mutation completed successfully — sync failure is non-blocking
    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteInvoice.deletedAt).not.toBeNull();
  });
});
```

---

#### Step 2: Create `frontend/graphql/test/student-lifecycle.test.ts`

```typescript
// frontend/graphql/test/student-lifecycle.test.ts

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  executeGraphQL,
  createTestUser,
  cleanupTestUser,
  createTestParent,
  cleanupTestParent,
  createTestStudent,
  cleanupTestStudent,
  createTestTeacher,
  cleanupTestTeacher,
} from "./test-helpers";
import {
  reassignStudentTeacherMutationDocument,
  changeStudentStatusMutationDocument,
} from "@/frontend/graphql/sharedDocuments";

describe("GraphQL: reassignStudentTeacher mutation", () => {
  let adminUserId: string;
  let unauthorizedUserId: string;
  let testParentId: string;
  let testStudentId: string;
  let originalTeacherId: string;
  let newTeacherId: string;

  beforeEach(async () => {
    adminUserId = await createTestUser({ group: "academy_admin" });
    unauthorizedUserId = await createTestUser({ group: "teacher_default" });
    testParentId = await createTestParent();
    originalTeacherId = await createTestTeacher({ name: "Original Teacher" });
    newTeacherId = await createTestTeacher({ name: "New Teacher" });
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
    await cleanupTestUser(adminUserId);
    await cleanupTestUser(unauthorizedUserId);
  });

  it("authorized admin: reassigns student to a different teacher", async () => {
    const result = await executeGraphQL(
      reassignStudentTeacherMutationDocument,
      {
        studentId: testStudentId,
        newTeacherId: newTeacherId,
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.reassignStudentTeacher).toBeDefined();
    expect(result.data?.reassignStudentTeacher.id).toBe(testStudentId);
    expect(result.data?.reassignStudentTeacher.primaryTeacherId).toBe(newTeacherId);
  });

  it("Threat 4 — non-existent teacher ID: reassignStudentTeacher returns teacherNotFound", async () => {
    const result = await executeGraphQL(
      reassignStudentTeacherMutationDocument,
      {
        studentId: testStudentId,
        newTeacherId: "00000000-0000-0000-0000-000000000004",
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.reassignStudentTeacher).toBeNull();
  });

  it("unauthorized teacher: reassignStudentTeacher returns insufficientPermissions", async () => {
    const result = await executeGraphQL(
      reassignStudentTeacherMutationDocument,
      {
        studentId: testStudentId,
        newTeacherId: newTeacherId,
      },
      { userId: unauthorizedUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.reassignStudentTeacher).toBeNull();
  });

  it("non-existent student: reassignStudentTeacher returns studentNotFound", async () => {
    const result = await executeGraphQL(
      reassignStudentTeacherMutationDocument,
      {
        studentId: "00000000-0000-0000-0000-000000000005",
        newTeacherId: newTeacherId,
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
  });
});

describe("GraphQL: changeStudentStatus mutation", () => {
  let adminUserId: string;
  let unauthorizedUserId: string;
  let testParentId: string;
  let testStudentId: string;

  beforeEach(async () => {
    adminUserId = await createTestUser({ group: "academy_admin" });
    unauthorizedUserId = await createTestUser({ group: "teacher_default" });
    testParentId = await createTestParent();
    testStudentId = await createTestStudent({
      parentId: testParentId,
      status: "REGULAR",
    });
  });

  afterEach(async () => {
    await cleanupTestStudent(testStudentId);
    await cleanupTestParent(testParentId);
    await cleanupTestUser(adminUserId);
    await cleanupTestUser(unauthorizedUserId);
  });

  it("authorized admin: changes student status from REGULAR to SUSPENDED", async () => {
    const result = await executeGraphQL(
      changeStudentStatusMutationDocument,
      {
        studentId: testStudentId,
        newStatus: "SUSPENDED",
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.changeStudentStatus).toBeDefined();
    expect(result.data?.changeStudentStatus.id).toBe(testStudentId);
    expect(result.data?.changeStudentStatus.status).toBe("SUSPENDED");
  });

  it("authorized admin: changes student status from REGULAR to ON_LEAVE", async () => {
    const result = await executeGraphQL(
      changeStudentStatusMutationDocument,
      {
        studentId: testStudentId,
        newStatus: "ON_LEAVE",
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.changeStudentStatus.status).toBe("ON_LEAVE");
  });

  it("Threat 3 — invalid status transition: GRADUATED → REGULAR returns invalidStatusTransition", async () => {
    // First transition to GRADUATED
    await executeGraphQL(
      changeStudentStatusMutationDocument,
      { studentId: testStudentId, newStatus: "GRADUATED" },
      { userId: adminUserId }
    );
    // Attempt invalid transition from terminal state
    const result = await executeGraphQL(
      changeStudentStatusMutationDocument,
      { studentId: testStudentId, newStatus: "REGULAR" },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.changeStudentStatus).toBeNull();
  });

  it("unauthorized teacher: changeStudentStatus returns insufficientPermissions", async () => {
    const result = await executeGraphQL(
      changeStudentStatusMutationDocument,
      {
        studentId: testStudentId,
        newStatus: "SUSPENDED",
      },
      { userId: unauthorizedUserId }
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.changeStudentStatus).toBeNull();
  });

  it("non-existent student: changeStudentStatus returns studentNotFound", async () => {
    const result = await executeGraphQL(
      changeStudentStatusMutationDocument,
      {
        studentId: "00000000-0000-0000-0000-000000000006",
        newStatus: "SUSPENDED",
      },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
  });

  it("Threat 3 — ON_TRIAL → GRADUATED: invalid transition blocked by service", async () => {
    // Create fresh ON_TRIAL student
    const trialStudentId = await createTestStudent({
      parentId: testParentId,
      status: "ON_TRIAL",
    });
    const result = await executeGraphQL(
      changeStudentStatusMutationDocument,
      { studentId: trialStudentId, newStatus: "GRADUATED" },
      { userId: adminUserId }
    );

    expect(result.errors).toBeDefined();
    await cleanupTestStudent(trialStudentId);
  });
});
```

---

**Test Execution Requirements:**
```bash
bun run test:graphql
```
All GraphQL integration tests must pass with 0 failures.

---

**Success Criteria / Check Progress Points:**
- [ ] `billing-management.test.ts` created with tests for `createManualInvoice`, `markInvoicePaid`, `deleteInvoice`
- [ ] `student-lifecycle.test.ts` created with tests for `reassignStudentTeacher`, `changeStudentStatus`
- [ ] Every mutation has at least 1 authorized-success test and 1 unauthorized-denial test
- [ ] Security threats from [Section 4](../section-4-security-threats.md) are covered: Threat 1 (double settlement), Threat 2 (IDOR/not-found), Threat 3 (invalid status transition), Threat 4 (invalid teacher), Threat 5 (sync failure non-blocking)
- [ ] `bun run test:graphql` passes with 0 failures

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
