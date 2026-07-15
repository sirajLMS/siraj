import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import { lessonReports } from "@/backend/db/schema";
import { createTestLessonReport, createTestUser, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AttendanceEvaluation, LessonReportStatus } from "@/backend/enum";
import type { ClassInstanceEntity } from "@/backend/types";
import { PaginationArgs } from "@/backend/types";

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

function requireInstance(instance: ClassInstanceEntity | null): ClassInstanceEntity {
  if (!instance) {
    throw new Error("setupTestEntities returned a null instance — pass skipInstance:false");
  }
  return instance;
}

async function setupReportChain(tx: Parameters<typeof runInRollback>[0] extends (t: infer T) => unknown ? T : never) {
  const entities = await setupTestEntities(tx, "LessonReport", { classesRemaining: 10 });
  const adminUser = await createTestUser(tx, { name: "Reviewing Admin" });
  return { ...entities, adminUser };
}

describe("LessonReportRepository.findByClassInstanceId", () => {
  test("returns the report linked to a class instance", async () => {
    await runInRollback(async tx => {
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);

      const created = await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);

      const found = await LessonReportRepository.findByClassInstanceId(inst.id, tx);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.classInstanceId).toBe(inst.id);
    });
  });

  test("returns null when no report exists for the class instance", async () => {
    await runInRollback(async tx => {
      const { instance } = await setupReportChain(tx);
      const inst = requireInstance(instance);

      const found = await LessonReportRepository.findByClassInstanceId(inst.id, tx);

      expect(found).toBeNull();
    });
  });
});

describe("LessonReportRepository.findById", () => {
  test("returns the report by its id", async () => {
    await runInRollback(async tx => {
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const created = await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);

      const found = await LessonReportRepository.findById(created.id, tx);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
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
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const idempotencyKey = randomUUID();
      const now = new Date();

      const created = await LessonReportRepository.create(
        {
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
        },
        tx
      );

      expect(created.id).toBeDefined();
      expect(created.classInstanceId).toBe(inst.id);
      expect(created.studentId).toBe(student.id);
      expect(created.teacherId).toBe(teacher.id);
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
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
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
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const reviewer = await createTestUser(tx, { name: "Approver" });
      const created = await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);

      const updated = await LessonReportRepository.updateStatus(
        created.id,
        LessonReportStatus.APPROVED,
        reviewer.id,
        null,
        tx
      );

      expect(updated.id).toBe(created.id);
      expect(updated.status).toBe(LessonReportStatus.APPROVED);
      expect(updated.reviewedByUserId).toBe(reviewer.id);
      expect(updated.reviewedAt).not.toBeNull();
      expect(updated.rejectionReason).toBeNull();
    });
  });

  test("transitions PENDING_REVIEW → REJECTED with rejectionReason set", async () => {
    await runInRollback(async tx => {
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const reviewer = await createTestUser(tx, { name: "Rejecter" });
      const created = await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);

      const updated = await LessonReportRepository.updateStatus(
        created.id,
        LessonReportStatus.REJECTED,
        reviewer.id,
        "Insufficient detail",
        tx
      );

      expect(updated.id).toBe(created.id);
      expect(updated.status).toBe(LessonReportStatus.REJECTED);
      expect(updated.reviewedByUserId).toBe(reviewer.id);
      expect(updated.reviewedAt).not.toBeNull();
      expect(updated.rejectionReason).toBe("Insufficient detail");
    });
  });

  test("updating the same report a second time overwrites prior status", async () => {
    await runInRollback(async tx => {
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const reviewer = await createTestUser(tx, { name: "Second Reviewer" });
      const created = await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);

      await LessonReportRepository.updateStatus(created.id, LessonReportStatus.APPROVED, reviewer.id, null, tx);
      const secondUpdate = await LessonReportRepository.updateStatus(
        created.id,
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
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const entitiesB = await setupTestEntities(tx, "LessonReportB", { classesRemaining: 5 });
      const instB = requireInstance(entitiesB.instance);
      const adminB = await createTestUser(tx, { name: "Admin B" });

      await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id);
      await createTestLessonReport(tx, instB.id, entitiesB.student.id, entitiesB.teacher.id, adminB.id);

      const pagination = new PaginationArgs({ first: 10, page: 1 });
      const pending = await LessonReportRepository.findPendingReviews({ teacherId: teacher.id }, pagination, tx);

      const matching = pending.filter(r => r.teacherId === teacher.id);
      expect(matching.length).toBeGreaterThanOrEqual(1);
      for (const r of matching) {
        expect(r.status).toBe(LessonReportStatus.PENDING_REVIEW);
      }
    });
  });

  test("supports pagination on pending reviews", async () => {
    await runInRollback(async tx => {
      const { teacher, adminUser } = await setupReportChain(tx);

      for (let i = 0; i < 3; i++) {
        // skipInstance defaults to false — each iteration needs a real class
        // instance to attach the lesson report to (createTestLessonReport's
        // classInstanceId column has an FK to class_instances.id).
        const e = await setupTestEntities(tx, `PendPage${i}`, { classesRemaining: 10 });
        const inst = requireInstance(e.instance);
        await createTestLessonReport(tx, inst.id, e.student.id, teacher.id, adminUser.id, {
          idempotencyKey: `pend-${i}-${randomUUID()}`,
        });
      }

      const pagination = new PaginationArgs({ first: 2, page: 1 });
      const rows = await LessonReportRepository.findPendingReviews({ teacherId: teacher.id }, pagination, tx);

      expect(rows.length).toBeLessThanOrEqual(2);
      for (const r of rows) {
        expect(r.status).toBe(LessonReportStatus.PENDING_REVIEW);
        expect(r.teacherId).toBe(teacher.id);
      }
    });
  });
});

