import type { SeedConfig } from "@/backend/db/seeds/lib";
import { findAdminUserOrFallback, findSupervisorUserOrFallback } from "@/backend/db/seeds/lib";
import { AttendanceEvaluation, ClassExecutionState, LessonReportStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";
import type {
  ClassInstanceSelectType,
  LessonReportReturnType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";

type LessonReportSpec = {
  classInstance: ClassInstanceSelectType;
  attendanceEvaluation: AttendanceEvaluation;
  completionPercentage: number;
  status: LessonReportStatus;
  teacherNotes: string | null;
  rejectionReason: string | null;
};

const MAX_SEED_REPORTS = 12;

function pickAttendanceEvaluation(index: number): AttendanceEvaluation {
  const cycle: AttendanceEvaluation[] = [
    AttendanceEvaluation.PRESENT,
    AttendanceEvaluation.LATE,
    AttendanceEvaluation.ABSENT,
  ];
  return cycle[index % cycle.length] ?? AttendanceEvaluation.PRESENT;
}

function pickStatus(index: number): {
  status: LessonReportStatus;
  rejectionReason: string | null;
} {
  const cycle: LessonReportStatus[] = [
    LessonReportStatus.PENDING_REVIEW,
    LessonReportStatus.APPROVED,
    LessonReportStatus.REJECTED,
    LessonReportStatus.APPROVED,
    LessonReportStatus.PENDING_REVIEW,
  ];
  const status = cycle[index % cycle.length] ?? LessonReportStatus.PENDING_REVIEW;
  const rejectionReason = status === LessonReportStatus.REJECTED ? "Seed rejected report — missing details." : null;
  return { status, rejectionReason };
}

function buildReportSpecs(
  completedInstances: ClassInstanceSelectType[],
  studentById: Map<string, StudentSelectType>,
  teacherById: Map<string, TeacherSelectType>
): LessonReportSpec[] {
  const specs: LessonReportSpec[] = [];

  for (let i = 0; i < completedInstances.length && specs.length < MAX_SEED_REPORTS; i++) {
    const instance = completedInstances[i];
    if (!instance) continue;

    const student = studentById.get(instance.studentId);
    const teacher = teacherById.get(instance.teacherId);
    if (!student || !teacher) continue;
    if (!instance.scheduledStartAt || instance.durationMinutes <= 0) continue;

    const attendanceEvaluation = pickAttendanceEvaluation(i);
    const { status, rejectionReason } = pickStatus(i);

    let completionPercentage: number;
    if (status === LessonReportStatus.APPROVED) {
      completionPercentage = 100;
    } else if (status === LessonReportStatus.REJECTED) {
      completionPercentage = 40;
    } else {
      completionPercentage = 75 + (i % 25);
    }

    specs.push({
      classInstance: instance,
      attendanceEvaluation,
      completionPercentage,
      status,
      teacherNotes: `Seed lesson report for ${teacher.id}:${student.id}`,
      rejectionReason,
    });
  }

  return specs;
}

export async function seedOrGet(
  classInstancesList: ClassInstanceSelectType[],
  teachersList: TeacherSelectType[],
  studentsList: StudentSelectType[],
  users: UserSelectType[],
  _config?: SeedConfig
): Promise<LessonReportReturnType[]> {
  logger.info("Seeding LMS lesson reports...");

  if (!classInstancesList?.length || !teachersList?.length || !studentsList?.length) {
    logger.warn("Missing required seed data — skipping lesson reports seed.");
    return [];
  }

  const completedInstances = classInstancesList.filter(
    instance => instance.executionState === ClassExecutionState.COMPLETED
  );
  if (completedInstances.length === 0) {
    logger.warn("No COMPLETED class instances available — skipping lesson reports seed.");
    return [];
  }

  const studentById = new Map(studentsList.map(s => [s.id, s]));
  const teacherById = new Map(teachersList.map(t => [t.id, t]));
  const teacherUserIdById = new Map(teachersList.map(t => [t.id, t.userId]));
  const adminUser = findAdminUserOrFallback(users);
  const supervisorUser = findSupervisorUserOrFallback(users);

  const specs = buildReportSpecs(completedInstances, studentById, teacherById);

  const results: (LessonReportReturnType | null)[] = [];

  for (const spec of specs) {
    const submittedByUserId = teacherUserIdById.get(spec.classInstance.teacherId) ?? adminUser?.id;
    if (!submittedByUserId) {
      logger.warn("No submitter user id available — skipping lesson report.");
      continue;
    }

    const isReviewed = spec.status === LessonReportStatus.APPROVED || spec.status === LessonReportStatus.REJECTED;
    const reviewedByUserId = isReviewed ? (supervisorUser?.id ?? submittedByUserId) : null;
    const reviewedAt = isReviewed ? (spec.classInstance.actualEndAt ?? spec.classInstance.scheduledEndAt) : null;

    const report = await LessonReportService.seedLessonReportIfMissing({
      classInstanceId: spec.classInstance.id,
      studentId: spec.classInstance.studentId,
      teacherId: spec.classInstance.teacherId,
      lessonDate: spec.classInstance.scheduledStartAt,
      durationMinutes: spec.classInstance.durationMinutes,
      attendanceEvaluation: spec.attendanceEvaluation,
      teacherNotes: spec.teacherNotes,
      completionPercentage: spec.completionPercentage,
      status: spec.status,
      submittedByUserId,
      reviewedByUserId,
      reviewedAt,
      rejectionReason: spec.rejectionReason,
    });

    results.push(report);
  }

  const seeded = results.filter((row): row is LessonReportReturnType => row != null);
  logger.info(`LMS lesson reports seeded (${seeded.length} rows).`);
  return seeded;
}
