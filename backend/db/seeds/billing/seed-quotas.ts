import { QuotaKind, QuotaPeriodType, SchedulingMode } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { ClassCatalogService } from "@/backend/services/classes/class-catalog.service";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import type { QuotaSubmitInput } from "@/backend/types";

const DEMO_STUDENT_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_TEACHER_ID = "00000000-0000-0000-0000-000000000002";
const ON_DEMAND_SUBJECT_SLUG = "tajweed";

export async function seedOrGet() {
  logger.info("Seeding sample billing quotas...");

  if (process.env.NODE_ENV === "production") {
    logger.warn("Quota seeding skipped in production");
    return [];
  }

  const now = new Date().toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const quotaInputs: QuotaSubmitInput[] = [
    {
      studentId: DEMO_STUDENT_ID,
      kind: QuotaKind.PACKAGE,
      name: "Demo Package Quota",
      totalClasses: 10,
      validFrom: now,
      validUntil: nextMonth,
      priority: 10,
    },
    {
      studentId: DEMO_STUDENT_ID,
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
      studentId: DEMO_STUDENT_ID,
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

  await seedOnDemandSchedule();

  return [];
}

async function seedOnDemandSchedule() {
  try {
    const subjects = await ClassCatalogService.findSubjectsBySlugs([ON_DEMAND_SUBJECT_SLUG]);
    if (!subjects.length) {
      logger.warn("On-demand schedule seed skipped: subject not found.");
      return;
    }

    await RecurringClassService.upsertManyRecurringSchedules([
      {
        teacherId: DEMO_TEACHER_ID,
        studentId: DEMO_STUDENT_ID,
        subjectId: subjects[0].id,
        schedulingMode: SchedulingMode.ON_DEMAND,
        durationMinutes: 60,
        defaultStartTime: "10:00",
        timezone: "Asia/Dubai",
      },
    ]);

    logger.info("On-demand schedule entry seeded.");
  } catch (err) {
    logger.warn("Could not seed on-demand schedule (demo entities may not exist):", { err });
  }
}
