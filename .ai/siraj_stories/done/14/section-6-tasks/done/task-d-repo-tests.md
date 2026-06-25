### Task D — Repository Tests: Complaint, Complaint Response, and Suggestion

---

**Objective**
Write comprehensive repository tests for all 3 new repositories — `ComplaintRepository`, `ComplaintResponseRepository`, and `SuggestionRepository` — achieving 100% line and function coverage. Every public method must be tested for both success and failure paths, including soft-delete filtering, IDOR protection, transaction rollback, and admin override scenarios.

**Dependencies**
- Task B (Repositories) must be complete — `ComplaintRepository`, `ComplaintResponseRepository`, `SuggestionRepository` must exist in `backend/db/repo/`.
- Task C (Services) must be complete — service layer validates the end-to-end flow but tests here target the repository layer directly.

**Layer-Specific Rules**
- Read `backend/db/test/AGENTS.md` before writing any test code.
- Use `bun:test` for all test utilities (`describe`, `test`, `expect`).
- Every test MUST run inside `runInRollback` — no exceptions.
- Always pass `tx` to ALL repository method calls inside `runInRollback`.
- Use `expectRepoError` try/catch helper — NEVER use `expect(...).rejects.toThrow()`.
- Use entity-setup helpers (`createTestUser`, `createTestParent`, `createTestStudent`) — NEVER query seed data.
- Account for pre-existing data when asserting counts — fetch initial count first.
- Use higher-order test wrappers to reduce CodeScene duplication flags.
- No `console` methods — use `testLogger` or no logging.
- No `any` type overrides.

**Target Files**
| File | Action |
|------|--------|
| `backend/db/test/repo/complaint.repository.test.ts` | CREATE |
| `backend/db/test/repo/complaint-response.repository.test.ts` | CREATE |
| `backend/db/test/repo/suggestion.repository.test.ts` | CREATE |

---

### Detailed Implementation Steps

---

#### Step 1 — Create `backend/db/test/repo/complaint.repository.test.ts`

