import { ParentRepository } from "@/backend/db/repo/parents";
import { MonthlyAppraisalRepository, StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  AppraisalFeedbackInput,
  AppraisalFeedbackReturnType,
  MonthlyAppraisalReturnType,
  MonthlyAppraisalStudentEntry,
  MonthlyAppraisalSubmitInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Monthly Appraisal service — business-logic hub.
 *
 * Responsibilities:
 * - Resolve identity from auth context (`teacherUserId`, `authorUserId`,
 *   `studentUserId`, `viewerUserId`) — NEVER trust client-supplied ids.
 * - Enforce tenancy: teacher must teach the student; parent must own the
 *   student; student must be self.
 * - Validate sparse rubric grades (integers 1..5 or null).
 * - Normalize `month` to the first day of its month so the unique key
 *   `(studentId, teacherId, month)` stays stable across saves.
 * - Map to explicit repo inputs (no input spread — BOPLA).
 *
 * The repo layer is tenant-neutral and trusts whatever ids the service
 * passes — every identity check lives here.
 */

const GRADE_MIN = 1;
const GRADE_MAX = 5;
const GRADE_FIELDS = ["behaviorGrade", "attendanceGrade", "punctualityGrade", "overallGrade"] as const;
type GradeField = (typeof GRADE_FIELDS)[number];

/**
 * Normalize a date to the first day of its month at 00:00:00.000 local time.
 * A fresh Date is returned so the caller's input is never mutated.
 */
function normalizeToFirstOfMonth(date: Date): Date {
  const normalized = new Date(date.getTime());
  normalized.setDate(1);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Validate a sparse rubric grade. `null`/`undefined` is allowed (sparse
 * rubric). Any non-integer or out-of-[1..5] value throws ValidationError.
 */
function validateGrade(grade: number | null | undefined, field: GradeField, invalidInputMessage: string): void {
  if (grade == null) return;
  if (!Number.isInteger(grade) || grade < GRADE_MIN || grade > GRADE_MAX) {
    throw new ValidationError(`APPRAISAL_${field.toUpperCase()}_OUT_OF_RANGE`, invalidInputMessage);
  }
}

function validateAllGrades(input: MonthlyAppraisalSubmitInput, invalidInputMessage: string): void {
  for (const field of GRADE_FIELDS) {
    validateGrade(input[field], field, invalidInputMessage);
  }
}

/**
 * Resolve teacherId from auth-context userId. Throws NotFoundError if the
 * caller has no teacher row — the service NEVER trusts a client-supplied
 * `teacherId` field (BOLA/IDOR defense).
 */
async function resolveTeacherIdOrThrow(teacherUserId: string, locale?: string): Promise<string> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
  const teacher = await TeacherRepository.findByUserId(teacherUserId);
  if (!teacher) {
    throw new NotFoundError("TEACHER", tErrors.notFound);
  }
  return teacher.id;
}

async function assertTeacherTeachesStudent(teacherId: string, studentId: string, locale?: string): Promise<void> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
  const teaches = await StudentRepository.hasTeacherAssignment(studentId, teacherId);
  if (!teaches) {
    throw new ForbiddenError(tErrors.forbidden);
  }
}

/**
 * Tenancy check for viewing a student's appraisals. Returns true if the
 * viewer is (a) the student themselves, (b) the parent of the student, OR
 * (c) a teacher who teaches the student. False otherwise — does NOT throw
 * so the caller can produce the most informative error.
 */
