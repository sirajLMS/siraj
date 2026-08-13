import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { LessonReportRepository } from "@/backend/db/repo/classes";
import { lessonReports } from "@/backend/db/schema";
import { createTestLessonReport, createTestUser, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AttendanceEvaluation, LessonReportStatus } from "@/backend/enum";
import {
  type ClassInstanceSelectType,
  type DBTransaction,
  type LessonReportSelectType,
  PaginationArgs,
} from "@/backend/types";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (!(errorCaught instanceof Error)) {
    throw new Error("Expected thrown value to be an Error instance");
  }
  return errorCaught;
}

function requireInstance(instance: ClassInstanceSelectType | null): ClassInstanceSelectType {
  if (!instance) {
    throw new Error("setupTestEntities returned a null instance — pass skipInstance:false");
  }
  return instance;
}

type ReportChain = Awaited<ReturnType<typeof setupTestEntities>> & {
  adminUser: Awaited<ReturnType<typeof createTestUser>>;
};

async function setupReportChain(tx: DBTransaction): Promise<ReportChain> {
  const entities = await setupTestEntities(tx, "LessonReport", { classesRemaining: 10 });
  const adminUser = await createTestUser(tx, { name: "Reviewing Admin" });
  return { ...entities, adminUser };
}

/** Sets up the entities, ensures a class instance, and creates a lesson report in one step. */
async function setupReportCreated(tx: DBTransaction): Promise<{
  chain: ReportChain;
  inst: ClassInstanceSelectType;
  report: LessonReportSelectType;
}> {
  const chain = await setupReportChain(tx);
  const inst = requireInstance(chain.instance);
  const report = await createTestLessonReport(tx, inst.id, chain.student.id, chain.teacher.id, chain.adminUser.id);
  return { chain, inst, report };
}

/** Creates a lesson report from an existing chain (no extra setup round-trip). */
async function createReportFromChain(tx: DBTransaction, chain: ReportChain): Promise<LessonReportSelectType> {
  const inst = requireInstance(chain.instance);
  return createTestLessonReport(tx, inst.id, chain.student.id, chain.teacher.id, chain.adminUser.id);
}

/** Builds a standard lesson report insert payload (used by `create` tests). */
function buildReportInsert(
  inst: ClassInstanceSelectType,
  chain: ReportChain,
  overrides: { idempotencyKey: string; now: Date }
) {
  const { student, teacher, adminUser } = chain;
  const { idempotencyKey, now } = overrides;
  return {
    classInstanceId: inst.id,
    studentId: student.id,
    teacherId: teacher.id,
    lessonDate: now,
    durationMinutes: 45,
    attendanceEvaluation: AttendanceEvaluation.PRESENT,
    teacherNotes: "Great work",
    completionPercentage: 80,
    status: LessonReportStatus.PENDING_REVIEW,
    submittedByUserId: adminUser.id,
    submittedAt: now,
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: null,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };
}

/** Creates one pending report for the supplied teacher using a freshly-created class instance. */
async function seedPendingReportForTeacher(
  tx: DBTransaction,
  teacherId: string,
  adminUserId: string,
  idempotencyKey: string,
  prefix: string
): Promise<void> {
  const e = await setupTestEntities(tx, prefix, { classesRemaining: 10 });
  const inst = requireInstance(e.instance);
  await createTestLessonReport(tx, inst.id, e.student.id, teacherId, adminUserId, { idempotencyKey });
}

/** Creates one pending report using its own dedicated admin (for the "no filters" global counter tests). */
async function seedGlobalPendingReport(tx: DBTransaction, prefix: string): Promise<void> {
  const e = await setupTestEntities(tx, prefix, { classesRemaining: 10 });
  const inst = requireInstance(e.instance);
  await createTestLessonReport(tx, inst.id, e.student.id, e.teacher.id, e.parentUser.id, {
    idempotencyKey: `glob-${randomUUID()}`,
  });
}

/** Asserts every report in a list is PENDING_REVIEW and belongs to the supplied teacher. */
function assertAllPendingForTeacher(rows: LessonReportSelectType[], teacherId: string): void {
  for (const r of rows) {
    expect(r.status).toBe(LessonReportStatus.PENDING_REVIEW);
    expect(r.teacherId).toBe(teacherId);
  }
}

describe("LessonReportRepository.findByClassInstanceId", () => {
  test("returns the report linked to a class instance", async () => {
    await runInRollback(async tx => {
      const { inst, report } = await setupReportCreated(tx);

      const found = await LessonReportRepository.findByClassInstanceId(inst.id, tx);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(report.id);
      expect(found?.classInstanceId).toBe(inst.id);
    });
  });

  test("returns null when no report exists for the class instance", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const inst = requireInstance(chain.instance);

      const found = await LessonReportRepository.findByClassInstanceId(inst.id, tx);

      expect(found).toBeNull();
    });
  });
});

