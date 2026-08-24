import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { ParentRepository } from "@/backend/db/repo/parents";
import { MonthlyAppraisalRepository, StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { StudentStatus } from "@/backend/enum";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { MonthlyAppraisalService } from "@/backend/services/monthly-appraisal/monthly-appraisal.service";
import type {
  AppraisalFeedbackReturnType,
  MonthlyAppraisalReturnType,
  MonthlyAppraisalSubmitInput,
  TeacherAssignedStudentReturnType,
} from "@/backend/types";

const MOCK_TEACHER_USER_ID = "teacher-user-uuid-0001";
const MOCK_TEACHER_ID = "teacher-uuid-0001";
const MOCK_STUDENT_USER_ID = "student-user-uuid-0001";
const MOCK_STUDENT_ID = "student-uuid-0001";
const MOCK_OTHER_STUDENT_ID = "student-uuid-0002";
const MOCK_PARENT_USER_ID = "parent-user-uuid-0001";
const MOCK_PARENT_ID = "parent-uuid-0001";
const MOCK_OTHER_PARENT_ID = "parent-uuid-0002";
const MOCK_APPRAISAL_ID = "appraisal-uuid-0001";
const MOCK_FEEDBACK_ID = "feedback-uuid-0001";

/** Mid-month Date used to exercise month normalization. */
const MID_MONTH = new Date("2026-08-15T13:45:30.123Z");
const NORMALIZED_MONTH = new Date("2026-08-01T00:00:00.000Z");

function buildMockTeacherSelect() {
  return {
    id: MOCK_TEACHER_ID,
    userId: MOCK_TEACHER_USER_ID,
    nationality: null,
    nationalId: null,
    phone: null,
    dateOfBirth: null,
    gender: null,
    address: null,
    qualifications: null,
    countryCode: null,
    hourlyRate: null,
    rateCurrency: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as const;
}

function buildMockStudentSelect() {
  return {
    id: MOCK_STUDENT_ID,
    userId: MOCK_STUDENT_USER_ID,
    parentId: MOCK_PARENT_ID,
    name: "Test Student",
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    language: null,
    timezoneOverride: null,
    primaryTeacherId: MOCK_TEACHER_ID,
    status: StudentStatus.REGULAR,
    classesTotal: 20,
    classesRemaining: 12,
    version: 1,
    hoursPerWeek: "4",
    idempotencyKey: "student-idempotency-key-0001",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as const;
}

function buildMockParentSelect() {
  return {
    id: MOCK_PARENT_ID,
    userId: MOCK_PARENT_USER_ID,
    status: "ACTIVE",
    nationality: null,
    address: null,
    facebook: null,
    whatsapp: null,
    twitter: null,
    invoiceType: null,
    feeAmount: null,
    currency: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as const;
}

async function callGetTeacherAppraisalStudents(month: Date | undefined) {
  return MonthlyAppraisalService.getTeacherMonthlyAppraisalStudents(MOCK_TEACHER_USER_ID, month, "en");
}

async function expectAddFeedbackRejects(body: string, expectedErrorClass: new (...args: never[]) => Error) {
  await expectRejects(
    async () =>
      MonthlyAppraisalService.addFeedback(
        { appraisalId: MOCK_APPRAISAL_ID, authorUserId: MOCK_PARENT_USER_ID, body },
        MOCK_PARENT_USER_ID,
        "en"
      ),
    expectedErrorClass
  );
}

function buildMockAppraisal(overrides: Partial<MonthlyAppraisalReturnType> = {}): MonthlyAppraisalReturnType {
  return {
    id: MOCK_APPRAISAL_ID,
    studentId: MOCK_STUDENT_ID,
    teacherId: MOCK_TEACHER_ID,
    month: NORMALIZED_MONTH,
    behaviorGrade: 4,
    behaviorComment: "Good behavior",
    attendanceGrade: 5,
    attendanceComment: "Perfect attendance",
    punctualityGrade: 3,
    punctualityComment: "On time",
    overallGrade: 4,
    overallComment: "Solid month",
    learningTargets: "Improve reading comprehension",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    feedback: null,
    ...overrides,
  };
}

function buildMockFeedback(overrides: Partial<AppraisalFeedbackReturnType> = {}): AppraisalFeedbackReturnType {
  return {
    id: MOCK_FEEDBACK_ID,
    appraisalId: MOCK_APPRAISAL_ID,
    authorUserId: MOCK_PARENT_USER_ID,
    body: "Thank you for the feedback",
    createdAt: new Date("2026-08-02T10:00:00.000Z"),
    authorName: "Test Parent",
    ...overrides,
  };
}

function buildMockTeacherAssignedStudent(
  overrides: Partial<TeacherAssignedStudentReturnType> = {}
): TeacherAssignedStudentReturnType {
  return {
    id: MOCK_STUDENT_ID,
    name: "Test Student",
    studentAvatarUrl: null,
    parentId: MOCK_PARENT_ID,
    parentUserId: MOCK_PARENT_USER_ID,
    parentName: "Test Parent",
    parentAvatarUrl: null,
    className: null,
    status: StudentStatus.REGULAR,
    hoursPerWeek: 4,
    classesRemaining: 12,
    classesTotal: 20,
    ...overrides,
  };
}

function buildSubmitInput(overrides: Partial<MonthlyAppraisalSubmitInput> = {}): MonthlyAppraisalSubmitInput {
  return {
    studentId: MOCK_STUDENT_ID,
    // Forged teacherId — service MUST ignore this and use auth context.
    teacherId: "forged-teacher-id-from-client",
    month: MID_MONTH,
    behaviorGrade: 4,
    behaviorComment: "Good behavior",
    attendanceGrade: 5,
    attendanceComment: "Perfect",
    punctualityGrade: 3,
    punctualityComment: "On time",
    overallGrade: 4,
    overallComment: "Solid",
    learningTargets: "Improve reading comprehension",
    ...overrides,
  };
}

async function expectRejects(
  fn: () => Promise<unknown>,
  expectedErrorClass: new (...args: never[]) => Error
): Promise<void> {
  let caught: unknown = null;
  try {
    await fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(expectedErrorClass);
}

describe("MonthlyAppraisalService", () => {
  let hasPermissionSpy: ReturnType<typeof spyOn>;
  let teacherFindByUserIdSpy: ReturnType<typeof spyOn>;
  let studentHasTeacherAssignmentSpy: ReturnType<typeof spyOn>;
  let studentGetStudentIdByUserIdSpy: ReturnType<typeof spyOn>;
  let studentFindByIdSpy: ReturnType<typeof spyOn>;
  let studentGetAssignedToTeacherSpy: ReturnType<typeof spyOn>;
  let parentFindByUserIdSpy: ReturnType<typeof spyOn>;
  let appraisalUpsertSpy: ReturnType<typeof spyOn>;
  let appraisalFindByIdSpy: ReturnType<typeof spyOn>;
  let appraisalFindForStudentMonthSpy: ReturnType<typeof spyOn>;
  let appraisalListForStudentSpy: ReturnType<typeof spyOn>;
  let appraisalListForTeacherStudentsSpy: ReturnType<typeof spyOn>;
  let appraisalAppendFeedbackSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    teacherFindByUserIdSpy = spyOn(TeacherRepository, "findByUserId").mockResolvedValue(buildMockTeacherSelect());
    studentHasTeacherAssignmentSpy = spyOn(StudentRepository, "hasTeacherAssignment").mockResolvedValue(true);
    studentGetStudentIdByUserIdSpy = spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue(
      MOCK_STUDENT_ID
    );
    studentFindByIdSpy = spyOn(StudentRepository, "findById").mockResolvedValue(buildMockStudentSelect());
    studentGetAssignedToTeacherSpy = spyOn(StudentRepository, "getAssignedToTeacher").mockResolvedValue({
      rows: [buildMockTeacherAssignedStudent()],
      totalCount: 1,
    });
    parentFindByUserIdSpy = spyOn(ParentRepository, "findByUserId").mockResolvedValue(buildMockParentSelect());
    appraisalUpsertSpy = spyOn(MonthlyAppraisalRepository, "upsert").mockResolvedValue(buildMockAppraisal());
    appraisalFindByIdSpy = spyOn(MonthlyAppraisalRepository, "findById").mockResolvedValue(buildMockAppraisal());
    appraisalFindForStudentMonthSpy = spyOn(MonthlyAppraisalRepository, "findForStudentMonth").mockResolvedValue(
      buildMockAppraisal()
    );
    appraisalListForStudentSpy = spyOn(MonthlyAppraisalRepository, "listForStudent").mockResolvedValue([
      buildMockAppraisal(),
    ]);
    appraisalListForTeacherStudentsSpy = spyOn(MonthlyAppraisalRepository, "listForTeacherStudents").mockResolvedValue([
      buildMockAppraisal(),
    ]);
    appraisalAppendFeedbackSpy = spyOn(MonthlyAppraisalRepository, "appendFeedback").mockResolvedValue(
      buildMockFeedback()
    );
  });

  afterEach(() => {
    hasPermissionSpy.mockRestore();
    teacherFindByUserIdSpy.mockRestore();
    studentHasTeacherAssignmentSpy.mockRestore();
    studentGetStudentIdByUserIdSpy.mockRestore();
    studentFindByIdSpy.mockRestore();
    studentGetAssignedToTeacherSpy.mockRestore();
    parentFindByUserIdSpy.mockRestore();
    appraisalUpsertSpy.mockRestore();
    appraisalFindByIdSpy.mockRestore();
    appraisalFindForStudentMonthSpy.mockRestore();
    appraisalListForStudentSpy.mockRestore();
    appraisalListForTeacherStudentsSpy.mockRestore();
    appraisalAppendFeedbackSpy.mockRestore();
  });

  // ─── Tier 1: 100% branches ──────────────────────────────────────────
  describe("Tier 1 — submitAppraisal", () => {
    test("happy path: new appraisal with all grades set", async () => {
      const result = await MonthlyAppraisalService.submitAppraisal(buildSubmitInput(), MOCK_TEACHER_USER_ID, "en");

      expect(result.id).toBe(MOCK_APPRAISAL_ID);
      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(1);
      const callArg = appraisalUpsertSpy.mock.calls[0][0];
      // Service MUST ignore client-supplied teacherId (BOLA/IDOR defense).
      expect(callArg.teacherId).toBe(MOCK_TEACHER_ID);
      expect(callArg.studentId).toBe(MOCK_STUDENT_ID);
      // Month MUST be normalized to first-of-month.
      expect(callArg.month.toISOString()).toBe(NORMALIZED_MONTH.toISOString());
      expect(callArg.behaviorGrade).toBe(4);
      expect(callArg.learningTargets).toBe("Improve reading comprehension");
    });

    test("happy path: update via upsert (second call)", async () => {
      const input = buildSubmitInput({ behaviorGrade: 5, overallComment: "Updated comment" });
      await MonthlyAppraisalService.submitAppraisal(input, MOCK_TEACHER_USER_ID, "en");
      await MonthlyAppraisalService.submitAppraisal(input, MOCK_TEACHER_USER_ID, "en");

      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(2);
      // Both calls normalized to same first-of-month + same teacherId.
      const firstCall = appraisalUpsertSpy.mock.calls[0][0];
      const secondCall = appraisalUpsertSpy.mock.calls[1][0];
      expect(firstCall.teacherId).toBe(secondCall.teacherId);
      expect(firstCall.month.getTime()).toBe(secondCall.month.getTime());
      expect(secondCall.behaviorGrade).toBe(5);
      expect(secondCall.overallComment).toBe("Updated comment");
    });
  });

  describe("Tier 1 — addFeedback", () => {
    test("happy path: parent appends feedback", async () => {
      const result = await MonthlyAppraisalService.addFeedback(
        { appraisalId: MOCK_APPRAISAL_ID, authorUserId: MOCK_PARENT_USER_ID, body: "Thank you!" },
        MOCK_PARENT_USER_ID,
        "en"
      );

      expect(result.id).toBe(MOCK_FEEDBACK_ID);
      expect(appraisalAppendFeedbackSpy).toHaveBeenCalledTimes(1);
      const appendCall = appraisalAppendFeedbackSpy.mock.calls[0];
      const appendArg = appendCall?.[0];
      expect(appendArg?.appraisalId).toBe(MOCK_APPRAISAL_ID);
      expect(appendArg?.authorUserId).toBe(MOCK_PARENT_USER_ID);
      expect(appendArg?.body).toBe("Thank you!");
    });
  });

  describe("Tier 1 — getMyMonthlyAppraisal", () => {
    test("happy path: returns appraisal for own student + month", async () => {
      const result = await MonthlyAppraisalService.getMyMonthlyAppraisal(MOCK_STUDENT_USER_ID, MID_MONTH, "en");

      expect(result?.id).toBe(MOCK_APPRAISAL_ID);
      // Month normalized before repo call.
      const callArgs = appraisalFindForStudentMonthSpy.mock.calls[0];
      expect(callArgs?.[0]).toBe(MOCK_STUDENT_ID);
      const callArgsMonth = callArgs?.[1];
      expect(callArgsMonth).toBeInstanceOf(Date);
      expect(callArgsMonth instanceof Date ? callArgsMonth.toISOString() : "").toBe(NORMALIZED_MONTH.toISOString());
    });

    test("empty state: returns null when no appraisal exists", async () => {
      appraisalFindForStudentMonthSpy.mockResolvedValue(null);

      const result = await MonthlyAppraisalService.getMyMonthlyAppraisal(MOCK_STUDENT_USER_ID, MID_MONTH, "en");

      expect(result).toBeNull();
    });

    test("empty state: returns null when caller has no student profile", async () => {
      studentGetStudentIdByUserIdSpy.mockResolvedValue(null);

      const result = await MonthlyAppraisalService.getMyMonthlyAppraisal("non-student-user-uuid", MID_MONTH, "en");

      expect(result).toBeNull();
      expect(appraisalFindForStudentMonthSpy).not.toHaveBeenCalled();
    });
  });

  describe("Tier 1 — getStudentMonthlyAppraisals", () => {
    test("viewer is parent — returns list", async () => {
      // Parent viewer: ParentRepository.findByUserId returns parent;
      // StudentRepository.findById returns student with parentId === parent.id.
      studentGetStudentIdByUserIdSpy.mockResolvedValue(null); // not a student
      teacherFindByUserIdSpy.mockResolvedValue(null); // not a teacher

      const result = await MonthlyAppraisalService.getStudentMonthlyAppraisals(
        MOCK_PARENT_USER_ID,
        MOCK_STUDENT_ID,
        "en"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(MOCK_APPRAISAL_ID);
      expect(appraisalListForStudentSpy).toHaveBeenCalledWith(MOCK_STUDENT_ID);
    });

    test("viewer is student — returns own list", async () => {
      // Student viewer: StudentRepository.getStudentIdByUserId returns
      // viewer's studentId, which must equal the target studentId.
      parentFindByUserIdSpy.mockResolvedValue(null); // not a parent
      teacherFindByUserIdSpy.mockResolvedValue(null); // not a teacher

      const result = await MonthlyAppraisalService.getStudentMonthlyAppraisals(
        MOCK_STUDENT_USER_ID,
        MOCK_STUDENT_ID,
        "en"
      );

      expect(result).toHaveLength(1);
    });

    test("viewer is teacher — returns list for assigned student", async () => {
      // Teacher viewer: TeacherRepository.findByUserId returns teacher;
      // StudentRepository.hasTeacherAssignment returns true.
      studentGetStudentIdByUserIdSpy.mockResolvedValue(null); // not a student
      parentFindByUserIdSpy.mockResolvedValue(null); // not a parent

      const result = await MonthlyAppraisalService.getStudentMonthlyAppraisals(
        MOCK_TEACHER_USER_ID,
        MOCK_STUDENT_ID,
        "en"
      );

      expect(result).toHaveLength(1);
      expect(studentHasTeacherAssignmentSpy).toHaveBeenCalledWith(MOCK_STUDENT_ID, MOCK_TEACHER_ID);
    });
  });

  describe("Tier 1 — getTeacherMonthlyAppraisalStudents", () => {
    test("no month filter: returns assigned students with null appraisalForMonth", async () => {
      const result = await callGetTeacherAppraisalStudents(undefined);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(MOCK_STUDENT_ID);
      expect(result[0].name).toBe("Test Student");
      expect(result[0].appraisalForMonth).toBeNull();
      expect(appraisalListForTeacherStudentsSpy).not.toHaveBeenCalled();
    });

    test("with month filter: cross-references appraisals for that month", async () => {
      const result = await callGetTeacherAppraisalStudents(MID_MONTH);

      expect(result).toHaveLength(1);
      expect(result[0].appraisalForMonth).not.toBeNull();
      expect(result[0].appraisalForMonth?.id).toBe(MOCK_APPRAISAL_ID);
      expect(appraisalListForTeacherStudentsSpy).toHaveBeenCalledWith(MOCK_TEACHER_ID, [MOCK_STUDENT_ID]);
    });

    test("with month filter: student without appraisal for that month → null appraisalForMonth", async () => {
      appraisalListForTeacherStudentsSpy.mockResolvedValue([]);

      const result = await callGetTeacherAppraisalStudents(MID_MONTH);

      expect(result[0].appraisalForMonth).toBeNull();
    });

    test("with month filter: appraisal with mismatched month → null appraisalForMonth", async () => {
      appraisalListForTeacherStudentsSpy.mockResolvedValue([
        buildMockAppraisal({ month: new Date("2026-09-01T00:00:00.000Z") }),
      ]);

      const result = await callGetTeacherAppraisalStudents(MID_MONTH);

      expect(result[0].appraisalForMonth).toBeNull();
    });

    test("empty assigned list: returns [] without appraisal lookup", async () => {
      studentGetAssignedToTeacherSpy.mockResolvedValue({ rows: [], totalCount: 0 });

      const result = await callGetTeacherAppraisalStudents(MID_MONTH);

      expect(result).toEqual([]);
      expect(appraisalListForTeacherStudentsSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Tier 2: boundary ───────────────────────────────────────────────
  describe("Tier 2 — grade boundary validation", () => {
    test("grade 0 → ValidationError", async () => {
      await expectRejects(
        async () =>
          MonthlyAppraisalService.submitAppraisal(buildSubmitInput({ behaviorGrade: 0 }), MOCK_TEACHER_USER_ID),
        ValidationError
      );
      expect(appraisalUpsertSpy).not.toHaveBeenCalled();
    });

    test("grade 1 → ok (lower bound)", async () => {
      await MonthlyAppraisalService.submitAppraisal(
        buildSubmitInput({ behaviorGrade: 1, attendanceGrade: 1, punctualityGrade: 1, overallGrade: 1 }),
        MOCK_TEACHER_USER_ID,
        "en"
      );
      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(1);
    });

    test("grade 5 → ok (upper bound)", async () => {
      await MonthlyAppraisalService.submitAppraisal(
        buildSubmitInput({ behaviorGrade: 5, attendanceGrade: 5, punctualityGrade: 5, overallGrade: 5 }),
        MOCK_TEACHER_USER_ID,
        "en"
      );
      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(1);
    });

    test("grade 6 → ValidationError (above upper bound)", async () => {
      await expectRejects(
        async () =>
          MonthlyAppraisalService.submitAppraisal(buildSubmitInput({ overallGrade: 6 }), MOCK_TEACHER_USER_ID),
        ValidationError
      );
    });

    test("grade -1 → ValidationError (below lower bound)", async () => {
      await expectRejects(
        async () =>
          MonthlyAppraisalService.submitAppraisal(buildSubmitInput({ punctualityGrade: -1 }), MOCK_TEACHER_USER_ID),
        ValidationError
      );
    });

    test("grade 3.5 (non-integer) → ValidationError", async () => {
      await expectRejects(
        async () =>
          MonthlyAppraisalService.submitAppraisal(buildSubmitInput({ behaviorGrade: 3.5 }), MOCK_TEACHER_USER_ID),
        ValidationError
      );
    });

    test("null grades (sparse rubric) → ok", async () => {
      await MonthlyAppraisalService.submitAppraisal(
        buildSubmitInput({
          behaviorGrade: null,
          behaviorComment: null,
          attendanceGrade: null,
          attendanceComment: null,
          punctualityGrade: null,
          punctualityComment: null,
          overallGrade: null,
          overallComment: null,
        }),
        MOCK_TEACHER_USER_ID,
        "en"
      );
      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(1);
    });

    test("undefined grades (sparse rubric) → ok", async () => {
      const sparseInput: MonthlyAppraisalSubmitInput = {
        studentId: MOCK_STUDENT_ID,
        teacherId: "forged",
        month: MID_MONTH,
        learningTargets: "Sparse targets only",
      };
      await MonthlyAppraisalService.submitAppraisal(sparseInput, MOCK_TEACHER_USER_ID, "en");
      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Tier 2 — month normalization + unicode", () => {
    test("mid-month Date (15th) normalized to first-of-month (1st)", async () => {
      await MonthlyAppraisalService.submitAppraisal(buildSubmitInput(), MOCK_TEACHER_USER_ID, "en");
      const callArg = appraisalUpsertSpy.mock.calls[0][0];
      expect(callArg.month.getDate()).toBe(1);
      expect(callArg.month.getHours()).toBe(0);
      expect(callArg.month.getMinutes()).toBe(0);
      expect(callArg.month.getSeconds()).toBe(0);
      expect(callArg.month.getMilliseconds()).toBe(0);
      // Original input is NOT mutated.
      expect(MID_MONTH.getDate()).toBe(15);
    });

    test("Arabic unicode + RTL in comments + learningTargets", async () => {
      const arabicInput = buildSubmitInput({
        behaviorComment: "سلوك ممتاز",
        attendanceComment: "حضور كامل",
        learningTargets: "تحسين القراءة والكتابة باللغة العربية",
      });
      await MonthlyAppraisalService.submitAppraisal(arabicInput, MOCK_TEACHER_USER_ID, "en");
      const callArg = appraisalUpsertSpy.mock.calls[0][0];
      expect(callArg.behaviorComment).toBe("سلوك ممتاز");
      expect(callArg.learningTargets).toBe("تحسين القراءة والكتابة باللغة العربية");
    });

    test("feedback body with Arabic unicode + RTL preserved", async () => {
      await MonthlyAppraisalService.addFeedback(
        { appraisalId: MOCK_APPRAISAL_ID, authorUserId: MOCK_PARENT_USER_ID, body: "شكراً على التقييم" },
        MOCK_PARENT_USER_ID,
        "en"
      );
      const arabicCall = appraisalAppendFeedbackSpy.mock.calls[0];
      const arabicBody = arabicCall?.[0]?.body;
      expect(arabicBody).toBe("شكراً على التقييم");
    });
  });

  describe("Tier 2 — feedback body validation", () => {
    test("empty body → ValidationError", async () => {
      await expectAddFeedbackRejects("", ValidationError);
      expect(appraisalAppendFeedbackSpy).not.toHaveBeenCalled();
    });

    test("whitespace-only body → ValidationError", async () => {
      await expectAddFeedbackRejects("   \n\t  ", ValidationError);
      expect(appraisalAppendFeedbackSpy).not.toHaveBeenCalled();
    });

    test("body is trimmed before persistence", async () => {
      await MonthlyAppraisalService.addFeedback(
        { appraisalId: MOCK_APPRAISAL_ID, authorUserId: MOCK_PARENT_USER_ID, body: "  Hello  " },
        MOCK_PARENT_USER_ID,
        "en"
      );
      const appendCall = appraisalAppendFeedbackSpy.mock.calls[0];
      const appendedBody = appendCall?.[0]?.body;
      expect(appendedBody).toBe("Hello");
    });
  });

  // ─── Tier 3: out-of-order ───────────────────────────────────────────
  describe("Tier 3 — out-of-order operations", () => {
    test("addFeedback on non-existent appraisal → NotFoundError APPRAISAL_NOT_FOUND", async () => {
      appraisalFindByIdSpy.mockResolvedValue(null);

      let errorCaught: Error | null = null;
      try {
        await MonthlyAppraisalService.addFeedback(
          { appraisalId: "nonexistent-appraisal-id", authorUserId: MOCK_PARENT_USER_ID, body: "Hi" },
          MOCK_PARENT_USER_ID,
          "en"
        );
      } catch (e) {
        errorCaught = e instanceof Error ? e : null;
      }
      expect(errorCaught).toBeInstanceOf(NotFoundError);
      if (errorCaught instanceof Error && "code" in errorCaught) {
        expect(errorCaught.code).toBe("APPRAISAL_NOT_FOUND");
      } else {
        throw new Error("Error does not have a code property");
      }
      expect(appraisalAppendFeedbackSpy).not.toHaveBeenCalled();
    });

    test("submit then submit again (upsert update path) — repo receives normalized month both times", async () => {
      const input = buildSubmitInput();
      await MonthlyAppraisalService.submitAppraisal(input, MOCK_TEACHER_USER_ID, "en");
      await MonthlyAppraisalService.submitAppraisal(input, MOCK_TEACHER_USER_ID, "en");
      expect(appraisalUpsertSpy).toHaveBeenCalledTimes(2);
      const firstCall = appraisalUpsertSpy.mock.calls[0];
      const secondCall = appraisalUpsertSpy.mock.calls[1];
      const firstMonth = firstCall?.[0]?.month;
      const secondMonth = secondCall?.[0]?.month;
      const firstTeacherId = firstCall?.[0]?.teacherId;
      const secondTeacherId = secondCall?.[0]?.teacherId;
      expect(firstMonth?.getTime()).toBe(secondMonth?.getTime());
      expect(firstTeacherId).toBe(secondTeacherId);
    });

    test("addFeedback twice (append) — repo.appendFeedback called twice with same appraisalId", async () => {
      const input = { appraisalId: MOCK_APPRAISAL_ID, authorUserId: MOCK_PARENT_USER_ID, body: "First reply" };
      await MonthlyAppraisalService.addFeedback(input, MOCK_PARENT_USER_ID, "en");
      await MonthlyAppraisalService.addFeedback({ ...input, body: "Second reply" }, MOCK_PARENT_USER_ID, "en");
      expect(appraisalAppendFeedbackSpy).toHaveBeenCalledTimes(2);
      const firstCall = appraisalAppendFeedbackSpy.mock.calls[0];
      const secondCall = appraisalAppendFeedbackSpy.mock.calls[1];
      const firstBody = firstCall?.[0]?.body;
      const secondBody = secondCall?.[0]?.body;
      expect(firstBody).toBe("First reply");
      expect(secondBody).toBe("Second reply");
    });
  });

  // ─── Tier 4: security ───────────────────────────────────────────────
  describe("Tier 4 — security & tenancy", () => {
    test("forged teacherId in input is ignored (auth-derived teacherId wins)", async () => {
      const forgedInput = buildSubmitInput({ teacherId: "forged-teacher-id-from-client" });
      await MonthlyAppraisalService.submitAppraisal(forgedInput, MOCK_TEACHER_USER_ID, "en");
      const upsertCall = appraisalUpsertSpy.mock.calls[0];
      const callArgTeacherId = upsertCall?.[0]?.teacherId;
      expect(callArgTeacherId).toBe(MOCK_TEACHER_ID);
      expect(callArgTeacherId).not.toBe("forged-teacher-id-from-client");
    });

    test("teacher without assignment to student → ForbiddenError", async () => {
      studentHasTeacherAssignmentSpy.mockResolvedValue(false);

      await expectRejects(
        async () => MonthlyAppraisalService.submitAppraisal(buildSubmitInput(), MOCK_TEACHER_USER_ID, "en"),
        ForbiddenError
      );
      expect(appraisalUpsertSpy).not.toHaveBeenCalled();
    });

    test("parent viewing another parent's student → ForbiddenError", async () => {
      // Setup: viewer is a parent (MOCK_PARENT_USER_ID), but student belongs
      // to a DIFFERENT parent (MOCK_OTHER_PARENT_ID).
      studentGetStudentIdByUserIdSpy.mockResolvedValue(null);
      teacherFindByUserIdSpy.mockResolvedValue(null);
      studentFindByIdSpy.mockResolvedValue({
        id: MOCK_OTHER_STUDENT_ID,
        userId: "other-student-user-uuid",
        parentId: MOCK_OTHER_PARENT_ID,
        name: "Other Student",
        avatarUrl: null,
        status: "REGULAR",
        hoursPerWeek: "4",
        classesRemaining: 12,
        classesTotal: 20,
        primaryTeacherId: null,
        language: null,
        gender: null,
        version: 1,
        updatedAt: new Date(),
      });

      await expectRejects(
        async () =>
          MonthlyAppraisalService.getStudentMonthlyAppraisals(MOCK_PARENT_USER_ID, MOCK_OTHER_STUDENT_ID, "en"),
        ForbiddenError
      );
      expect(appraisalListForStudentSpy).not.toHaveBeenCalled();
    });

    test("student viewing another student's appraisal → ForbiddenError", async () => {
      // Setup: viewer is a student (MOCK_STUDENT_USER_ID → MOCK_STUDENT_ID),
      // but they're trying to view MOCK_OTHER_STUDENT_ID.
      studentGetStudentIdByUserIdSpy.mockResolvedValue(MOCK_STUDENT_ID);
      parentFindByUserIdSpy.mockResolvedValue(null);
      teacherFindByUserIdSpy.mockResolvedValue(null);

      await expectRejects(
        async () =>
          MonthlyAppraisalService.getStudentMonthlyAppraisals(MOCK_STUDENT_USER_ID, MOCK_OTHER_STUDENT_ID, "en"),
        ForbiddenError
      );
      expect(appraisalListForStudentSpy).not.toHaveBeenCalled();
    });

    test("submitAppraisal without APPRAISAL_SUBMIT permission → UnauthorizedError", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      await expectRejects(
        async () => MonthlyAppraisalService.submitAppraisal(buildSubmitInput(), MOCK_TEACHER_USER_ID, "en"),
        UnauthorizedError
      );
      expect(appraisalUpsertSpy).not.toHaveBeenCalled();
    });

    test("addFeedback without APPRAISAL_FEEDBACK permission → UnauthorizedError", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      await expectRejects(
        async () =>
          MonthlyAppraisalService.addFeedback(
            { appraisalId: MOCK_APPRAISAL_ID, authorUserId: MOCK_PARENT_USER_ID, body: "Hi" },
            MOCK_PARENT_USER_ID,
            "en"
          ),
        UnauthorizedError
      );
      expect(appraisalAppendFeedbackSpy).not.toHaveBeenCalled();
    });

    test("getMyMonthlyAppraisal without APPRAISAL_VIEW permission → UnauthorizedError", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      await expectRejects(
        async () => MonthlyAppraisalService.getMyMonthlyAppraisal(MOCK_STUDENT_USER_ID, MID_MONTH, "en"),
        UnauthorizedError
      );
      expect(appraisalFindForStudentMonthSpy).not.toHaveBeenCalled();
    });

    test("getStudentMonthlyAppraisals without APPRAISAL_VIEW permission → UnauthorizedError", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      await expectRejects(
        async () => MonthlyAppraisalService.getStudentMonthlyAppraisals(MOCK_PARENT_USER_ID, MOCK_STUDENT_ID, "en"),
        UnauthorizedError
      );
      expect(appraisalListForStudentSpy).not.toHaveBeenCalled();
    });

    test("getTeacherMonthlyAppraisalStudents without APPRAISAL_SUBMIT permission → UnauthorizedError", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      await expectRejects(
        async () => MonthlyAppraisalService.getTeacherMonthlyAppraisalStudents(MOCK_TEACHER_USER_ID, undefined, "en"),
        UnauthorizedError
      );
      expect(studentGetAssignedToTeacherSpy).not.toHaveBeenCalled();
    });

    test("submitAppraisal by user with no teacher profile → NotFoundError TEACHER_NOT_FOUND", async () => {
      teacherFindByUserIdSpy.mockResolvedValue(null);

      let errorCaught: Error | null = null;
      try {
        await MonthlyAppraisalService.submitAppraisal(buildSubmitInput(), "non-teacher-user-uuid", "en");
      } catch (e) {
        errorCaught = e instanceof Error ? e : null;
      }
      expect(errorCaught).toBeInstanceOf(NotFoundError);
      if (errorCaught instanceof Error && "code" in errorCaught) {
        expect(errorCaught.code).toBe("TEACHER_NOT_FOUND");
      } else {
        throw new Error("Error does not have a code property");
      }
      expect(studentHasTeacherAssignmentSpy).not.toHaveBeenCalled();
      expect(appraisalUpsertSpy).not.toHaveBeenCalled();
    });

    test("getTeacherMonthlyAppraisalStudents by user with no teacher profile → NotFoundError", async () => {
      teacherFindByUserIdSpy.mockResolvedValue(null);

      await expectRejects(
        async () =>
          MonthlyAppraisalService.getTeacherMonthlyAppraisalStudents("non-teacher-user-uuid", undefined, "en"),
        NotFoundError
      );
      expect(studentGetAssignedToTeacherSpy).not.toHaveBeenCalled();
    });

    test("addFeedback by viewer who is neither parent/student/teacher → ForbiddenError", async () => {
      studentGetStudentIdByUserIdSpy.mockResolvedValue(null);
      parentFindByUserIdSpy.mockResolvedValue(null);
      teacherFindByUserIdSpy.mockResolvedValue(null);

      await expectRejects(
        async () =>
          MonthlyAppraisalService.addFeedback(
            { appraisalId: MOCK_APPRAISAL_ID, authorUserId: "orphan-user-uuid", body: "Hi" },
            "orphan-user-uuid",
            "en"
          ),
        ForbiddenError
      );
      expect(appraisalAppendFeedbackSpy).not.toHaveBeenCalled();
    });
  });
});
