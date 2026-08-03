import { orchestrateSeedMany, type SeedConfig } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { GroupClassService } from "@/backend/services/group-class/group-class.service";
import type { GroupClassEnrollmentSelectType, StudentSelectType } from "@/backend/types";

type GroupClassEntity = { id: string; classInstanceId: string };

type EnrollmentSpec = {
  groupClassId: string;
  studentId: string;
  studentIdNumber: string;
  attendanceStatus: string;
};

function parseEnrollmentKey(key: string): { groupClassId: string; studentId: string } {
  const [groupClassId, studentId] = key.split(":");
  return { groupClassId, studentId };
}

export async function seedOrGet(
  groupClassesList: GroupClassEntity[],
  studentsList: StudentSelectType[],
  _config?: SeedConfig
) {
  logger.info("Seeding system group class enrollments...");
  if (!groupClassesList?.length) {
    logger.info("No group classes available to link enrollments. Skipping.");
    return [];
  }
  if (!studentsList?.length) {
    logger.info("No students available for group class enrollments. Skipping.");
    return [];
  }

  const specs: EnrollmentSpec[] = [];
  for (const groupClass of groupClassesList) {
    for (const student of studentsList.slice(0, 3)) {
      specs.push({
        groupClassId: groupClass.id,
        studentId: student.id,
        studentIdNumber: `STU-${student.id.slice(0, 6)}`,
        attendanceStatus: "pending",
      });
    }
  }

  const results = await orchestrateSeedMany<EnrollmentSpec, GroupClassEnrollmentSelectType, string>({
    specs,
    toKey: spec => `${spec.groupClassId}:${spec.studentId}`,
    findExisting: async keys => GroupClassService.findEnrollmentsByKeys(keys.map(parseEnrollmentKey)),
    createMany: async toCreate => GroupClassService.createManyEnrollments(toCreate),
    refetchOnRace: async keys => GroupClassService.findEnrollmentsByKeys(keys.map(parseEnrollmentKey)),
  });

  logger.info(`System group class enrollments seeded (${results.length} rows).`);
  return results;
}
