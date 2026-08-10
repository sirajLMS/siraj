import { orchestrateSeedMany, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { GroupClassService } from "@/backend/services/group-class/group-class.service";
import type { ClassInstanceSelectType, GroupClassSelectType } from "@/backend/types";

type GroupClassSpec = {
  classInstanceId: string;
  courseName: string;
  teacherName: string;
  classType: string;
  originalDate: Date | null;
  rescheduledDate: Date | null;
  timeSlot: string;
  status: string;
  auditRemark: string | null;
  auditLoggedAt: Date;
};

export async function seedOrGet(
  classInstancesList: ClassInstanceSelectType[],
  studentsList: { id: string }[],
  _config?: SeedConfig
) {
  logger.info("Seeding system group classes...");
  if (!classInstancesList?.length) {
    throw new Error("No class instances available to link to group classes.");
  }
  if (!studentsList?.length) {
    throw new Error("No students available for group class enrollments.");
  }

  const now = new Date();
  const specs: GroupClassSpec[] = classInstancesList.slice(0, 5).map(instance => ({
    classInstanceId: instance.id,
    courseName: `Course-${instance.id.slice(0, 8)}`,
    teacherName: "Seeded Teacher",
    classType: instance.classType,
    originalDate: instance.isRescheduled ? instance.scheduledStartAt : null,
    rescheduledDate: instance.isRescheduled ? now : null,
    timeSlot: `${instance.scheduledStartAt.toISOString().slice(11, 16)} - ${instance.scheduledEndAt.toISOString().slice(11, 16)}`,
    status: instance.executionState ?? "NOT_ACTIVATED",
    auditRemark: instance.isRescheduled ? "Class rescheduled by system" : null,
    auditLoggedAt: now,
  }));

  const results = await orchestrateSeedMany<GroupClassSpec, GroupClassSelectType, string>({
    specs,
    toKey: spec => spec.classInstanceId,
    findExisting: async keys => {
      const rows = await GroupClassService.listGroupClassesByClassInstanceIds(keys);
      return new Map(rows.map(row => [row.classInstanceId, row]));
    },
    createMany: async toCreate => GroupClassService.createManyGroupClasses(toCreate),
    refetchOnRace: async keys => {
      const rows = await GroupClassService.listGroupClassesByClassInstanceIds(keys);
      return new Map(rows.map(row => [row.classInstanceId, row]));
    },
  });

  logger.info(`System group classes seeded (${results.length} rows).`);
  return results;
}
