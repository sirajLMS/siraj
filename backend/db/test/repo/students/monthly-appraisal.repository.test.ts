import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { MonthlyAppraisalRepository } from "@/backend/db/repo/students";
import { appraisalFeedback, monthlyAppraisals } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction, MonthlyAppraisalUpsertInput } from "@/backend/types";

/**
 * Repo tests for `MonthlyAppraisalRepository` — 4-tier coverage per task 2.1.TE.
 *
 * Tier 1 (100% branch coverage): upsert (insert + update via conflict), findById
 * (found + not found), findForStudentMonth (found + not found), listForStudent
 * (empty + populated), listForTeacherStudents (filtered + empty input),
 * appendFeedback (returns with authorName).
 *
 * Tier 2 (boundary): month-key passed as-is (no normalization at repo),
 * sparse rubric (only some grades set), unicode/RTL Arabic text in comments +
 * learningTargets, empty feedback body (repo accepts; service rejects).
 *
 * Tier 3 (concurrency): `Promise.allSettled` double-upsert of the same
 * `(studentId, teacherId, month)` — verifies unique-index protection (no
 * duplicate rows; final count = 1).
 *
 * Tier 4 (invalid id shapes): `findById("not-a-uuid")` does not crash the
 * process — either null is returned or a typed DB error is thrown (recorded
 * actual behavior).
 *
 * All DB tests run inside `runInRollback` + propagate `tx` to EVERY repo
 * method (per `backend/db/test/AGENTS.md` rule 16). Error cases use the
 * `expectRepoError` try/catch helper (rule 3) — never `rejects.toThrow`.
 */

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught instanceof Error) {
    return errorCaught;
  }
  return new Error(String(errorCaught));
}

function appraisalTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
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
    email: `${namePrefix.toLowerCase()}-parent-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  const student = await createTestStudent(tx, parent.id, { name: `${namePrefix} Student` });
  return { user, parent, student };
}

/**
 * Teacher + parent-with-student setup. The teacher is independent from the
 * student's parent — the appraisal repo only requires valid `studentId` +
 * `teacherId` FK references; the `teacherAssignments` link is NOT needed at
 * the repo layer (the service-layer tenancy check owns that in 2.2).
 */
async function setupTeacherWithStudent(tx: DBTransaction, namePrefix: string) {
  const teacherUser = await createTestUser(tx, {
    name: `${namePrefix} Teacher`,
    email: `${namePrefix.toLowerCase()}-teacher-${randomUUID()}@test.com`,
  });
  const teacher = await createTestTeacher(tx, teacherUser.id);
  const parentBundle = await setupParentWithStudent(tx, `${namePrefix}Stud`);
  return {
    teacherUser,
    teacher,
    parent: parentBundle.parent,
    parentUser: parentBundle.user,
    student: parentBundle.student,
  };
}

function firstOfMonth(year: number, monthZeroIndexed: number): Date {
  // Use UTC to keep the timestamp stable across local/CI timezones.
  return new Date(Date.UTC(year, monthZeroIndexed, 1, 0, 0, 0, 0));
}

function buildSubmitInput(
  studentId: string,
  teacherId: string,
  month: Date,
  overrides: Partial<MonthlyAppraisalUpsertInput> = {}
): MonthlyAppraisalUpsertInput {
  return {
    studentId,
    teacherId,
    month,
    learningTargets: "Default learning targets text.",
    ...overrides,
  };
}

describe("MonthlyAppraisalRepository — Tier 1 (branch coverage)", () => {
  appraisalTest("upsert inserts a new appraisal with all rubric fields", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "UpsertNew");
    const month = firstOfMonth(2026, 7);

    const result = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, {
        behaviorGrade: 5,
        behaviorComment: "Excellent behavior",
        attendanceGrade: 4,
        attendanceComment: "Good attendance",
        punctualityGrade: 5,
        punctualityComment: "Always on time",
        overallGrade: 5,
        overallComment: "Outstanding month",
        learningTargets: "Improve reading comprehension.",
      }),
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.studentId).toBe(student.id);
    expect(result.teacherId).toBe(teacher.id);
    expect(result.month.toISOString()).toBe(month.toISOString());
    expect(result.behaviorGrade).toBe(5);
    expect(result.behaviorComment).toBe("Excellent behavior");
    expect(result.attendanceGrade).toBe(4);
    expect(result.punctualityGrade).toBe(5);
    expect(result.overallGrade).toBe(5);
    expect(result.learningTargets).toBe("Improve reading comprehension.");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    // No feedback yet — the optional array is null on the empty path.
    expect(result.feedback).toBeNull();
  });

  appraisalTest("upsert updates an existing appraisal via unique conflict", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "UpsertConflict");
    const month = firstOfMonth(2026, 7);
    const initial = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, {
        behaviorGrade: 3,
        learningTargets: "Initial targets",
      }),
      tx
    );
    expect(initial.behaviorGrade).toBe(3);

    const updated = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, {
        behaviorGrade: 5,
        learningTargets: "Updated targets — improved",
      }),
      tx
    );

    expect(updated.id).toBe(initial.id);
    expect(updated.behaviorGrade).toBe(5);
    expect(updated.learningTargets).toBe("Updated targets — improved");

    // Exactly ONE row for this (student, teacher, month) — no duplicates.
    const [row] = await tx
      .select({ count: count() })
      .from(monthlyAppraisals)
      .where(
        and(
          eq(monthlyAppraisals.studentId, student.id),
          eq(monthlyAppraisals.teacherId, teacher.id),
          eq(monthlyAppraisals.month, month)
        )
      );
    expect(row?.count).toBe(1);
  });

  appraisalTest("findById returns the appraisal with joined feedback", async tx => {
    const { teacher, teacherUser, student } = await setupTeacherWithStudent(tx, "FindById");
    const month = firstOfMonth(2026, 6);

    const created = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, {
        learningTargets: "Targets for findById test",
      }),
      tx
    );

    await MonthlyAppraisalRepository.appendFeedback(
      { appraisalId: created.id, authorUserId: teacherUser.id, body: "Teacher reply" },
      tx
    );

    const result = await MonthlyAppraisalRepository.findById(created.id, tx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(created.id);
    expect(result?.feedback).not.toBeNull();
    expect(result?.feedback?.length).toBe(1);
    expect(result?.feedback?.[0]?.body).toBe("Teacher reply");
    expect(result?.feedback?.[0]?.authorName).toBe("FindById Teacher");
  });

  appraisalTest("findById returns null for non-existent id", async tx => {
    const result = await MonthlyAppraisalRepository.findById("00000000-0000-0000-0000-000000000000", tx);
    expect(result).toBeNull();
  });

  appraisalTest("findForStudentMonth returns the appraisal for the exact month", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "FindMonth");
    const month = firstOfMonth(2026, 5);
    await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, { learningTargets: "May targets" }),
      tx
    );

    const result = await MonthlyAppraisalRepository.findForStudentMonth(student.id, month, tx);
    expect(result).not.toBeNull();
    expect(result?.studentId).toBe(student.id);
    expect(result?.learningTargets).toBe("May targets");
  });

  appraisalTest("findForStudentMonth returns null when no appraisal exists for the month", async tx => {
    const { student } = await setupTeacherWithStudent(tx, "FindMonthNone");
    const result = await MonthlyAppraisalRepository.findForStudentMonth(student.id, firstOfMonth(2026, 0), tx);
    expect(result).toBeNull();
  });

  appraisalTest("listForStudent returns empty array when no appraisals exist", async tx => {
    const { student } = await setupTeacherWithStudent(tx, "ListEmpty");
    const result = await MonthlyAppraisalRepository.listForStudent(student.id, tx);
    expect(result).toEqual([]);
  });

  appraisalTest("listForStudent returns all appraisals ordered by month DESC", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "ListPopulated");
    const may = firstOfMonth(2026, 4);
    const june = firstOfMonth(2026, 5);
    const july = firstOfMonth(2026, 6);
    await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, may, { learningTargets: "May" }),
      tx
    );
    await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, july, { learningTargets: "July" }),
      tx
    );
    await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, june, { learningTargets: "June" }),
      tx
    );

    const result = await MonthlyAppraisalRepository.listForStudent(student.id, tx);
    expect(result).toHaveLength(3);
    expect(result[0].month.toISOString()).toBe(july.toISOString());
    expect(result[1].month.toISOString()).toBe(june.toISOString());
    expect(result[2].month.toISOString()).toBe(may.toISOString());
  });

  appraisalTest("listForTeacherStudents returns only the teacher's appraisals for the listed students", async tx => {
    const teacherBundleA = await setupTeacherWithStudent(tx, "TeacherA");
    const teacherBundleB = await setupTeacherWithStudent(tx, "TeacherB");
    const month = firstOfMonth(2026, 7);

    await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(teacherBundleA.student.id, teacherBundleA.teacher.id, month, {
        learningTargets: "Teacher A targets",
      }),
      tx
    );
    await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(teacherBundleB.student.id, teacherBundleB.teacher.id, month, {
        learningTargets: "Teacher B targets",
      }),
      tx
    );

    const result = await MonthlyAppraisalRepository.listForTeacherStudents(
      teacherBundleA.teacher.id,
      [teacherBundleA.student.id, teacherBundleB.student.id],
      tx
    );

    expect(result).toHaveLength(1);
    expect(result[0].teacherId).toBe(teacherBundleA.teacher.id);
    expect(result[0].studentId).toBe(teacherBundleA.student.id);
    expect(result[0].learningTargets).toBe("Teacher A targets");
  });

  appraisalTest("listForTeacherStudents returns empty array when studentIds list is empty", async tx => {
    const { teacher } = await setupTeacherWithStudent(tx, "TeacherEmptyIds");
    const result = await MonthlyAppraisalRepository.listForTeacherStudents(teacher.id, [], tx);
    expect(result).toEqual([]);
  });

  appraisalTest("appendFeedback inserts a feedback row and returns it with authorName", async tx => {
    const { teacher, teacherUser, student } = await setupTeacherWithStudent(tx, "AppendFb");
    const month = firstOfMonth(2026, 7);
    const created = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, { learningTargets: "Targets" }),
      tx
    );

    const feedback = await MonthlyAppraisalRepository.appendFeedback(
      { appraisalId: created.id, authorUserId: teacherUser.id, body: "First feedback reply" },
      tx
    );

    expect(feedback).toBeDefined();
    expect(feedback.appraisalId).toBe(created.id);
    expect(feedback.authorUserId).toBe(teacherUser.id);
    expect(feedback.body).toBe("First feedback reply");
    expect(feedback.authorName).toBe("AppendFb Teacher");
    expect(feedback.createdAt).toBeInstanceOf(Date);

    // The appended row is visible on a subsequent findById.
    const refetched = await MonthlyAppraisalRepository.findById(created.id, tx);
    expect(refetched?.feedback?.length).toBe(1);
    expect(refetched?.feedback?.[0]?.id).toBe(feedback.id);
  });

  appraisalTest("appendFeedback on a non-existent appraisalId throws an FK violation", async tx => {
    const { teacherUser } = await setupTeacherWithStudent(tx, "AppendFbFk");
    const error = await expectRepoError(() =>
      MonthlyAppraisalRepository.appendFeedback(
        {
          appraisalId: "00000000-0000-0000-0000-000000000000",
          authorUserId: teacherUser.id,
          body: "Orphan feedback",
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  appraisalTest("appendFeedback with a non-existent authorUserId throws an FK violation", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "AppendFbBadAuthor");
    const month = firstOfMonth(2026, 7);
    const created = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, { learningTargets: "Targets" }),
      tx
    );

    const error = await expectRepoError(() =>
      MonthlyAppraisalRepository.appendFeedback(
        {
          appraisalId: created.id,
          authorUserId: "00000000-0000-0000-0000-000000000000",
          body: "Bad author",
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  appraisalTest("upsert with a non-existent studentId throws an FK violation", async tx => {
    const { teacher } = await setupTeacherWithStudent(tx, "UpsertBadStudent");
    const error = await expectRepoError(() =>
      MonthlyAppraisalRepository.upsert(
        buildSubmitInput("00000000-0000-0000-0000-000000000000", teacher.id, firstOfMonth(2026, 7), {
          learningTargets: "Targets",
        }),
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("MonthlyAppraisalRepository — Tier 2 (boundary / edge)", () => {
  appraisalTest("upsert accepts a mid-month Date as the month (no normalization at the repo layer)", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "MidMonth");
    // Mid-month timestamp — the repo stores it as-is; the service layer (2.2)
    // is responsible for normalizing to first-of-month before calling.
    const midMonth = new Date(Date.UTC(2026, 6, 15, 12, 30, 0, 0));

    const result = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, midMonth, { learningTargets: "Mid-month targets" }),
      tx
    );
    expect(result.month.toISOString()).toBe(midMonth.toISOString());

    // findForStudentMonth matches only when the exact timestamp is passed.
    const foundExact = await MonthlyAppraisalRepository.findForStudentMonth(student.id, midMonth, tx);
    expect(foundExact).not.toBeNull();
    // A first-of-month Date for the same calendar month does NOT match (no normalization).
    const notFoundFirstOfMonth = await MonthlyAppraisalRepository.findForStudentMonth(
      student.id,
      firstOfMonth(2026, 6),
      tx
    );
    expect(notFoundFirstOfMonth).toBeNull();
  });

  appraisalTest("upsert persists a sparse rubric — only some grades set, others null", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "Sparse");
    const month = firstOfMonth(2026, 7);

    const result = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, {
        behaviorGrade: 4,
        behaviorComment: "Good behavior",
        // attendance + punctuality + overall all omitted → null in DB
        learningTargets: "Targets only — sparse rubric.",
      }),
      tx
    );

    expect(result.behaviorGrade).toBe(4);
    expect(result.behaviorComment).toBe("Good behavior");
    expect(result.attendanceGrade).toBeNull();
    expect(result.attendanceComment).toBeNull();
    expect(result.punctualityGrade).toBeNull();
    expect(result.punctualityComment).toBeNull();
    expect(result.overallGrade).toBeNull();
    expect(result.overallComment).toBeNull();
    expect(result.learningTargets).toBe("Targets only — sparse rubric.");
  });

  appraisalTest("upsert round-trips unicode/RTL Arabic text in comments + learningTargets", async tx => {
    const { teacher, student } = await setupTeacherWithStudent(tx, "Arabic");
    const month = firstOfMonth(2026, 7);

    const result = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, {
        behaviorComment: "سلوك ممتاز",
        attendanceComment: "حضور منتظم",
        learningTargets: "تحسين القراءة والكتابة باللغة العربية",
      }),
      tx
    );

    expect(result.behaviorComment).toBe("سلوك ممتاز");
    expect(result.attendanceComment).toBe("حضور منتظم");
    expect(result.learningTargets).toBe("تحسين القراءة والكتابة باللغة العربية");

    const refetched = await MonthlyAppraisalRepository.findById(result.id, tx);
    expect(refetched?.behaviorComment).toBe("سلوك ممتاز");
    expect(refetched?.learningTargets).toBe("تحسين القراءة والكتابة باللغة العربية");
  });

  appraisalTest("appendFeedback accepts an empty body (service-layer responsibility to reject)", async tx => {
    const { teacher, teacherUser, student } = await setupTeacherWithStudent(tx, "EmptyFbBody");
    const month = firstOfMonth(2026, 7);
    const created = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, { learningTargets: "Targets" }),
      tx
    );

    // The repo does NOT validate body content — the service layer (2.2) must
    // Zod-validate that body is a non-empty string before calling.
    const feedback = await MonthlyAppraisalRepository.appendFeedback(
      { appraisalId: created.id, authorUserId: teacherUser.id, body: "" },
      tx
    );
    expect(feedback.body).toBe("");
    expect(feedback.id).toBeDefined();
  });

  appraisalTest("listForStudent returns multiple feedback rows ordered oldest-first", async tx => {
    const { teacher, teacherUser, student } = await setupTeacherWithStudent(tx, "FbOrder");
    const month = firstOfMonth(2026, 7);
    const created = await MonthlyAppraisalRepository.upsert(
      buildSubmitInput(student.id, teacher.id, month, { learningTargets: "Targets" }),
      tx
    );

    const first = await MonthlyAppraisalRepository.appendFeedback(
      { appraisalId: created.id, authorUserId: teacherUser.id, body: "First" },
      tx
    );
    // Small delay so createdAt differs between rows (avoid same-ms ties).
    await new Promise(resolve => setTimeout(resolve, 10));
    const second = await MonthlyAppraisalRepository.appendFeedback(
      { appraisalId: created.id, authorUserId: teacherUser.id, body: "Second" },
      tx
    );

    const refetched = await MonthlyAppraisalRepository.findById(created.id, tx);
    expect(refetched?.feedback?.length).toBe(2);
    expect(refetched?.feedback?.[0]?.id).toBe(first.id);
    expect(refetched?.feedback?.[1]?.id).toBe(second.id);
  });
});

describe("MonthlyAppraisalRepository — Tier 3 (concurrency)", () => {
  test("Promise.allSettled double-upsert of the same (studentId, teacherId, month) yields exactly one row", async () => {
    await runInRollback(async tx => {
      const { teacher, student } = await setupTeacherWithStudent(tx, "Race");
      const month = firstOfMonth(2026, 7);
      const input = buildSubmitInput(student.id, teacher.id, month, { learningTargets: "Race targets" });

      // Fire two upserts concurrently against the same unique key. The unique
      // index `monthly_appraisals_student_teacher_month_unique_idx` +
      // `onConflictDoUpdate` guarantees both promises settle, one row wins,
      // and no duplicate is created.
      const outcomes = await Promise.allSettled([
        MonthlyAppraisalRepository.upsert(input, tx),
        MonthlyAppraisalRepository.upsert(input, tx),
      ]);

      // Both should resolve (no rejection from a duplicate-key hard error —
      // the onConflictDoUpdate clause converts the conflict into an update).
      const fulfilled = outcomes.filter(o => o.status === "fulfilled");
      expect(fulfilled).toHaveLength(2);

      const [row] = await tx
        .select({ count: count() })
        .from(monthlyAppraisals)
        .where(
          and(
            eq(monthlyAppraisals.studentId, student.id),
            eq(monthlyAppraisals.teacherId, teacher.id),
            eq(monthlyAppraisals.month, month)
          )
        );
      expect(row?.count).toBe(1);
    });
  });

  test("Promise.allSettled concurrent feedback appends on the same appraisal all persist", async () => {
    await runInRollback(async tx => {
      const { teacher, teacherUser, student } = await setupTeacherWithStudent(tx, "FbRace");
      const month = firstOfMonth(2026, 7);
      const created = await MonthlyAppraisalRepository.upsert(
        buildSubmitInput(student.id, teacher.id, month, { learningTargets: "Targets" }),
        tx
      );

      const outcomes = await Promise.allSettled([
        MonthlyAppraisalRepository.appendFeedback(
          { appraisalId: created.id, authorUserId: teacherUser.id, body: "Concurrent 1" },
          tx
        ),
        MonthlyAppraisalRepository.appendFeedback(
          { appraisalId: created.id, authorUserId: teacherUser.id, body: "Concurrent 2" },
          tx
        ),
        MonthlyAppraisalRepository.appendFeedback(
          { appraisalId: created.id, authorUserId: teacherUser.id, body: "Concurrent 3" },
          tx
        ),
      ]);
      const fulfilled = outcomes.filter(o => o.status === "fulfilled");
      expect(fulfilled).toHaveLength(3);

      const [row] = await tx
        .select({ count: count() })
        .from(appraisalFeedback)
        .where(eq(appraisalFeedback.appraisalId, created.id));
      expect(row?.count).toBe(3);
    });
  });
});

describe("MonthlyAppraisalRepository — Tier 4 (invalid id shapes)", () => {
  appraisalTest("findById with a non-uuid string does not crash the process", async tx => {
    // Repository MUST NOT crash the test runner. Either a null return (graceful)
    // or a typed DB error (caught) is acceptable — record actual behavior.
    let error: unknown = null;
    let result: unknown = "unset";
    try {
      result = await MonthlyAppraisalRepository.findById("not-a-uuid", tx);
    } catch (e) {
      error = e;
    }
    // The repo gracefully returns null OR throws a typed error — either is fine.
    expect(error !== null || result === null).toBeTrue();
  });

  appraisalTest("findForStudentMonth with a non-uuid studentId does not crash the process", async tx => {
    let error: unknown = null;
    let result: unknown = "unset";
    try {
      result = await MonthlyAppraisalRepository.findForStudentMonth("not-a-uuid", firstOfMonth(2026, 7), tx);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === null).toBeTrue();
  });

  appraisalTest("listForTeacherStudents with a non-uuid teacherId does not crash the process", async tx => {
    let error: unknown = null;
    let result: unknown = "unset";
    try {
      result = await MonthlyAppraisalRepository.listForTeacherStudents("not-a-uuid", ["also-not-uuid"], tx);
    } catch (e) {
      error = e;
    }
    expect(error !== null || Array.isArray(result)).toBeTrue();
  });
});

describe("MonthlyAppraisalRepository — non-transactional coverage fallback", () => {
  test("findById returns null without a tx for an unknown id", async () => {
    const result = await MonthlyAppraisalRepository.findById("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });

  test("findForStudentMonth returns null without a tx for an unknown student", async () => {
    const result = await MonthlyAppraisalRepository.findForStudentMonth(
      "00000000-0000-0000-0000-000000000000",
      firstOfMonth(2026, 7)
    );
    expect(result).toBeNull();
  });

  test("listForStudent returns an empty array without a tx for an unknown student", async () => {
    const result = await MonthlyAppraisalRepository.listForStudent("00000000-0000-0000-0000-000000000000");
    expect(result).toEqual([]);
  });

  test("listForTeacherStudents returns an empty array without a tx for empty studentIds", async () => {
    const result = await MonthlyAppraisalRepository.listForTeacherStudents("00000000-0000-0000-0000-000000000000", []);
    expect(result).toEqual([]);
  });
});

describe("MonthlyAppraisalRepository — transaction rollback", () => {
  test("rolls back an upsert on subsequent failure", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const { teacher, student } = await setupTeacherWithStudent(tx, "Rollback");
      const created = await MonthlyAppraisalRepository.upsert(
        buildSubmitInput(student.id, teacher.id, firstOfMonth(2026, 7), {
          learningTargets: "Should be rolled back",
        }),
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const [found] = await db.select().from(monthlyAppraisals).where(eq(monthlyAppraisals.id, createdId)).limit(1);
      expect(found).toBeUndefined();
    }
  });
});