async function canViewerAccessStudent(viewerUserId: string, studentId: string): Promise<boolean> {
  // (a) Student self-view: viewer's studentId (looked up by userId) must
  //     match the target studentId.
  const viewerStudentId = await StudentRepository.getStudentIdByUserId(viewerUserId);
  if (viewerStudentId && viewerStudentId === studentId) return true;

  // (b) Parent owns student: parent row by userId, then student.parentId
  //     must equal parent.id.
  const parent = await ParentRepository.findByUserId(viewerUserId);
  if (parent) {
    const student = await StudentRepository.findById(studentId);
    if (student?.parentId === parent.id) return true;
  }

  // (c) Teacher teaches student: teacher row by userId, then
  //     teacherAssignments must link them.
  const teacher = await TeacherRepository.findByUserId(viewerUserId);
  if (teacher) {
    const teaches = await StudentRepository.hasTeacherAssignment(studentId, teacher.id);
    if (teaches) return true;
  }

  return false;
}

async function assertCanViewStudentAppraisals(viewerUserId: string, studentId: string, locale?: string): Promise<void> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
  const canView = await canViewerAccessStudent(viewerUserId, studentId);
  if (!canView) {
    throw new ForbiddenError(tErrors.forbidden);
  }
}

export namespace MonthlyAppraisalService {
  /**
   * Teacher submits/updates a monthly appraisal (R1.2 idempotent upsert).
   * The `teacherId` is resolved from auth context (NEVER from `input`);
   * the student must be one the teacher teaches; grades must be sparse-null
   * OR integers in [1, 5]; `month` is normalized to the first of its month.
   */
  export async function submitAppraisal(
    input: MonthlyAppraisalSubmitInput,
    teacherUserId: string,
    locale?: string
  ): Promise<MonthlyAppraisalReturnType> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(teacherUserId, AppPermission.APPRAISAL_SUBMIT);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const teacherId = await resolveTeacherIdOrThrow(teacherUserId, locale);
    await assertTeacherTeachesStudent(teacherId, input.studentId, locale);
    validateAllGrades(input, tErrors.invalidInput);
    const normalizedMonth = normalizeToFirstOfMonth(input.month);

    try {
      const appraisal = await MonthlyAppraisalRepository.upsert({
        studentId: input.studentId,
        teacherId,
        month: normalizedMonth,
        behaviorGrade: input.behaviorGrade ?? null,
        behaviorComment: input.behaviorComment ?? null,
        attendanceGrade: input.attendanceGrade ?? null,
        attendanceComment: input.attendanceComment ?? null,
        punctualityGrade: input.punctualityGrade ?? null,
        punctualityComment: input.punctualityComment ?? null,
        overallGrade: input.overallGrade ?? null,
        overallComment: input.overallComment ?? null,
        learningTargets: input.learningTargets,
      });

      logger.info("Monthly appraisal submitted", {
        actorUserId: teacherUserId,
        appraisalId: appraisal.id,
        studentId: input.studentId,
        teacherId,
        month: normalizedMonth.toISOString(),
      });

      return appraisal;
    } catch (error) {
      logger.error("Failed to submit monthly appraisal", {
        actorUserId: teacherUserId,
        studentId: input.studentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Parent/student appends feedback to an existing appraisal (R1.4 feedback
   * loop). The author must be either the student themselves OR the parent of
   * the student on the appraisal. The body must be non-empty after trim.
   */
  export async function addFeedback(
    input: AppraisalFeedbackInput,
    authorUserId: string,
    locale?: string
  ): Promise<AppraisalFeedbackReturnType> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(authorUserId, AppPermission.APPRAISAL_FEEDBACK);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const appraisal = await MonthlyAppraisalRepository.findById(input.appraisalId);
    if (!appraisal) {
      throw new NotFoundError("APPRAISAL", tErrors.notFound);
    }

    await assertCanViewStudentAppraisals(authorUserId, appraisal.studentId, locale);

    const body = input.body?.trim();
    if (!body) {
      throw new ValidationError("APPRAISAL_FEEDBACK_BODY_EMPTY", tErrors.invalidInput);
    }

    try {
      const feedback = await MonthlyAppraisalRepository.appendFeedback({
        appraisalId: input.appraisalId,
        authorUserId,
        body,
      });

      logger.info("Appraisal feedback appended", {
        actorUserId: authorUserId,
        appraisalId: input.appraisalId,
        feedbackId: feedback.id,
      });

      return feedback;
    } catch (error) {
      logger.error("Failed to append appraisal feedback", {
        actorUserId: authorUserId,
        appraisalId: input.appraisalId,
        error,
      });
      throw error;
    }
  }

  /**
   * Student views their own appraisal for a specific month (R1.6 empty
   * state — returns null when no appraisal exists, NEVER throws NotFound).
   * If the caller has no student profile row, returns null (empty state).
   */
  export async function getMyMonthlyAppraisal(
    studentUserId: string,
    month: Date,
    locale?: string
  ): Promise<MonthlyAppraisalReturnType | null> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(studentUserId, AppPermission.APPRAISAL_VIEW);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const studentId = await StudentRepository.getStudentIdByUserId(studentUserId);
    if (!studentId) {
      // No student profile → no appraisal to view (empty state per R1.6).
      return null;
    }

    const normalizedMonth = normalizeToFirstOfMonth(month);
    return MonthlyAppraisalRepository.findForStudentMonth(studentId, normalizedMonth);
  }

  /**
   * Parent/Student/Teacher views a student's appraisals. Tenancy: viewer
   * must be (a) the student themselves, (b) the parent of the student, OR
   * (c) a teacher who teaches the student (BOLA defense).
   */
  export async function getStudentMonthlyAppraisals(
    viewerUserId: string,
    studentId: string,
    locale?: string
  ): Promise<MonthlyAppraisalReturnType[]> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(viewerUserId, AppPermission.APPRAISAL_VIEW);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    await assertCanViewStudentAppraisals(viewerUserId, studentId, locale);

    return MonthlyAppraisalRepository.listForStudent(studentId);
  }

