import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherVacationRequests } from "@/backend/db/schema/teacher-availability";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, TimezoneEntity, UserEntity } from "@/backend/types";
import { VacationRequestStatus } from "@/shared/lib/enum";
import { addMonths, loadSeedConfig, startOfDay, type SeedConfig } from "./lib";

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

  const adminUser = usersList.find(u => u.email === "admin@siraj.local");
  const teacherUserMap = new Map(
    teachersList.map(t => [t.id, usersList.find(u => u.id === t.userId)?.id])
  );
  const results = [];
  const anchor = startOfDay(seedConfig.anchorDate);

  const specs = [
    {
      teacherIndex: 0,
      status: VacationRequestStatus.APPROVED as const,
      startOffsetMonths: 1,
      durationDays: 5,
    },
    {
      teacherIndex: Math.min(1, teachersList.length - 1),
      status: VacationRequestStatus.PENDING as const,
      startOffsetMonths: 2,
      durationDays: 3,
    },
  ];

  if (seedConfig.profile === "standard" && teachersList.length > 2) {
    specs.push({
      teacherIndex: 2,
      status: VacationRequestStatus.REJECTED,
      startOffsetMonths: -2,
      durationDays: 4,
    });
  }

  for (const spec of specs) {
    const teacher = teachersList[spec.teacherIndex];
    if (!teacher) continue;

    const requestedByUserId = teacherUserMap.get(teacher.id);
    if (!requestedByUserId) continue;

    const startAt = addMonths(anchor, spec.startOffsetMonths);
    const endAt = new Date(startAt);
    endAt.setDate(endAt.getDate() + spec.durationDays);
    const tz = timezones.find(t => t.ianaId === teacher.timezone) ?? timezones[0];

    const [existing] = await db
      .select()
      .from(teacherVacationRequests)
      .where(eq(teacherVacationRequests.teacherId, teacher.id))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
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
        status: spec.status,
        processedAt: spec.status !== VacationRequestStatus.PENDING ? now : null,
        processedByUserId: spec.status !== VacationRequestStatus.PENDING ? adminUser?.id : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Teacher vacation requests seeded (${results.length} rows).`);
  return results;
}
