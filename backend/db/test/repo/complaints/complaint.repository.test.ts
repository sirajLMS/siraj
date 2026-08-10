import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ComplaintRepository } from "@/backend/db/repo";
import { complaintFiles, complaints, storageFiles } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { ComplaintCategory, ComplaintStatus } from "@/backend/enum";
import type { ComplaintSubmitInput } from "@/backend/types";

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
    const didRun = { value: false };
    await runInRollback(async tx => {
      await fn(tx);
      didRun.value = true;
    });
    expect(didRun.value).toBeTrue();
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

async function insertStorageFile(tx: DBTransaction, filePath: string) {
  const [file] = await tx
    .insert(storageFiles)
    .values({
      path: filePath,
      isProtected: false,
    })
    .returning();
  return file;
}

async function submitComplaintWithoutStudent(tx: DBTransaction, namePrefix: string, input: ComplaintSubmitInput) {
  const { parent } = await setupParentWithStudent(tx, namePrefix);
  const result = await ComplaintRepository.submitComplaint(input, parent.id, tx);
  expect(result).toBeDefined();
  expect(result.studentId).toBeNull();
  return result;
}

async function insertTimedComplaintPair(
  tx: DBTransaction,
  parentId: string,
  earlierBody: string,
  laterBody: string,
  earlierOffsetMs = 60000
) {
  const now = new Date();
  const earlier = new Date(now.getTime() - earlierOffsetMs);
  await tx.insert(complaints).values({
    parentId,
    category: "OTHER",
    submitterEmail: `earlier-${randomUUID()}@test.com`,
    body: earlierBody,
    status: "UNANSWERED",
    createdAt: earlier,
    updatedAt: earlier,
  });
  await tx.insert(complaints).values({
    parentId,
    category: "OTHER",
    submitterEmail: `later-${randomUUID()}@test.com`,
    body: laterBody,
    status: "UNANSWERED",
    createdAt: now,
    updatedAt: now,
  });
}

