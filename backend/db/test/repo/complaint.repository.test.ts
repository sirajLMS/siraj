import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ComplaintRepository } from "@/backend/db/repo/complaint.repository";
import { complaints } from "@/backend/db/schema";
import { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import { createTestParent, createTestStudent, createTestUser } from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

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

function complaintTest(name: string, fn: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupParentWithStudent(tx: DbTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  const student = await createTestStudent(tx, parent.id, { name: `${namePrefix} Student` });
  return { user, parent, student };
}

async function insertComplaint(
  tx: DbTransaction,
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
        category: ComplaintCategory.REGARDING_TEACHER,
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
        category: ComplaintCategory.REGARDING_SYSTEM,
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
        category: ComplaintCategory.OTHER,
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
          category: ComplaintCategory.OTHER,
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

    await tx.insert(complaints).values({
      parentId: parent.id,
      category: "OTHER",
      submitterEmail: "earlier@test.com",
      body: "Earlier complaint",
      status: "UNANSWERED",
      createdAt: earlier,
      updatedAt: earlier,
    });

    await tx.insert(complaints).values({
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
    const result = await ComplaintRepository.getComplaintsByParent("00000000-0000-0000-0000-000000000000", tx);
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
    const { parent, student } = await setupParentWithStudent(tx, "AdminQ");

    await insertComplaint(tx, parent.id, {
      studentId: student.id,
      body: "Admin queue complaint",
    });

    const result = await ComplaintRepository.getComplaintQueue({ limit: 50, offset: 0 }, tx);

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.complaints.length).toBeGreaterThanOrEqual(1);

    const matched = result.complaints.find(r => r.body === "Admin queue complaint");
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

    const unanswered = await ComplaintRepository.getComplaintQueue(
      { limit: 50, offset: 0, status: "UNANSWERED" },
      tx
    );

    expect(unanswered.complaints.every(r => r.status === "UNANSWERED")).toBeTrue();
    expect(unanswered.complaints.some(r => r.body === "Answered one")).toBeFalse();
  });

  complaintTest("filters by search term on parent name", async tx => {
    const unique = `SearchParent-${randomUUID().slice(0, 8)}`;
    const user = await createTestUser(tx, { name: unique, email: `${unique}@test.com` });
    const parent = await createTestParent(tx, user.id);

    await insertComplaint(tx, parent.id, { body: "Searchable complaint" });

    const result = await ComplaintRepository.getComplaintQueue({ limit: 50, offset: 0, search: unique }, tx);

    expect(result.complaints.some(r => r.body === "Searchable complaint")).toBeTrue();
  });

  complaintTest("supports pagination with limit and offset", async tx => {
    const { parent } = await setupParentWithStudent(tx, "Paginate");

    for (let i = 0; i < 3; i++) {
      await insertComplaint(tx, parent.id, { body: `Paginated complaint ${i}` });
    }

    const page1 = await ComplaintRepository.getComplaintQueue({ limit: 2, offset: 0 }, tx);
    const page2 = await ComplaintRepository.getComplaintQueue({ limit: 2, offset: 2 }, tx);

    expect(page1.complaints.length).toBeLessThanOrEqual(2);
    expect(page2.complaints.length).toBeLessThanOrEqual(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(3);
  });

  complaintTest("excludes soft-deleted complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "AdminSoft");

    await insertComplaint(tx, parent.id, { body: "Visible complaint" });
    await insertComplaint(tx, parent.id, { body: "Hidden complaint", deletedAt: new Date() });

    const result = await ComplaintRepository.getComplaintQueue({ limit: 50, offset: 0 }, tx);

    expect(result.complaints.some(r => r.body === "Visible complaint")).toBeTrue();
    expect(result.complaints.some(r => r.body === "Hidden complaint")).toBeFalse();
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
    const result = await ComplaintRepository.getComplaintById("00000000-0000-0000-0000-000000000000", tx);
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

    const beforeMetrics = await ComplaintRepository.getComplaintMetrics(tx);

    await insertComplaint(tx, parent.id, { status: "UNANSWERED", deletedAt: new Date() });

    const afterMetrics = await ComplaintRepository.getComplaintMetrics(tx);

    expect(afterMetrics.unanswered).toBe(beforeMetrics.unanswered);
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
    const result = await ComplaintRepository.getComplaintsByParent("00000000-0000-0000-0000-000000000000");
    expect(result).toEqual([]);
  });

  test("supports calls without tx for getComplaintById", async () => {
    const result = await ComplaintRepository.getComplaintById("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });

  test("supports calls without tx for getAdminComplaintQueue", async () => {
    const result = await ComplaintRepository.getComplaintQueue({ limit: 1, offset: 0 });
    expect(result.complaints.length).toBeGreaterThanOrEqual(0);
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
          category: ComplaintCategory.OTHER,
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
