import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import { creditTransactions, teacherDues } from "@/backend/db/schema";
import { AttendanceEvaluation, CreditReason, LessonReportStatus } from "@/backend/enum";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { LessonReportSubmitInput } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import { cleanupLessonReportCast, type LessonReportCast, provisionLessonReportCast } from "@/test/workflows/helpers";

/** try/catch error capture — `expect(...).rejects.toThrow()` is forbidden in this layer. */
async function catchError(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    return error instanceof Error ? error : new Error("Unexpected rejection shape");
  }
  throw new Error("expected the wrapped service call to throw");
}

/**
 * Cross-actor journey: teacher submits lesson reports on completed class
 * instances, a manager reviews the queue, approves one (teacher due + teacher
 * notification) and rejects the other (credit refund + teacher notification),
 * while a second teacher proves cross-actor isolation honestly.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Lesson report lifecycle journey (teacher → manager)", () => {
  const PREFIX = `jrn_lr_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: LessonReportCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let approvedReportId = "";

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for ALL notifications (submit fan-out + reviewed).
    // spyOn on the module namespace is asserted empirically below: the
    // approve/reject steps fail if the real dispatcher is ever reached.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionLessonReportCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupLessonReportCast(cast);
  });

  function dispatchCallsTargeting(userId: string): number {
    return dispatchSpy.mock.calls.filter((call: unknown[]) => {
      const targets = Array.isArray(call[1]) ? call[1].filter((v): v is string => typeof v === "string") : [];
      return targets.includes(userId);
    }).length;
  }

  function buildSubmitInput(classInstanceId: string, completionPercentage: number): LessonReportSubmitInput {
    return {
      classInstanceId,
      attendanceEvaluation: AttendanceEvaluation.PRESENT,
      durationMinutes: 60,
      completionPercentage,
      teacherNotes: `${PREFIX} journey note`,
    };
  }

  test("step 1 — teacher submits a report on their completed class instance", async () => {
    const report = await LessonReportService.submitReport(
      cast.teacherUser.id,
      buildSubmitInput(cast.firstClassInstance.id, 100),
      "en"
    );

    expect(report.status).toBe(LessonReportStatus.PENDING_REVIEW);
    expect(report.studentId).toBe(cast.student.id);
    expect(report.teacherId).toBe(cast.teacher.id);
    expect(report.submittedByUserId).toBe(cast.teacherUser.id);
    expect(report.idempotencyKey).toBe(`lesson-report:${cast.firstClassInstance.id}`);

    const persisted = await LessonReportRepository.findById(report.id);
    expect(persisted?.status).toBe(LessonReportStatus.PENDING_REVIEW);

    approvedReportId = report.id;
  });

  test("step 2 — pending review queue: manager sees it, the other teacher cannot review at all", async () => {
    const managerView = await LessonReportService.getPendingReviews(
      cast.managerUser.id,
      { teacherId: cast.teacher.id },
      undefined,
      "en"
    );
    expect(managerView.rows.map(row => row.id)).toContain(approvedReportId);

    // Cross-actor visibility is honest here: the second teacher holds only
    // lesson_reports.submit, so the review queue is closed to them.
    const deniedError = await catchError(() =>
      LessonReportService.getPendingReviews(cast.secondTeacherUser.id, undefined, undefined, "en")
    );
    expect(deniedError.message).toContain(tErrors.unauthorized);
  });

  test("step 3 — manager approves: status flips, teacher due created, teacher notified", async () => {
    dispatchSpy.mockClear();

    const approved = await LessonReportService.approveReport(cast.managerUser.id, approvedReportId, "en");
    expect(approved.status).toBe(LessonReportStatus.APPROVED);
    expect(approved.reviewedByUserId).toBe(cast.managerUser.id);

    const dueRows = await db
      .select()
      .from(teacherDues)
      .where(eq(teacherDues.classInstanceId, cast.firstClassInstance.id));
    expect(dueRows).toHaveLength(1);
    expect(dueRows[0]?.teacherId).toBe(cast.teacher.id);
    expect(dueRows[0]?.studentId).toBe(cast.student.id);
    expect(dueRows[0]?.approvedByUserId).toBe(cast.managerUser.id);

    // Notification side effect: dispatched ONLY to the submitting teacher.
    expect(dispatchSpy).toHaveBeenCalled();
    expect(dispatchCallsTargeting(cast.teacherUser.id)).toBeGreaterThan(0);
    expect(dispatchCallsTargeting(cast.managerUser.id)).toBe(0);
  });

  test("step 4 — negatives: wrong teacher cannot submit on the class, teacher cannot approve", async () => {
    const wrongTeacherError = await catchError(() =>
      LessonReportService.submitReport(
        cast.secondTeacherUser.id,
        buildSubmitInput(cast.firstClassInstance.id, 80),
        "en"
      )
    );
    expect(wrongTeacherError.message).toContain(tErrors.lessonReport.notEligibleForReview);

    const approveDeniedError = await catchError(() =>
      LessonReportService.approveReport(cast.teacherUser.id, approvedReportId, "en")
    );
    expect(approveDeniedError.message).toContain(tErrors.unauthorized);
  });

  test("step 5 — reject path on the second instance: status, credit refund, rejection notification", async () => {
    dispatchSpy.mockClear();

    const submitted = await LessonReportService.submitReport(
      cast.teacherUser.id,
      buildSubmitInput(cast.secondClassInstance.id, 40),
      "en"
    );
    expect(submitted.status).toBe(LessonReportStatus.PENDING_REVIEW);

    const rejectionReason = `${PREFIX} rejection: incomplete coverage`;
    const rejected = await LessonReportService.rejectReport(
      cast.managerUser.id,
      { reportId: submitted.id, rejectionReason },
      "en"
    );
    expect(rejected.status).toBe(LessonReportStatus.REJECTED);
    expect(rejected.rejectionReason).toBe(rejectionReason);
    expect(rejected.reviewedByUserId).toBe(cast.managerUser.id);

    // Credit side effect: exactly one REFUND ledger row for the rejected instance.
    const refundRows = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.classInstanceId, cast.secondClassInstance.id));
    expect(refundRows).toHaveLength(1);
    expect(refundRows[0]?.reason).toBe(CreditReason.REFUND);
    expect(refundRows[0]?.changeAmount).toBe(1);
    expect(refundRows[0]?.studentId).toBe(cast.student.id);

    // Notification side effect: the rejection dispatch targets the teacher.
    expect(dispatchCallsTargeting(cast.teacherUser.id)).toBeGreaterThan(0);
  });
});