describe("LessonReportRepository.findById", () => {
  test("returns the report by its id", async () => {
    await runInRollback(async tx => {
      const { report } = await setupReportCreated(tx);

      const found = await LessonReportRepository.findById(report.id, tx);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(report.id);
    });
  });

  test("returns null for a non-existent id", async () => {
    await runInRollback(async tx => {
      const found = await LessonReportRepository.findById(randomUUID(), tx);
      expect(found).toBeNull();
    });
  });
});

describe("LessonReportRepository.create", () => {
  test("creates a report with PENDING_REVIEW status", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const inst = requireInstance(chain.instance);
      const idempotencyKey = randomUUID();
      const now = new Date();

      const created = await LessonReportRepository.create(buildReportInsert(inst, chain, { idempotencyKey, now }), tx);

      expect(created.id).toBeDefined();
      expect(created.classInstanceId).toBe(inst.id);
      expect(created.studentId).toBe(chain.student.id);
      expect(created.teacherId).toBe(chain.teacher.id);
      expect(created.status).toBe(LessonReportStatus.PENDING_REVIEW);
      expect(created.completionPercentage).toBe(80);
      expect(created.durationMinutes).toBe(45);
      expect(created.teacherNotes).toBe("Great work");
      expect(created.idempotencyKey).toBe(idempotencyKey);
      expect(created.reviewedByUserId).toBeNull();
      expect(created.reviewedAt).toBeNull();
      expect(created.rejectionReason).toBeNull();
    });
  });

  test("rejects a duplicate report for the same class instance (unique index)", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const inst = requireInstance(chain.instance);
      const { student, teacher, adminUser } = chain;
      await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);

      const error = await expectRepoError(() =>
        createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id, {
          idempotencyKey: `unique-${randomUUID()}`,
        })
      );
      expect(error).toBeDefined();
    });
  });
});

describe("LessonReportRepository.updateStatus", () => {
  test("transitions PENDING_REVIEW → APPROVED with reviewedByUserId set", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const report = await createReportFromChain(tx, chain);

      const reviewer = await createTestUser(tx, { name: "Approver" });
      const updated = await LessonReportRepository.updateStatus(
        report.id,
        LessonReportStatus.APPROVED,
        reviewer.id,
        null,
        tx
      );

      expect(updated.id).toBe(report.id);
      expect(updated.status).toBe(LessonReportStatus.APPROVED);
      expect(updated.reviewedByUserId).toBe(reviewer.id);
      expect(updated.reviewedAt).not.toBeNull();
      expect(updated.rejectionReason).toBeNull();
    });
  });

  test("transitions PENDING_REVIEW → REJECTED with rejectionReason set", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const report = await createReportFromChain(tx, chain);

      const reviewer = await createTestUser(tx, { name: "Rejecter" });
      const updated = await LessonReportRepository.updateStatus(
        report.id,
        LessonReportStatus.REJECTED,
        reviewer.id,
        "Insufficient detail",
        tx
      );

      expect(updated.id).toBe(report.id);
      expect(updated.status).toBe(LessonReportStatus.REJECTED);
      expect(updated.reviewedByUserId).toBe(reviewer.id);
      expect(updated.reviewedAt).not.toBeNull();
      expect(updated.rejectionReason).toBe("Insufficient detail");
    });
  });

  test("updating the same report a second time overwrites prior status", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const report = await createReportFromChain(tx, chain);

      const reviewer = await createTestUser(tx, { name: "Second Reviewer" });
      await LessonReportRepository.updateStatus(report.id, LessonReportStatus.APPROVED, reviewer.id, null, tx);
      const secondUpdate = await LessonReportRepository.updateStatus(
        report.id,
        LessonReportStatus.REJECTED,
        reviewer.id,
        "Reversed",
        tx
      );

      expect(secondUpdate.status).toBe(LessonReportStatus.REJECTED);
      expect(secondUpdate.rejectionReason).toBe("Reversed");
    });
  });
});