describe("ComplaintRepository — submitComplaint", () => {
  complaintTest("creates a complaint record with valid input", async tx => {
    const { parent, student } = await setupParentWithStudent(tx, "Submit");

    const result = await ComplaintRepository.submitComplaint(
      {
        studentId: student.id,
        category: ComplaintCategory.REGARDING_TEACHER,
        submitterEmail: "parent@test.com",
        body: "Teacher was rude",
      },
      parent.id,
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
    const result = await submitComplaintWithoutStudent(tx, "NullStud", {
      studentId: null,
      category: ComplaintCategory.REGARDING_SYSTEM,
      submitterEmail: "null-stud@test.com",
      body: "System is slow",
    });
    expect(result.category).toBe("REGARDING_SYSTEM");
  });

  complaintTest("creates complaint without studentId field", async tx => {
    await submitComplaintWithoutStudent(tx, "NoStud", {
      category: ComplaintCategory.OTHER,
      submitterEmail: "no-stud@test.com",
      body: "General feedback",
    });
  });

  complaintTest("fails with invalid parentId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      ComplaintRepository.submitComplaint(
        {
          category: ComplaintCategory.OTHER,
          submitterEmail: "bad@test.com",
          body: "Should fail",
        },
        "00000000-0000-0000-0000-000000000000",
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

    const resultA = await ComplaintRepository.getComplaintsByParent(parentA.parent.id, null, tx);
    const resultB = await ComplaintRepository.getComplaintsByParent(parentB.parent.id, null, tx);

    expect(resultA.complaints.length).toBeGreaterThanOrEqual(1);
    expect(resultA.complaints.some(c => c.body === "Parent A complaint")).toBeTrue();
    expect(resultA.complaints.some(c => c.body === "Parent B complaint")).toBeFalse();

    expect(resultB.complaints.length).toBeGreaterThanOrEqual(1);
  });

  complaintTest("excludes soft-deleted complaints", async tx => {
    const { parent } = await setupParentWithStudent(tx, "SoftDel");

    await insertComplaint(tx, parent.id, { body: "Active complaint" });
    await insertComplaint(tx, parent.id, { body: "Deleted complaint", deletedAt: new Date() });

    const result = await ComplaintRepository.getComplaintsByParent(parent.id, null, tx);

    expect(result.complaints.some(c => c.body === "Active complaint")).toBeTrue();
    expect(result.complaints.some(c => c.body === "Deleted complaint")).toBeFalse();
  });

  complaintTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentWithStudent(tx, "OrderDesc");
    await insertTimedComplaintPair(tx, parent.id, "Earlier complaint", "Later complaint");
    const result = await ComplaintRepository.getComplaintsByParent(parent.id, null, tx);
    expect(result.complaints.length).toBeGreaterThanOrEqual(2);
    expect(result.complaints[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.complaints[1].createdAt.getTime());
  });

  complaintTest("returns empty array for unknown parentId", async tx => {
    const result = await ComplaintRepository.getComplaintsByParent("00000000-0000-0000-0000-000000000000", null, tx);
    expect(result.complaints).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  complaintTest("includes studentName from join when studentId is set", async tx => {
    const { parent, student } = await setupParentWithStudent(tx, "StudJoin");

    await insertComplaint(tx, parent.id, { studentId: student.id, body: "With student" });

    const result = await ComplaintRepository.getComplaintsByParent(parent.id, null, tx);

    const matched = result.complaints.find(c => c.body === "With student");
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

    expect(result.metrics.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.complaints.length).toBeGreaterThanOrEqual(1);

    const matched = result.complaints.find(r => r.body === "Admin queue complaint");
    expect(matched).toBeDefined();
    expect(matched?.parentName).toBe("AdminQ Parent");
    expect(matched?.studentName).toBe("AdminQ Student");
    expect(typeof matched?.responseCount).toBe("number");
  });

  complaintTest("filters by status", async tx => {
    const { parent } = await setupParentWithStudent(tx, "StatusFilt");

    await insertComplaint(tx, parent.id, { status: "UNANSWERED", body: "Unanswered one" });
    await insertComplaint(tx, parent.id, { status: "ANSWERED", body: "Answered one" });

    const unanswered = await ComplaintRepository.getComplaintQueue({ limit: 50, offset: 0, status: "UNANSWERED" }, tx);

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

    await Promise.all(
      Array.from({ length: 3 }, (_, i) => insertComplaint(tx, parent.id, { body: `Paginated complaint ${i}` }))
    );

    const page1 = await ComplaintRepository.getComplaintQueue({ limit: 2, offset: 0 }, tx);
    const page2 = await ComplaintRepository.getComplaintQueue({ limit: 2, offset: 2 }, tx);

    expect(page1.complaints.length).toBeLessThanOrEqual(2);
    expect(page2.complaints.length).toBeLessThanOrEqual(2);
    expect(page1.metrics.totalCount).toBeGreaterThanOrEqual(3);
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

    const beforeMetrics = await ComplaintRepository.getComplaintMetrics(undefined, tx);
    const initialUnanswered = beforeMetrics.unanswered;
    const initialAnswered = beforeMetrics.answered;

    await insertComplaint(tx, parent.id, { status: "UNANSWERED" });
    await insertComplaint(tx, parent.id, { status: "UNANSWERED" });
    await insertComplaint(tx, parent.id, { status: "ANSWERED" });

    const metrics = await ComplaintRepository.getComplaintMetrics(undefined, tx);

    expect(metrics.unanswered).toBe(initialUnanswered + 2);
    expect(metrics.answered).toBe(initialAnswered + 1);
    expect(typeof metrics.avgResolutionHours).toBe("number");
  });

  complaintTest("excludes soft-deleted from metrics", async tx => {
    const { parent } = await setupParentWithStudent(tx, "MetricsSoft");

    const beforeMetrics = await ComplaintRepository.getComplaintMetrics(undefined, tx);

    await insertComplaint(tx, parent.id, { status: "UNANSWERED", deletedAt: new Date() });

    const afterMetrics = await ComplaintRepository.getComplaintMetrics(undefined, tx);

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

    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        insertComplaint(tx, parent.id, { status: "UNANSWERED", body: `Limit test ${i}` })
      )
    );

    const result = await ComplaintRepository.getUnansweredComplaints(2, tx);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  complaintTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentWithStudent(tx, "UnansOrder");
    await insertTimedComplaintPair(tx, parent.id, "Earlier unanswered", "Later unanswered", 120000);
    const result = await ComplaintRepository.getUnansweredComplaints(100, tx);
    const filtered = result.filter(r => r.body === "Earlier unanswered" || r.body === "Later unanswered");
    expect(filtered).toHaveLength(2);
    expect(filtered[0].body).toBe("Later unanswered");
    expect(filtered[1].body).toBe("Earlier unanswered");
  });
});

