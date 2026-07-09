import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherVacationRequests } from "@/backend/db/schema/teacher-availability";
import { addMonths, findAdminUser, loadSeedConfig, type SeedConfig, startOfDay } from "@/backend/db/seeds/lib";
import { VacationRequestStatus } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/timezone.enum";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, TimezoneEntity, UserSelectType } from "@/backend/types";

async function upsertVacationRequest(
  teacher: TeacherEntity,
  teacherTimezone: string,
  requestedByUserId: string,
  startAt: Date,
  endAt: Date,
  tz: TimezoneEntity | undefined,
  processing: { status: VacationRequestStatus; adminUserId: string | undefined; now: Date }
) {
  const [existing] = await db
    .select()
    .from(teacherVacationRequests)
    .where(eq(teacherVacationRequests.teacherId, teacher.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  const { status, adminUserId, now } = processing;
  const isPending = status === VacationRequestStatus.PENDING;

  const [inserted] = await db
    .insert(teacherVacationRequests)
    .values({
      teacherId: teacher.id,
      requestedByUserId,
      startAt,
      endAt,
      timezone: teacherTimezone,
      timezoneId: tz?.id ?? null,
      reason: "Seed vacation request",
      status,
      processedAt: isPending ? null : now,
      processedByUserId: isPending ? null : (adminUserId ?? null),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return inserted;
}

function buildVacationSpecs(teachersList: TeacherEntity[], profile: string) {
  const specs: Array<{
    teacherIndex: number;
    status: VacationRequestStatus;
    startOffsetMonths: number;
    durationDays: number;
  }> = [
    {
      teacherIndex: 0,
      status: VacationRequestStatus.APPROVED,
      startOffsetMonths: 1,
      durationDays: 5,
    },
    {
      teacherIndex: Math.min(1, teachersList.length - 1),
      status: VacationRequestStatus.PENDING,
      startOffsetMonths: 2,
      durationDays: 3,
    },
  ];

  if (profile === "standard" && teachersList.length > 2) {
    specs.push({
      teacherIndex: 2,
      status: VacationRequestStatus.REJECTED,
      startOffsetMonths: -2,
      durationDays: 4,
    });
  }

  return specs;
}

export async function seedOrGet(
  teachersList: TeacherEntity[],
  usersList: UserSelectType[],
  timezones: TimezoneEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding teacher vacation requests...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const teacherUserMap = new Map(teachersList.map(t => [t.id, usersList.find(u => u.id === t.userId)?.id]));
  const anchor = startOfDay(seedConfig.anchorDate);
  const specs = buildVacationSpecs(teachersList, seedConfig.profile);
  const results = [];

  for (const spec of specs) {
    const teacher = teachersList[spec.teacherIndex];
    if (!teacher) continue;

    const requestedByUserId = teacherUserMap.get(teacher.id);
    if (!requestedByUserId) continue;

    const startAt = addMonths(anchor, spec.startOffsetMonths);
    const endAt = new Date(startAt);
    endAt.setDate(endAt.getDate() + spec.durationDays);
    const teacherTimezone = usersList.find(u => u.id === teacher.userId)?.timezone ?? IanaTimezone.UTC;
    const tz = timezones.find(t => t.ianaId === teacherTimezone) ?? timezones[0];

    const inserted = await upsertVacationRequest(teacher, teacherTimezone, requestedByUserId, startAt, endAt, tz, {
      status: spec.status,
      adminUserId: adminUser?.id,
      now,
    });
    results.push(inserted);
  }

  logger.info(`Teacher vacation requests seeded (${results.length} rows).`);
  return results;
}