  /**
   * Teacher lists the students they teach (teacher appraisal list view).
   * When `month` is provided, each entry carries an `appraisalForMonth`
   * summary if an appraisal exists for that student/month — null otherwise
   * (sparse UI: distinguish "no appraisal yet" from "appraisal exists").
   */
  export async function getTeacherMonthlyAppraisalStudents(
    teacherUserId: string,
    month?: Date,
    locale?: string
  ): Promise<MonthlyAppraisalStudentEntry[]> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(teacherUserId, AppPermission.APPRAISAL_SUBMIT);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const teacherId = await resolveTeacherIdOrThrow(teacherUserId, locale);
    const assigned = await StudentRepository.getAssignedToTeacher(teacherId);

    if (assigned.rows.length === 0) {
      return [];
    }

    const baseEntries: MonthlyAppraisalStudentEntry[] = assigned.rows.map(s => ({
      id: s.id,
      name: s.name,
      studentAvatarUrl: s.studentAvatarUrl,
      parentId: s.parentId,
      parentName: s.parentName,
      parentAvatarUrl: s.parentAvatarUrl,
      status: s.status,
      hoursPerWeek: s.hoursPerWeek,
      classesRemaining: s.classesRemaining,
      classesTotal: s.classesTotal,
      appraisalForMonth: null,
    }));

    if (!month) {
      return baseEntries;
    }

    const normalizedMonth = normalizeToFirstOfMonth(month);
    const studentIds = assigned.rows.map(s => s.id);
    const appraisalsForMonth = await MonthlyAppraisalRepository.listForTeacherStudents(teacherId, studentIds);
    const normalizedMonthMs = normalizedMonth.getTime();
    const appraisalByStudentId = new Map(
      appraisalsForMonth
        .filter(a => new Date(a.month).getTime() === normalizedMonthMs)
        .map(a => [a.studentId, a] as const)
    );

    return baseEntries.map(entry => {
      const appraisal = appraisalByStudentId.get(entry.id);
      if (!appraisal) return entry;
      return Object.assign({}, entry, {
        appraisalForMonth: {
          id: appraisal.id,
          month: appraisal.month,
          updatedAt: appraisal.updatedAt,
        },
      });
    });
  }
}