describe("LessonReportRepository.findPendingReviews", () => {
  test("returns pending reports filtered by teacherId", async () => {
    await runInRollback(async tx => {
      const { chain } = await setupReportCreated(tx);
      const entitiesB = await setupTestEntities(tx, "LessonReportB", { classesRemaining: 5 });
      const instB = requireInstance(entitiesB.instance);
      const adminB = await createTestUser(tx, { name: "Admin B" });
      await createTestLessonReport(tx, instB.id, entitiesB.student.id, entitiesB.teacher.id, adminB.id);

      const pagination = new PaginationArgs({ first: 10, page: 1 });
      const pending = await LessonReportRepository.findPendingReviews({ teacherId: chain.teacher.id }, pagination, tx);

      const matching = pending.filter(r => r.teacherId === chain.teacher.id);
      expect(matching.length).toBeGreaterThanOrEqual(1);
      for (const r of matching) {
        expect(r.status).toBe(LessonReportStatus.PENDING_REVIEW);
      }
    });
  });

  test("supports pagination on pending reviews", async () => {
    await runInRollback(async tx => {
      const { teacher, adminUser } = await setupReportChain(tx);

      await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          seedPendingReportForTeacher(tx, teacher.id, adminUser.id, `pend-${i}-${randomUUID()}`, `PendPage${i}`)
        )
      );

      const pagination = new PaginationArgs({ first: 2, page: 1 });
      const rows = await LessonReportRepository.findPendingReviews({ teacherId: teacher.id }, pagination, tx);

      expect(rows.length).toBeLessThanOrEqual(2);
      assertAllPendingForTeacher(rows, teacher.id);
    });
  });
});

describe("LessonReportRepository.countPendingReviews", () => {
  test("counts pending reports correctly", async () => {
    await runInRollback(async tx => {
      const { teacher, adminUser } = await setupReportChain(tx);

      const initialCount = await LessonReportRepository.countPendingReviews({ teacherId: teacher.id }, tx);

      await Promise.all(
        Array.from({ length: 2 }, (_, i) =>
          seedPendingReportForTeacher(tx, teacher.id, adminUser.id, `count-${i}-${randomUUID()}`, `PendCount${i}`)
        )
      );

      const newCount = await LessonReportRepository.countPendingReviews({ teacherId: teacher.id }, tx);
      expect(newCount).toBe(initialCount + 2);
    });
  });

  test("counts all pending reports when no filters supplied", async () => {
    await runInRollback(async tx => {
      const globalInitial = await LessonReportRepository.countPendingReviews(undefined, tx);

      await seedGlobalPendingReport(tx, "PendGlobalA");
      await seedGlobalPendingReport(tx, "PendGlobalB");

      const globalAfter = await LessonReportRepository.countPendingReviews(undefined, tx);
      expect(globalAfter).toBe(globalInitial + 2);
    });
  });
});

describe("LessonReportRepository.findByIdempotencyKeys", () => {
  test("finds existing reports by their idempotency keys", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const inst = requireInstance(chain.instance);
      const keyA = `lr-${randomUUID()}`;
      const keyB = `lr-${randomUUID()}`;

      const createdA = await createTestLessonReport(
        tx,
        inst.id,
        chain.student.id,
        chain.teacher.id,
        chain.adminUser.id,
        {
          idempotencyKey: keyA,
        }
      );

      const e2 = await setupTestEntities(tx, "IdempB", { classesRemaining: 10 });
      const instB = requireInstance(e2.instance);
      const createdB = await createTestLessonReport(tx, instB.id, e2.student.id, e2.teacher.id, chain.adminUser.id, {
        idempotencyKey: keyB,
      });

      const found = await LessonReportRepository.findByIdempotencyKeys([keyA, keyB], tx);

      expect(found).toHaveLength(2);
      const foundIds = found.map(r => r.id);
      expect(foundIds).toContain(createdA.id);
      expect(foundIds).toContain(createdB.id);
    });
  });

  test("returns empty array for non-existent keys", async () => {
    await runInRollback(async tx => {
      const found = await LessonReportRepository.findByIdempotencyKeys([randomUUID()], tx);
      expect(found).toEqual([]);
    });
  });

  test("returns empty array when keys list is empty", async () => {
    await runInRollback(async tx => {
      const found = await LessonReportRepository.findByIdempotencyKeys([], tx);
      expect(found).toEqual([]);
    });
  });
});

describe("LessonReportRepository — tx propagation", () => {
  test("mutating methods accept and use the supplied transaction", async () => {
    await runInRollback(async tx => {
      const chain = await setupReportChain(tx);
      const inst = requireInstance(chain.instance);

      const created = await LessonReportRepository.create(
        {
          classInstanceId: inst.id,
          studentId: chain.student.id,
          teacherId: chain.teacher.id,
          lessonDate: new Date(),
          durationMinutes: 30,
          attendanceEvaluation: AttendanceEvaluation.LATE,
          teacherNotes: null,
          completionPercentage: 50,
          status: LessonReportStatus.PENDING_REVIEW,
          submittedByUserId: chain.adminUser.id,
          submittedAt: new Date(),
          reviewedByUserId: null,
          reviewedAt: null,
          rejectionReason: null,
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tx
      );

      const [fetched] = await tx.select().from(lessonReports).where(eq(lessonReports.id, created.id));
      expect(fetched).toBeDefined();
      expect(fetched?.status).toBe(LessonReportStatus.PENDING_REVIEW);
    });
  });
});
