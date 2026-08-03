import { addMonths, findAdminUser, loadSeedConfig, type SeedConfig, startOfDay } from "@/backend/db/seeds/lib";
import { VacationRequestStatus } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import logger from "@/backend/lib/logger";
import { TeacherAvailabilitySeedService } from "@/backend/services/seed/teacher-availability-seed.service";
import type { TeacherSelectType, TimezoneSelectType, UserSelectType } from "@/backend/types";

function buildVacationSpecs(teachersList: TeacherSelectType[], profile: string) {
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
  teachersList: TeacherSelectType[],
  usersList: UserSelectType[],
  timezones: TimezoneSelectType[],
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
    const isPending = spec.status === VacationRequestStatus.PENDING;

    const inserted = await TeacherAvailabilitySeedService.seedVacationRequestIfMissing({
      teacherId: teacher.id,
      requestedByUserId,
      startAt,
      endAt,
      timezone: teacherTimezone,
      timezoneId: tz?.id ?? null,
      reason: "Seed vacation request",
      status: spec.status,
      processedAt: isPending ? null : now,
      processedByUserId: isPending ? null : (adminUser?.id ?? null),
    });
    results.push(inserted);
  }

  logger.info(`Teacher vacation requests seeded (${results.length} rows).`);
  return results;
}