describe("ComplaintRepository — getComplaintFiles", () => {
  complaintTest("returns files with storage file details for a complaint", async tx => {
    const { parent } = await setupParentWithStudent(tx, "FileGet");

    const complaint = await insertComplaint(tx, parent.id, { body: "Complaint with files" });

    const file1 = await insertStorageFile(tx, `complaints/test-file-1-${randomUUID()}.pdf`);
    const file2 = await insertStorageFile(tx, `complaints/test-file-2-${randomUUID()}.png`);

    await tx.insert(complaintFiles).values({
      fileId: file1.id,
      complaintId: complaint.id,
      usageType: "attachment",
    });

    await tx.insert(complaintFiles).values({
      fileId: file2.id,
      complaintId: complaint.id,
      usageType: "attachment",
    });

    const result = await ComplaintRepository.getComplaintFiles(complaint.id, tx);

    expect(result).toHaveLength(2);
    expect(result.some(f => f.publicUrl === file1.path)).toBeTrue();
    expect(result.some(f => f.publicUrl === file2.path)).toBeTrue();
    expect(result.every(f => f.usageType === "attachment")).toBeTrue();
    expect(result.every(f => typeof f.fileId === "string")).toBeTrue();
  });

  complaintTest("returns empty array for complaint with no files", async tx => {
    const { parent } = await setupParentWithStudent(tx, "FileEmpty");

    const complaint = await insertComplaint(tx, parent.id, { body: "Complaint without files" });

    const result = await ComplaintRepository.getComplaintFiles(complaint.id, tx);

    expect(result).toEqual([]);
  });

  complaintTest("returns empty array for unknown complaintId", async tx => {
    const result = await ComplaintRepository.getComplaintFiles("00000000-0000-0000-0000-000000000000", tx);
    expect(result).toEqual([]);
  });

  complaintTest("includes file metadata fields (id, publicUrl, usageType, createdAt)", async tx => {
    const { parent } = await setupParentWithStudent(tx, "FileMeta");

    const complaint = await insertComplaint(tx, parent.id, { body: "Complaint with metadata" });
    const file = await insertStorageFile(tx, `complaints/meta-file-${randomUUID()}.docx`);

    await tx.insert(complaintFiles).values({
      fileId: file.id,
      complaintId: complaint.id,
      usageType: "evidence",
    });

    const result = await ComplaintRepository.getComplaintFiles(complaint.id, tx);

    expect(result).toHaveLength(1);
    expect(result[0].fileId).toBe(file.id);
    expect(result[0].publicUrl).toBe(file.path);
    expect(result[0].usageType).toBe("evidence");
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});

describe("ComplaintRepository — non-transactional coverage fallback", () => {
  test("supports calls without tx for getComplaintsByParent", async () => {
    const result = await ComplaintRepository.getComplaintsByParent("00000000-0000-0000-0000-000000000000");
    expect(result.complaints).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  test("supports calls without tx for getComplaintById", async () => {
    const result = await ComplaintRepository.getComplaintById("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });

  test("supports calls without tx for getAdminComplaintQueue", async () => {
    const result = await ComplaintRepository.getComplaintQueue({ limit: 1, offset: 0 });
    expect(result.complaints.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.metrics.totalCount).toBe("number");
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

  test("supports calls without tx for getComplaintFiles", async () => {
    const result = await ComplaintRepository.getComplaintFiles("00000000-0000-0000-0000-000000000000");
    expect(result).toEqual([]);
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
          category: ComplaintCategory.OTHER,
          submitterEmail: "rb@test.com",
          body: "Should be rolled back",
        },
        parent.id,
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