```typescript
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ComplaintRepository } from "@/backend/db/repo/complaint.repository";
import { complaints } from "@/backend/db/schema";
import { ComplaintStatus } from "@/shared/lib/enum";
import { createTestParent, createTestStudent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";
import type { DBTransaction } from "@/backend/db/db.types";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function complaintTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupParentWithStudent(tx: DBTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  const student = await createTestStudent(tx, parent.id, { name: `${namePrefix} Student` });
  return { user, parent, student };
}

async function insertComplaint(
  tx: DBTransaction,
  parentId: string,
  overrides: Partial<{
    studentId: string | null;
    category: "REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER";
    status: "UNANSWERED" | "ANSWERED";
    body: string;
    submitterEmail: string;
    deletedAt: Date | null;
  }> = {}
) {
  const now = new Date();
  const [created] = await tx
    .insert(complaints)
    .values({
      parentId,
      studentId: overrides.studentId ?? null,
      category: overrides.category ?? "OTHER",
      submitterEmail: overrides.submitterEmail ?? `submitter-${randomUUID()}@test.com`,
      body: overrides.body ?? "Test complaint body",
      status: overrides.status ?? "UNANSWERED",
      deletedAt: overrides.deletedAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return created;
}

describe("ComplaintRepository — submitComplaint", () => {
  complaintTest("creates a complaint record with valid input", async tx => {
    const { parent, student } = await setupParentWithStudent(tx, "Submit");

    const result = await ComplaintRepository.submitComplaint(
      {
        parentId: parent.id,
        studentId: student.id,
        category: "REGARDING_TEACHER",
        submitterEmail: "parent@test.com",
        body: "Teacher was rude",
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.parentId).toBe(parent.id);
    expect(result.studentId).toBe(student.id);
    expect(result.category).toBe("REGARDING_TEACHER");
    expect(result.submitterEmail).toBe("parent@test.com");
    expect(result.body).toBe("Teacher was rude");
    expect(result.status).toBe(ComplaintStatus.UNANSWERED);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  complaintTest("creates complaint with null studentId", async tx => {
    const { parent } = await setupParentWithStudent(tx, "NullStud");

    const result = await ComplaintRepository.submitComplaint(
      {
        parentId: parent.id,
        studentId: null,
        category: "REGARDING_SYSTEM",
        submitterEmail: "null-stud@test.com",
        body: "System is slow",
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.studentId).toBeNull();
    expect(result.category).toBe("REGARDING_SYSTEM");
  });

  complaintTest("creates complaint without studentId field", async tx => {
    const { parent } = await setupParentWithStudent(tx, "NoStud");

    const result = await ComplaintRepository.submitComplaint(
      {
        parentId: parent.id,
        category: "OTHER",
        submitterEmail: "no-stud@test.com",
        body: "General feedback",
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.studentId).toBeNull();
  });

  complaintTest("fails with invalid parentId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      ComplaintRepository.submitComplaint(
        {
          parentId: "00000000-0000-0000-0000-000000000000",
          category: "OTHER",
          submitterEmail: "bad@test.com",
          body: "Should fail",
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("ComplaintRepository — getComplaintsByParent", () => {
  complaintTest("returns only the specified parent's complaints", async tx => {
    const parentA = await setupParentWithStudent(tx, "IdorA");
    const parentB = await setupParentWithStudent(tx, "IdorB");

    await insertComplaint(tx, parentA.parent.id, { body: "Parent A complaint" });
    await insertComplaint(tx, parentB.parent.id, { body: "Parent B complaint" });

    const resultA = await ComplaintRepository.getComplaintsByParent(parentA.parent.id, tx);
    const resultB = await ComplaintRepository.getComplaintsByParent(parentB.parent.id, tx);

    expect(resultA.length).toBeGreaterThanOrEqual(1);
    expect(resultA.every(c => c.parentId === parentA.parent.id)).toBeTrue();
    expect(resultA.some(c => c.body === "Parent A complaint")).toBeTrue();
    expect(resultA.some(c => c.body === "Parent B complaint")).toBeFalse();

    expect(resultB.length).toBeGreaterThanOrEqual(1);
    expect(resultB.every(c => c.parentId === parentB.parent.id)).toBeTrue();
  });

  complaintTest("excludes soft-deleted complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "SoftDel");

    await insertComplaint(tx, parent.id, { body: "Active complaint" });
    await insertComplaint(tx, parent.id, { body: "Deleted complaint", deletedAt: new Date() });

    const result = await ComplaintRepository.getComplaintsByParent(parent.id, tx);

    expect(result.some(c => c.body === "Active complaint")).toBeTrue();
    expect(result.some(c => c.body === "Deleted complaint")).toBeFalse();
  });

  complaintTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentWithStudent(tx, "OrderDesc");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await tx
      .insert(complaints)
      .values({
        parentId: parent.id,
        category: "OTHER",
        submitterEmail: "earlier@test.com",
        body: "Earlier complaint",
        status: "UNANSWERED",
        createdAt: earlier,
        updatedAt: earlier,
      });

    await tx
      .insert(complaints)
      .values({
        parentId: parent.id,
        category: "OTHER",
        submitterEmail: "later@test.com",
        body: "Later complaint",
        status: "UNANSWERED",
        createdAt: now,
        updatedAt: now,
      });

    const result = await ComplaintRepository.getComplaintsByParent(parent.id, tx);

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
  });

  complaintTest("returns empty array for unknown parentId", async tx => {
    const result = await ComplaintRepository.getComplaintsByParent(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toEqual([]);
  });

  complaintTest("includes studentName from join when studentId is set", async tx => {
    const { parent, student } = await setupParentWithStudent(tx, "StudJoin");

    await insertComplaint(tx, parent.id, { studentId: student.id, body: "With student" });

    const result = await ComplaintRepository.getComplaintsByParent(parent.id, tx);

    const matched = result.find(c => c.body === "With student");
    expect(matched).toBeDefined();
    expect(matched?.studentName).toBe("StudJoin Student");
  });
});

describe("ComplaintRepository — getAdminComplaintQueue", () => {
  complaintTest("returns all complaints with parent and student names", async tx => {
    const { parent, student, user } = await setupParentWithStudent(tx, "AdminQ");

    await insertComplaint(tx, parent.id, {
      studentId: student.id,
      body: "Admin queue complaint",
    });

    const result = await ComplaintRepository.getAdminComplaintQueue(
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);

    const matched = result.rows.find(r => r.body === "Admin queue complaint");
    expect(matched).toBeDefined();
    expect(matched?.parentName).toBe("AdminQ Parent");
    expect(matched?.studentName).toBe("AdminQ Student");
    expect(matched?.parentId).toBe(parent.id);
    expect(typeof matched?.responseCount).toBe("number");
  });

  complaintTest("filters by status", async tx => {
    const { parent } = await setupParentWithStudent(tx, "StatusFilt");

    await insertComplaint(tx, parent.id, { status: "UNANSWERED", body: "Unanswered one" });
    await insertComplaint(tx, parent.id, { status: "ANSWERED", body: "Answered one" });

    const unanswered = await ComplaintRepository.getAdminComplaintQueue(
      { limit: 50, offset: 0, status: "UNANSWERED" },
      tx
    );

    expect(unanswered.rows.every(r => r.status === "UNANSWERED")).toBeTrue();
    expect(unanswered.rows.some(r => r.body === "Answered one")).toBeFalse();
  });

  complaintTest("filters by search term on parent name", async tx => {
    const unique = `SearchParent-${randomUUID().slice(0, 8)}`;
    const user = await createTestUser(tx, { name: unique, email: `${unique}@test.com` });
    const parent = await createTestParent(tx, user.id);

    await insertComplaint(tx, parent.id, { body: "Searchable complaint" });

    const result = await ComplaintRepository.getAdminComplaintQueue(
      { limit: 50, offset: 0, search: unique },
      tx
    );

    expect(result.rows.some(r => r.body === "Searchable complaint")).toBeTrue();
  });

  complaintTest("supports pagination with limit and offset", async tx => {
    const { parent } = await setupParentWithStudent(tx, "Paginate");

    for (let i = 0; i < 3; i++) {
      await insertComplaint(tx, parent.id, { body: `Paginated complaint ${i}` });
    }

    const page1 = await ComplaintRepository.getAdminComplaintQueue(
      { limit: 2, offset: 0 },
      tx
    );
    const page2 = await ComplaintRepository.getAdminComplaintQueue(
      { limit: 2, offset: 2 },
      tx
    );

    expect(page1.rows.length).toBeLessThanOrEqual(2);
    expect(page2.rows.length).toBeLessThanOrEqual(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(3);
  });

  complaintTest("excludes soft-deleted complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "AdminSoft");

    await insertComplaint(tx, parent.id, { body: "Visible complaint" });
    await insertComplaint(tx, parent.id, { body: "Hidden complaint", deletedAt: new Date() });

    const result = await ComplaintRepository.getAdminComplaintQueue(
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.rows.some(r => r.body === "Visible complaint")).toBeTrue();
    expect(result.rows.some(r => r.body === "Hidden complaint")).toBeFalse();
  });
});

describe("ComplaintRepository — getComplaintById", () => {
  complaintTest("returns complaint with joined parent and student names", async tx => {
    const { parent, student } = await setupParentWithStudent(tx, "ById");

    const inserted = await insertComplaint(tx, parent.id, {
      studentId: student.id,
      body: "Get by ID complaint",
    });

    const result = await ComplaintRepository.getComplaintById(inserted.id, tx);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(inserted.id);
    expect(result?.parentName).toBe("ById Parent");
    expect(result?.studentName).toBe("ById Student");
    expect(result?.body).toBe("Get by ID complaint");
  });

  complaintTest("returns null for non-existent complaint ID", async tx => {
    const result = await ComplaintRepository.getComplaintById(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toBeNull();
  });

  complaintTest("excludes soft-deleted complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "ByIdSoft");

    const inserted = await insertComplaint(tx, parent.id, {
      body: "Soft deleted by id",
      deletedAt: new Date(),
    });

    const result = await ComplaintRepository.getComplaintById(inserted.id, tx);
    expect(result).toBeNull();
  });
});

describe("ComplaintRepository — getComplaintMetrics", () => {
  complaintTest("returns correct counts for unanswered and answered", async tx => {
    const { parent } = await setupParentWithStudent(tx, "Metrics");

    const beforeMetrics = await ComplaintRepository.getComplaintMetrics(tx);
    const initialUnanswered = beforeMetrics.unanswered;
    const initialAnswered = beforeMetrics.answered;

    await insertComplaint(tx, parent.id, { status: "UNANSWERED" });
    await insertComplaint(tx, parent.id, { status: "UNANSWERED" });
    await insertComplaint(tx, parent.id, { status: "ANSWERED" });

    const metrics = await ComplaintRepository.getComplaintMetrics(tx);

    expect(metrics.unanswered).toBe(initialUnanswered + 2);
    expect(metrics.answered).toBe(initialAnswered + 1);
    expect(typeof metrics.avgResolutionHours).toBe("number");
  });

  complaintTest("excludes soft-deleted from metrics", async tx => {
    const { parent } = await setupParentWithStudent(tx, "MetricsSoft");

    await insertComplaint(tx, parent.id, { status: "UNANSWERED", deletedAt: new Date() });

    const beforeMetrics = await ComplaintRepository.getComplaintMetrics(tx);

    await insertComplaint(tx, parent.id, { status: "UNANSWERED" });

    const afterMetrics = await ComplaintRepository.getComplaintMetrics(tx);

    expect(afterMetrics.unanswered).toBe(beforeMetrics.unanswered + 1);
  });
});

describe("ComplaintRepository — getUnansweredComplaints", () => {
  complaintTest("returns only UNANSWERED complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "Unans");

    await insertComplaint(tx, parent.id, { status: "UNANSWERED", body: "Unanswered X" });
    await insertComplaint(tx, parent.id, { status: "ANSWERED", body: "Answered X" });

    const result = await ComplaintRepository.getUnansweredComplaints(100, tx);

    expect(result.some(r => r.body === "Unanswered X")).toBeTrue();
    expect(result.some(r => r.body === "Answered X")).toBeFalse();
  });

  complaintTest("excludes soft-deleted complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "UnansSoft");

    await insertComplaint(tx, parent.id, {
      status: "UNANSWERED",
      body: "Deleted unanswered",
      deletedAt: new Date(),
    });

    const result = await ComplaintRepository.getUnansweredComplaints(100, tx);

    expect(result.some(r => r.body === "Deleted unanswered")).toBeFalse();
  });

  complaintTest("respects the limit parameter", async tx => {
    const { parent } = await setupParentWithStudent(tx, "UnansLimit");

    for (let i = 0; i < 5; i++) {
      await insertComplaint(tx, parent.id, { status: "UNANSWERED", body: `Limit test ${i}` });
    }

    const result = await ComplaintRepository.getUnansweredComplaints(2, tx);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  complaintTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentWithStudent(tx, "UnansOrder");

    const now = new Date();
    const earlier = new Date(now.getTime() - 120000);

    await tx.insert(complaints).values({
      parentId: parent.id,
      category: "OTHER",
      submitterEmail: "earlier-order@test.com",
      body: "Earlier unanswered",
      status: "UNANSWERED",
      createdAt: earlier,
      updatedAt: earlier,
    });

    await tx.insert(complaints).values({
      parentId: parent.id,
      category: "OTHER",
      submitterEmail: "later-order@test.com",
      body: "Later unanswered",
      status: "UNANSWERED",
      createdAt: now,
      updatedAt: now,
    });

    const result = await ComplaintRepository.getUnansweredComplaints(100, tx);
    const filtered = result.filter(r => r.body === "Earlier unanswered" || r.body === "Later unanswered");

    expect(filtered.length).toBe(2);
    expect(filtered[0].body).toBe("Later unanswered");
    expect(filtered[1].body).toBe("Earlier unanswered");
  });
});

describe("ComplaintRepository — non-transactional coverage fallback", () => {
  test("supports calls without tx for getComplaintsByParent", async () => {
    const result = await ComplaintRepository.getComplaintsByParent(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toEqual([]);
  });

  test("supports calls without tx for getComplaintById", async () => {
    const result = await ComplaintRepository.getComplaintById(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toBeNull();
  });

  test("supports calls without tx for getAdminComplaintQueue", async () => {
    const result = await ComplaintRepository.getAdminComplaintQueue({ limit: 1, offset: 0 });
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe("number");
  });

  test("supports calls without tx for getComplaintMetrics", async () => {
    const metrics = await ComplaintRepository.getComplaintMetrics();
    expect(typeof metrics.unanswered).toBe("number");
    expect(typeof metrics.answered).toBe("number");
    expect(typeof metrics.avgResolutionHours).toBe("number");
  });

  test("supports calls without tx for getUnansweredComplaints", async () => {
    const result = await ComplaintRepository.getUnansweredComplaints(1);
    expect(Array.isArray(result)).toBeTrue();
  });
});

describe("ComplaintRepository — transaction rollback", () => {
  test("rolls back complaint creation on subsequent failure", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "RB Parent", email: `rb-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const created = await ComplaintRepository.submitComplaint(
        {
          parentId: parent.id,
          category: "OTHER",
          submitterEmail: "rb@test.com",
          body: "Should be rolled back",
        },
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const [found] = await db.select().from(complaints).where(eq(complaints.id, createdId)).limit(1);
      expect(found).toBeUndefined();
    }
  });
});
```

---

#### Step 2 — Create `backend/db/test/repo/complaint-response.repository.test.ts`

```typescript
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ComplaintResponseRepository } from "@/backend/db/repo/complaint-response.repository";
import { complaints, complaintResponses } from "@/backend/db/schema";
import { ComplaintStatus } from "@/shared/lib/enum";
import { createTestParent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";
import type { DBTransaction } from "@/backend/db/db.types";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function responseTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupComplaintForResponse(tx: DBTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);

  const now = new Date();
  const [complaint] = await tx
    .insert(complaints)
    .values({
      parentId: parent.id,
      category: "OTHER",
      submitterEmail: `${namePrefix.toLowerCase()}@test.com`,
      body: `${namePrefix} complaint body`,
      status: ComplaintStatus.UNANSWERED,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { user, parent, complaint };
}

describe("ComplaintResponseRepository — createResponse", () => {
  responseTest("creates a response and updates complaint status to ANSWERED", async tx => {
    const { complaint, user } = await setupComplaintForResponse(tx, "CreateResp");

    const result = await ComplaintResponseRepository.createResponse(
      {
        complaintId: complaint.id,
        responderUserId: user.id,
        body: "We will look into this",
        emailSent: false,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.complaintId).toBe(complaint.id);
    expect(result.responderUserId).toBe(user.id);
    expect(result.body).toBe("We will look into this");
    expect(result.emailSent).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);

    const [updatedComplaint] = await tx
      .select({ status: complaints.status })
      .from(complaints)
      .where(eq(complaints.id, complaint.id))
      .limit(1);

    expect(updatedComplaint?.status).toBe(ComplaintStatus.ANSWERED);
  });

  responseTest("persists emailSent flag as true", async tx => {
    const { complaint, user } = await setupComplaintForResponse(tx, "EmailSent");

    const result = await ComplaintResponseRepository.createResponse(
      {
        complaintId: complaint.id,
        responderUserId: user.id,
        body: "Response with email",
        emailSent: true,
      },
      tx
    );

    expect(result.emailSent).toBe(true);
  });

  responseTest("creates response with null responderUserId", async tx => {
    const { complaint } = await setupComplaintForResponse(tx, "NullResp");

    const result = await ComplaintResponseRepository.createResponse(
      {
        complaintId: complaint.id,
        responderUserId: null,
        body: "Anonymous response",
        emailSent: false,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.responderUserId).toBeNull();
  });

  responseTest("fails with invalid complaintId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      ComplaintResponseRepository.createResponse(
        {
          complaintId: "00000000-0000-0000-0000-000000000000",
          body: "Should fail",
          emailSent: false,
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  responseTest("creates its own transaction when tx is not provided", async tx => {
    const { complaint, user } = await setupComplaintForResponse(tx, "NoTx");

    const result = await ComplaintResponseRepository.createResponse({
      complaintId: complaint.id,
      responderUserId: user.id,
      body: "Response without tx",
      emailSent: false,
    });

    expect(result).toBeDefined();
    expect(result.complaintId).toBe(complaint.id);
  });
});

describe("ComplaintResponseRepository — getResponsesByComplaint", () => {
  responseTest("returns responses ordered by createdAt DESC with responder name", async tx => {
    const { complaint, user } = await setupComplaintForResponse(tx, "GetResp");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await tx.insert(complaintResponses).values({
      complaintId: complaint.id,
      responderUserId: user.id,
      body: "Earlier response",
      emailSent: false,
      createdAt: earlier,
    });

    await tx.insert(complaintResponses).values({
      complaintId: complaint.id,
      responderUserId: user.id,
      body: "Later response",
      emailSent: true,
      createdAt: now,
    });

    const result = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id, tx);

    expect(result.length).toBe(2);
    expect(result[0].body).toBe("Later response");
    expect(result[1].body).toBe("Earlier response");
    expect(result[0].responderName).toBe("GetResp Parent");
    expect(result[0].emailSent).toBe(true);
    expect(result[1].emailSent).toBe(false);
  });

  responseTest("returns empty array for complaint with no responses", async tx => {
    const { complaint } = await setupComplaintForResponse(tx, "EmptyResp");

    const result = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id, tx);
    expect(result).toEqual([]);
  });

  responseTest("returns empty array for unknown complaintId", async tx => {
    const result = await ComplaintResponseRepository.getResponsesByComplaint(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toEqual([]);
  });

  responseTest("returns null responderName when responderUserId is null", async tx => {
    const { complaint } = await setupComplaintForResponse(tx, "NullName");

    await tx.insert(complaintResponses).values({
      complaintId: complaint.id,
      responderUserId: null,
      body: "Anonymous response",
      emailSent: false,
      createdAt: new Date(),
    });

    const result = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id, tx);

    expect(result.length).toBe(1);
    expect(result[0].responderName).toBeNull();
    expect(result[0].body).toBe("Anonymous response");
  });
});

describe("ComplaintResponseRepository — non-transactional coverage fallback", () => {
  test("supports getResponsesByComplaint without tx", async () => {
    const result = await ComplaintResponseRepository.getResponsesByComplaint(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toEqual([]);
  });
});

describe("ComplaintResponseRepository — transaction rollback", () => {
  test("rolls back response creation on subsequent failure within tx", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const { complaint, user } = await setupComplaintForResponse(tx, "Rollback");

      const created = await ComplaintResponseRepository.createResponse(
        {
          complaintId: complaint.id,
          responderUserId: user.id,
          body: "Should be rolled back",
          emailSent: false,
        },
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const [found] = await db
        .select()
        .from(complaintResponses)
        .where(eq(complaintResponses.id, createdId))
        .limit(1);
      expect(found).toBeUndefined();
    }
  });
});
```

---

#### Step 3 — Create `backend/db/test/repo/suggestion.repository.test.ts`

```typescript
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SuggestionRepository } from "@/backend/db/repo/suggestion.repository";
import { suggestions } from "@/backend/db/schema";
import { createTestParent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";
import type { DBTransaction } from "@/backend/db/db.types";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function suggestionTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupParentForSuggestion(tx: DBTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  return { user, parent };
}

async function insertSuggestion(
  tx: DBTransaction,
  parentId: string,
  overrides: Partial<{
    submitterName: string;
    body: string;
    emailSentAt: Date | null;
  }> = {}
) {
  const now = new Date();
  const [created] = await tx
    .insert(suggestions)
    .values({
      parentId,
      submitterName: overrides.submitterName ?? "Default Submitter",
      body: overrides.body ?? "Default suggestion body",
      emailSentAt: overrides.emailSentAt ?? null,
      createdAt: now,
    })
    .returning();
  return created;
}

describe("SuggestionRepository — submitSuggestion", () => {
  suggestionTest("creates a suggestion record with valid input", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "Submit");

    const result = await SuggestionRepository.submitSuggestion(
      {
        parentId: parent.id,
        submitterName: "Submit Parent",
        body: "Add dark mode please",
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.parentId).toBe(parent.id);
    expect(result.submitterName).toBe("Submit Parent");
    expect(result.body).toBe("Add dark mode please");
    expect(result.emailSentAt).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  suggestionTest("fails with invalid parentId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      SuggestionRepository.submitSuggestion(
        {
          parentId: "00000000-0000-0000-0000-000000000000",
          submitterName: "Bad Parent",
          body: "Should fail",
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("SuggestionRepository — getSuggestionsForAdmin", () => {
  suggestionTest("returns all suggestions with parent names", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "AdminList");

    await insertSuggestion(tx, parent.id, {
      submitterName: "AdminList Parent",
      body: "Admin visible suggestion",
    });

    const result = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);

    const matched = result.rows.find(r => r.body === "Admin visible suggestion");
    expect(matched).toBeDefined();
    expect(matched?.parentName).toBe("AdminList Parent");
    expect(matched?.submitterName).toBe("AdminList Parent");
  });

  suggestionTest("filters by search term on parent name", async tx => {
    const unique = `SrchSug-${randomUUID().slice(0, 8)}`;
    const user = await createTestUser(tx, { name: unique, email: `${unique}@test.com` });
    const parent = await createTestParent(tx, user.id);

    await insertSuggestion(tx, parent.id, { body: "Searchable suggestion" });

    const result = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 50, offset: 0, search: unique },
      tx
    );

    expect(result.rows.some(r => r.body === "Searchable suggestion")).toBeTrue();
  });

  suggestionTest("filters by PENDING status (emailSentAt IS NULL)", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PendFilter");

    await insertSuggestion(tx, parent.id, { body: "Pending suggestion", emailSentAt: null });
    await insertSuggestion(tx, parent.id, { body: "Reviewed suggestion", emailSentAt: new Date() });

    const result = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 50, offset: 0, status: "PENDING" },
      tx
    );

    expect(result.rows.some(r => r.body === "Pending suggestion")).toBeTrue();
    expect(result.rows.some(r => r.body === "Reviewed suggestion")).toBeFalse();
  });

  suggestionTest("filters by REVIEWED status (emailSentAt IS NOT NULL)", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "RevFilter");

    await insertSuggestion(tx, parent.id, { body: "Pending rev", emailSentAt: null });
    await insertSuggestion(tx, parent.id, { body: "Reviewed rev", emailSentAt: new Date() });

    const result = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 50, offset: 0, status: "REVIEWED" },
      tx
    );

    expect(result.rows.some(r => r.body === "Reviewed rev")).toBeTrue();
    expect(result.rows.some(r => r.body === "Pending rev")).toBeFalse();
  });

  suggestionTest("supports pagination with limit and offset", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PagSug");

    for (let i = 0; i < 3; i++) {
      await insertSuggestion(tx, parent.id, { body: `Paginated suggestion ${i}` });
    }

    const page1 = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 2, offset: 0 },
      tx
    );
    const page2 = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 2, offset: 2 },
      tx
    );

    expect(page1.rows.length).toBeLessThanOrEqual(2);
    expect(page2.rows.length).toBeLessThanOrEqual(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(3);
  });

  suggestionTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "OrdSug");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await tx.insert(suggestions).values({
      parentId: parent.id,
      submitterName: "Earlier Submitter",
      body: "Earlier suggestion",
      createdAt: earlier,
    });

    await tx.insert(suggestions).values({
      parentId: parent.id,
      submitterName: "Later Submitter",
      body: "Later suggestion",
      createdAt: now,
    });

    const result = await SuggestionRepository.getSuggestionsForAdmin(
      { limit: 50, offset: 0 },
      tx
    );

    const filtered = result.rows.filter(
      r => r.body === "Earlier suggestion" || r.body === "Later suggestion"
    );

    expect(filtered.length).toBe(2);
    expect(filtered[0].body).toBe("Later suggestion");
    expect(filtered[1].body).toBe("Earlier suggestion");
  });
});

