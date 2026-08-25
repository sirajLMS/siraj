import { DayOfWeek, QuotaKind, QuotaPeriodType, SchedulingMode } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { ClassCatalogService, QuotaService, RecurringClassService } from "@/backend/services";
import type { QuotaReturnType, QuotaSubmitInput, StudentSelectType, TeacherSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { getServerTranslations } from "@/shared/locale";

const ON_DEMAND_SUBJECT_SLUG = "tajweed";

export async function seedOrGet(
  students: StudentSelectType[],
  teachers: TeacherSelectType[],
  actorUserId?: string
): Promise<QuotaReturnType[]> {
  logger.info("Seeding sample billing quotas...");

  if (process.env.NODE_ENV === "production") {
    logger.warn("Quota seeding skipped in production");
    return [];
  }

  const demoStudent = students[0];
  const demoTeacher = teachers[0];
  if (!demoStudent || !demoTeacher) {
    logger.info("Quota seeding skipped: demo student/teacher not available.");
    return [];
  }

  const now = new Date().toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const quotaInputs: QuotaSubmitInput[] = [
    {
      studentId: demoStudent.id,
      kind: QuotaKind.PACKAGE,
      name: "Demo Package Quota",
      totalClasses: 10,
      validFrom: now,
      validUntil: nextMonth,
      priority: 10,
    },
    {
      studentId: demoStudent.id,
      kind: QuotaKind.PERIODIC,
      name: "Demo Monthly Quota",
      totalClasses: 20,
      periodType: QuotaPeriodType.MONTHLY,
      periodDays: 30,
      validFrom: now,
      validUntil: nextMonth,
      priority: 20,
    },
    {
      studentId: demoStudent.id,
      kind: QuotaKind.PERIODIC,
      name: "Demo Custom 90-Day Quota",
      totalClasses: 50,
      periodType: QuotaPeriodType.CUSTOM,
      periodDays: 90,
      validFrom: now,
      validUntil: ninetyDays,
      priority: 30,
    },
  ];

  try {
    const rows = await QuotaService.seedOrGetQuotaBatch(quotaInputs);

    if (rows.length > 0) {
      logger.info(`Billing quotas present (${rows.length} rows).`);
    } else {
      logger.info("No billing quotas seeded (demo student UUID may not exist).");
    }
  } catch (err) {
    logger.warn("Could not seed demo quotas (student UUID may not exist):", { err });
  }

  await seedOnDemandSchedule(demoStudent, demoTeacher, actorUserId);

  return [];
}

async function seedOnDemandSchedule(
  demoStudent: StudentSelectType,
  demoTeacher: TeacherSelectType,
  actorUserId: string | undefined
): Promise<void> {
  try {
    const subjects = await ClassCatalogService.findSubjectsBySlugs([ON_DEMAND_SUBJECT_SLUG]);
    if (!subjects.length) {
      logger.warn("On-demand schedule seed skipped: subject not found.");
      return;
    }

    if (!actorUserId) {
      logger.warn("On-demand schedule seed skipped: no actor user available.");
      return;
    }

    const tErrors = getServerTranslations("en").errorsTranslations;

    await RecurringClassService.createRecurringClass(
      actorUserId,
      {
        teacherId: demoTeacher.id,
        studentId: demoStudent.id,
        subjectId: subjects[0].id,
        schedulingMode: SchedulingMode.ON_DEMAND,
        durationMinutes: 60,
        defaultStartTime: "10:00",
        // demoTeacher (index 0) is seeded with UTC timezone and Mon 08:00–20:00
        // availability windows (see seed-teachers.ts / availability-factory.ts);
        // booking in UTC keeps 10:00 inside the window. Using the teacher's
        // local timezone shifts the slot out of the window in UTC terms.
        timezone: IanaTimezone.UTC,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, startTime: "10:00", isActive: true }],
      },
      tErrors
    );

    logger.info("On-demand schedule entry seeded.");
  } catch (err) {
    logger.warn("Could not seed on-demand schedule (demo entities may not exist):", { err });
  }
}