describe("LessonReportRepository.countPendingReviews", () => {
  test("counts pending reports correctly", async () => {
    await runInRollback(async tx => {
      const { teacher, adminUser } = await setupReportChain(tx);

      const initialCount = await LessonReportRepository.countPendingReviews({ teacherId: teacher.id }, tx);

      for (let i = 0; i < 2; i++) {
        // skipInstance defaults to false — each iteration needs a real class
        // instance to attach the lesson report to (createTestLessonReport's
        // classInstanceId column has an FK to class_instances.id).
        const e = await setupTestEntities(tx, `PendCount${i}`, { classesRemaining: 10 });
        const inst = requireInstance(e.instance);
        await createTestLessonReport(tx, inst.id, e.student.id, teacher.id, adminUser.id, {
          idempotencyKey: `count-${i}-${randomUUID()}`,
        });
      }

      const newCount = await LessonReportRepository.countPendingReviews({ teacherId: teacher.id }, tx);
      expect(newCount).toBe(initialCount + 2);
    });
  });

  test("counts all pending reports when no filters supplied", async () => {
    await runInRollback(async tx => {
      const globalInitial = await LessonReportRepository.countPendingReviews(undefined, tx);

      const e = await setupTestEntities(tx, "PendGlobalA", { classesRemaining: 10 });
      const instA = requireInstance(e.instance);
      await createTestLessonReport(tx, instA.id, e.student.id, e.teacher.id, e.parentUser.id, {
        idempotencyKey: `glob-${randomUUID()}`,
      });
      const e2 = await setupTestEntities(tx, "PendGlobalB", { classesRemaining: 10 });
      const instB = requireInstance(e2.instance);
      await createTestLessonReport(tx, instB.id, e2.student.id, e2.teacher.id, e2.parentUser.id, {
        idempotencyKey: `glob-${randomUUID()}`,
      });

      const globalAfter = await LessonReportRepository.countPendingReviews(undefined, tx);
      expect(globalAfter).toBe(globalInitial + 2);
    });
  });
});

describe("LessonReportRepository.findByIdempotencyKeys", () => {
  test("finds existing reports by their idempotency keys", async () => {
    await runInRollback(async tx => {
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);
      const keyA = `lr-${randomUUID()}`;
      const keyB = `lr-${randomUUID()}`;

      const createdA = await createTestLessonReport(tx, inst.id, student.id, teacher.id, adminUser.id, {
        idempotencyKey: keyA,
      });

      const e2 = await setupTestEntities(tx, "IdempB", { classesRemaining: 10 });
      const instB = requireInstance(e2.instance);
      const createdB = await createTestLessonReport(tx, instB.id, e2.student.id, e2.teacher.id, adminUser.id, {
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
      const { student, teacher, instance, adminUser } = await setupReportChain(tx);
      const inst = requireInstance(instance);

      const created = await LessonReportRepository.create(
        {
          classInstanceId: inst.id,
          studentId: student.id,
          teacherId: teacher.id,
          lessonDate: new Date(),
          durationMinutes: 30,
          attendanceEvaluation: AttendanceEvaluation.LATE,
          teacherNotes: null,
          completionPercentage: 50,
          status: LessonReportStatus.PENDING_REVIEW,
          submittedByUserId: adminUser.id,
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