describe("SuggestionRepository — getSuggestionMetrics", () => {
  suggestionTest("returns correct pending and reviewed counts", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugMetrics");

    const beforeMetrics = await SuggestionRepository.getSuggestionMetrics(tx);
    const initialPending = beforeMetrics.pending;
    const initialReviewed = beforeMetrics.reviewed;

    await insertSuggestion(tx, parent.id, { emailSentAt: null });
    await insertSuggestion(tx, parent.id, { emailSentAt: null });
    await insertSuggestion(tx, parent.id, { emailSentAt: new Date() });

    const metrics = await SuggestionRepository.getSuggestionMetrics(tx);

    expect(metrics.pending).toBe(initialPending + 2);
    expect(metrics.reviewed).toBe(initialReviewed + 1);
    expect(typeof metrics.avgResponseHours).toBe("number");
  });
});

describe("SuggestionRepository — markSuggestionReviewed", () => {
  suggestionTest("sets emailSentAt timestamp on the suggestion", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "MarkRev");

    const suggestion = await insertSuggestion(tx, parent.id, { emailSentAt: null });

    const result = await SuggestionRepository.markSuggestionReviewed(suggestion.id, tx);

    expect(result).toBeDefined();
    expect(result.id).toBe(suggestion.id);
    expect(result.emailSentAt).not.toBeNull();
    expect(result.emailSentAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent suggestion ID", async tx => {
    const error = await expectRepoError(() =>
      SuggestionRepository.markSuggestionReviewed("00000000-0000-0000-0000-000000000000", tx)
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  suggestionTest("can mark an already-reviewed suggestion again", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "ReRev");

    const suggestion = await insertSuggestion(tx, parent.id, { emailSentAt: new Date() });

    const result = await SuggestionRepository.markSuggestionReviewed(suggestion.id, tx);

    expect(result).toBeDefined();
    expect(result.emailSentAt).not.toBeNull();
  });
});

