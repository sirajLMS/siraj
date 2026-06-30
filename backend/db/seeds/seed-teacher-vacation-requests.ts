import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherVacationRequests } from "@/backend/db/schema/teacher-availability";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, TimezoneEntity, UserEntity } from "@/backend/types";
import { VacationRequestStatus } from "@/shared/lib/enum";
import { addMonths, findAdminUser, loadSeedConfig, type SeedConfig, startOfDay } from "./lib";

async function upsertVacationRequest(
  teacher: TeacherEntity,
  requestedByUserId: string,
  startAt: Date,
  endAt: Date,
  tz: TimezoneEntity | undefined,
  status: VacationRequestStatus,
  adminUserId: string | undefined,
  now: Date
) {
  const [existing] = await db
    .select()
    .from(teacherVacationRequests)
    .where(eq(teacherVacationRequests.teacherId, teacher.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(teacherVacationRequests)
    .values({
      teacherId: teacher.id,
      requestedByUserId,
      startAt,
      endAt,
      timezone: teacher.timezone,
      timezoneId: tz?.id ?? null,
      reason: "Seed vacation request",
      status,
      processedAt: status !== VacationRequestStatus.PENDING ? now : null,
      processedByUserId: status !== VacationRequestStatus.PENDING ? (adminUserId ?? null) : null,
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
  usersList: UserEntity[],
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
    const tz = timezones.find(t => t.ianaId === teacher.timezone) ?? timezones[0];

    const inserted = await upsertVacationRequest(
      teacher,
      requestedByUserId,
      startAt,
      endAt,
      tz,
      spec.status,
      adminUser?.id,
      now
    );
    results.push(inserted);
  }

  logger.info(`Teacher vacation requests seeded (${results.length} rows).`);
  return results;
}
