import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import {
  createCompletedClassInstance,
  createTestLessonReport,
  createTestUser,
  setupStudent,
  setupTeacher,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AttendanceEvaluation, LessonReportStatus } from "@/backend/enum";

async function setupCompletedReportChain(
  tx: Parameters<typeof runInRollback>[0] extends (t: infer T) => unknown ? T : never
) {
  const { user: parentUser, parent, student } = await setupStudent(tx, { name: "Report Parent" }, {}, {});
  const { user: teacherUser, teacher } = await setupTeacher(tx, { name: "Report Teacher" });
  const adminUser = await createTestUser(tx, { name: "Reporting Admin" });
  const instance = await createCompletedClassInstance(tx, student.id, teacher.id);
  return { parentUser, parent, student, teacherUser, teacher, adminUser, instance };
}

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught instanceof Error) return errorCaught;
  throw new Error(String(errorCaught));
}

describe("Lesson report workflow — submit, approve, reject, state machine", () => {
  test("submits a report for a COMPLETED class, approves it and verifies status APPROVED", async () => {
    await runInRollback(async tx => {
      const { student, teacher, adminUser, instance } = await setupCompletedReportChain(tx);

      const submitted = await createTestLessonReport(tx, instance.id, student.id, teacher.id, adminUser.id, {
        idempotencyKey: `lesson-report-workflow-approve:${instance.id}`,
      });
      expect(submitted.status).toBe(LessonReportStatus.PENDING_REVIEW);
      expect(submitted.completionPercentage).toBe(100);
      expect(submitted.attendanceEvaluation).toBe(AttendanceEvaluation.PRESENT);

      const reviewer = await createTestUser(tx, { name: "Approver" });
      const approved = await LessonReportRepository.updateStatus(
        submitted.id,
        LessonReportStatus.APPROVED,
        reviewer.id,
        null,
        tx
      );

      expect(approved.id).toBe(submitted.id);
      expect(approved.status).toBe(LessonReportStatus.APPROVED);
      expect(approved.reviewedByUserId).toBe(reviewer.id);
      expect(approved.reviewedAt).not.toBeNull();
      expect(approved.rejectionReason).toBeNull();

      const fetched = await LessonReportRepository.findByClassInstanceId(instance.id, tx);
      expect(fetched?.status).toBe(LessonReportStatus.APPROVED);
    });
  });

  test("rejects another report and verifies status REJECTED with rejectionReason", async () => {
    await runInRollback(async tx => {
      const { student, teacher, adminUser } = await setupCompletedReportChain(tx);

      const instanceB = await createCompletedClassInstance(tx, student.id, teacher.id, {
        idempotencyKey: `reject-${randomUUID()}`,
      });

      const submitted = await createTestLessonReport(tx, instanceB.id, student.id, teacher.id, adminUser.id, {
        idempotencyKey: `lesson-report-workflow-reject:${instanceB.id}`,
      });

      const reviewer = await createTestUser(tx, { name: "Rejecter" });
      const rejected = await LessonReportRepository.updateStatus(
        submitted.id,
        LessonReportStatus.REJECTED,
        reviewer.id,
        "Lesson did not cover the planned syllabus",
        tx
      );

      expect(rejected.id).toBe(submitted.id);
      expect(rejected.status).toBe(LessonReportStatus.REJECTED);
      expect(rejected.reviewedByUserId).toBe(reviewer.id);
      expect(rejected.reviewedAt).not.toBeNull();
      expect(rejected.rejectionReason).toBe("Lesson did not cover the planned syllabus");
    });
  });

  test("state machine: cannot re-approve an already-reviewed report (service-layer guards excel)", async () => {
    await runInRollback(async tx => {
      const { student, teacher, adminUser, instance } = await setupCompletedReportChain(tx);
      const reviewer = await createTestUser(tx, { name: "Double Reviewer" });

      const submitted = await createTestLessonReport(tx, instance.id, student.id, teacher.id, adminUser.id, {
        idempotencyKey: `lesson-report-state-machine:${instance.id}`,
      });
      await LessonReportRepository.updateStatus(submitted.id, LessonReportStatus.APPROVED, reviewer.id, null, tx);

      const fetched = await LessonReportRepository.findById(submitted.id, tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.status).toBe(LessonReportStatus.APPROVED);
      expect(fetched?.status).not.toBe(LessonReportStatus.PENDING_REVIEW);
      const canReApprove = fetched?.status === LessonReportStatus.PENDING_REVIEW;
      expect(canReApprove).toBe(false);
    });
  });

  test("updateStatus returns nil row for a non-existent report (service asserts existence)", async () => {
    await runInRollback(async tx => {
      const notFound = await LessonReportRepository.findById(randomUUID(), tx);
      expect(notFound).toBeNull();

      const error = await expectRepoError(async () => {
        const result = await LessonReportRepository.updateStatus(
          randomUUID(),
          LessonReportStatus.APPROVED,
          randomUUID(),
          null,
          tx
        );
        if (!result) throw new Error("Lesson report not found");
      });
      expect(error.message).toContain("not found");
    });
  });

  test("full workflow: approve one report and reject another for the same teacher", async () => {
    await runInRollback(async tx => {
      const { student, teacher, adminUser } = await setupCompletedReportChain(tx);

      const instanceA = await createCompletedClassInstance(tx, student.id, teacher.id, {
        idempotencyKey: `flowA-${randomUUID()}`,
      });
      const reportA = await createTestLessonReport(tx, instanceA.id, student.id, teacher.id, adminUser.id, {
        idempotencyKey: `lr-flowA:${instanceA.id}`,
      });

      const instanceB = await createCompletedClassInstance(tx, student.id, teacher.id, {
        idempotencyKey: `flowB-${randomUUID()}`,
      });
      const reportB = await createTestLessonReport(tx, instanceB.id, student.id, teacher.id, adminUser.id, {
        idempotencyKey: `lr-flowB:${instanceB.id}`,
      });

      const reviewer = await createTestUser(tx, { name: "Reviewer" });

      await LessonReportRepository.updateStatus(reportA.id, LessonReportStatus.APPROVED, reviewer.id, null, tx);
      await LessonReportRepository.updateStatus(
        reportB.id,
        LessonReportStatus.REJECTED,
        reviewer.id,
        "Insufficient",
        tx
      );

      const fetchedA = await LessonReportRepository.findById(reportA.id, tx);
      const fetchedB = await LessonReportRepository.findById(reportB.id, tx);
      expect(fetchedA?.status).toBe(LessonReportStatus.APPROVED);
      expect(fetchedB?.status).toBe(LessonReportStatus.REJECTED);
    });
  });
});