describe("SuggestionRepository — non-transactional coverage fallback", () => {
  test("supports getSuggestionsForAdmin without tx", async () => {
    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 1, offset: 0 });
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe("number");
  });

  test("supports getSuggestionMetrics without tx", async () => {
    const metrics = await SuggestionRepository.getSuggestionMetrics();
    expect(typeof metrics.pending).toBe("number");
    expect(typeof metrics.reviewed).toBe("number");
    expect(typeof metrics.avgResponseHours).toBe("number");
  });
});

describe("SuggestionRepository — transaction rollback", () => {
  test("rolls back suggestion creation on subsequent failure", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const { parent } = await setupParentForSuggestion(tx, "SugRB");

      const created = await SuggestionRepository.submitSuggestion(
        {
          parentId: parent.id,
          submitterName: "RB Submitter",
          body: "Should be rolled back",
        },
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const [found] = await db
        .select()
        .from(suggestions)
        .where(eq(suggestions.id, createdId))
        .limit(1);
      expect(found).toBeUndefined();
    }
  });

  test("rolls back markSuggestionReviewed on subsequent failure", async () => {
    let suggestionId: string | undefined;
    let originalEmailSentAt: Date | null = null;

    await runInRollback(async tx => {
      const { parent } = await setupParentForSuggestion(tx, "MarkRB");
      const suggestion = await insertSuggestion(tx, parent.id, { emailSentAt: null });
      suggestionId = suggestion.id;
      originalEmailSentAt = suggestion.emailSentAt;

      await SuggestionRepository.markSuggestionReviewed(suggestion.id, tx);
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (suggestionId) {
      const [found] = await db
        .select()
        .from(suggestions)
        .where(eq(suggestions.id, suggestionId))
        .limit(1);
      if (found) {
        expect(found.emailSentAt).toBe(originalEmailSentAt);
      }
    }
  });
});
```

---

### Test Execution Requirements

After completing all 3 test files, run the following commands to verify correctness and coverage:

```bash
bun run test:db
bun run test:coverage backend/db/test/repo/complaint.repository.test.ts
bun run test:coverage backend/db/test/repo/complaint-response.repository.test.ts
bun run test:coverage backend/db/test/repo/suggestion.repository.test.ts
```

---

### Success Criteria

- [ ] `complaint.repository.test.ts` — all 6 repository methods tested: `submitComplaint`, `getComplaintsByParent`, `getAdminComplaintQueue`, `getComplaintById`, `getComplaintMetrics`, `getUnansweredComplaints`
- [ ] `complaint-response.repository.test.ts` — all 2 repository methods tested: `createResponse`, `getResponsesByComplaint`
- [ ] `suggestion.repository.test.ts` — all 4 repository methods tested: `submitSuggestion`, `getSuggestionsForAdmin`, `getSuggestionMetrics`, `markSuggestionReviewed`
- [ ] 100% line coverage achieved for all 3 repository source files
- [ ] 100% function coverage achieved for all 3 repository source files
- [ ] All success paths tested (valid input creates records)
- [ ] All failure paths tested (FK violations, non-existent IDs)
- [ ] IDOR protection verified (Parent A cannot access Parent B's complaints via `getComplaintsByParent`)
- [ ] Admin override verified (`getAdminComplaintQueue` returns all complaints regardless of parent)
- [ ] Soft-delete filtering verified (deletedAt IS NULL applied in all relevant queries)
- [ ] Transaction rollback verified (data not persisted after rollback)
- [ ] Non-transactional fallback paths tested (calls without `tx` parameter)
- [ ] Ordering verified (createdAt DESC in all relevant queries)
- [ ] Pagination verified (limit/offset in admin queue and suggestions)
- [ ] Search filtering verified (parent name matching in admin queries)
- [ ] Status filtering verified (UNANSWERED/ANSWERED in complaint queue, PENDING/REVIEWED in suggestions)
- [ ] `bun run test:db` passes with zero failures
- [ ] No `console` methods used — all logging via `testLogger` or omitted
- [ ] No `any` type overrides used
- [ ] All tests use `runInRollback` wrapper
- [ ] All repo method calls pass `tx` inside `runInRollback`

---

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
