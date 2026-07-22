import { findAdminUserOrFallback, type SeedConfig } from "@/backend/db/seeds/lib";
import { ClassExecutionState, CurrencyCode, LessonReportStatus, TeacherDueStatus } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import type {
  ClassInstanceEntity,
  LessonReportReturnType,
  TeacherDueReturnType,
  TeacherEntity,
  UserSelectType,
} from "@/backend/types";

type SeededDueSpec = {
  classInstance: ClassInstanceEntity;
  teacherId: string;
  studentId: string;
  hours: number;
  amount: number;
  currency: CurrencyCode;
  status: TeacherDueStatus;
  approvedAt: Date;
};

const DEFAULT_HOURLY_RATE = 60;

function buildSpecs(
  approvedReports: LessonReportReturnType[],
  classInstanceById: Map<string, ClassInstanceEntity>,
  teacherById: Map<string, TeacherEntity>
): SeededDueSpec[] {
  const specs: SeededDueSpec[] = [];

  for (let i = 0; i < approvedReports.length; i++) {
    const report = approvedReports[i];
    if (!report) continue;

    const instance = classInstanceById.get(report.classInstanceId);
    if (!instance || instance.executionState !== ClassExecutionState.COMPLETED) continue;

    const teacher = teacherById.get(report.teacherId);
    if (!teacher?.hourlyRate) continue;

    const hourlyRateStr = teacher.hourlyRate ?? String(DEFAULT_HOURLY_RATE);
    const rateCurrency = (teacher.rateCurrency ?? CurrencyCode.SAR) as CurrencyCode;
    const durationMinutes = instance.durationMinutes;
    const hours = +(durationMinutes / 60).toFixed(2);
    const amount = +(Number.parseFloat(hourlyRateStr) * hours).toFixed(2);

    // Alternate between PENDING and PAID for a more realistic ledger.
    const status = i % 2 === 0 ? TeacherDueStatus.PAID : TeacherDueStatus.PENDING;
    const approvedAt = report.reviewedAt ?? instance.actualEndAt ?? instance.scheduledEndAt ?? new Date();

    specs.push({
      classInstance: instance,
      teacherId: report.teacherId,
      studentId: report.studentId,
      hours,
      amount,
      currency: rateCurrency,
      status,
      approvedAt,
    });
  }

  return specs;
}

export async function seedOrGet(
  lessonReports: LessonReportReturnType[],
  classInstancesList: ClassInstanceEntity[],
  teachersList: TeacherEntity[],
  users: UserSelectType[],
  _config?: SeedConfig
): Promise<TeacherDueReturnType[]> {
  logger.info("Seeding LMS teacher dues...");

  if (!lessonReports?.length || !classInstancesList?.length || !teachersList?.length) {
    logger.warn("Missing required seed data — skipping teacher dues seed.");
    return [];
  }

  const approvedReports = lessonReports.filter(report => report.status === LessonReportStatus.APPROVED);
  if (approvedReports.length === 0) {
    logger.warn("No APPROVED lesson reports available — skipping teacher dues seed.");
    return [];
  }

  const classInstanceById = new Map(classInstancesList.map(inst => [inst.id, inst]));
  const teacherById = new Map(teachersList.map(t => [t.id, t]));
  const adminUser = findAdminUserOrFallback(users);
  if (!adminUser) {
    logger.warn("No admin user available to approve dues — skipping teacher dues seed.");
    return [];
  }

  const specs = buildSpecs(approvedReports, classInstanceById, teacherById);

  const results: (TeacherDueReturnType | null)[] = [];

  for (const spec of specs) {
    const due = await TeacherDueService.seedTeacherDueIfMissing({
      classInstanceId: spec.classInstance.id,
      teacherId: spec.teacherId,
      studentId: spec.studentId,
      hours: spec.hours,
      amount: spec.amount,
      currency: spec.currency,
      approvedByUserId: adminUser.id,
      status: spec.status,
      approvedAt: spec.approvedAt,
    });

    results.push(due);
  }

  const seeded = results.filter((row): row is TeacherDueReturnType => row != null);
  logger.info(`LMS teacher dues seeded (${seeded.length} rows).`);
  return seeded;
}
