import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { StudentStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { StudentSeedService } from "@/backend/services/seed/student-seed.service";
import type { StudentSelectType, UserSelectType } from "@/backend/types";
import { parseStudentStatus } from "@/shared/lib/enum";

export async function seedOrGet(studentsList: StudentSelectType[], usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding student status history...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !studentsList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const inputs = studentsList.map(student => ({
    studentId: student.id,
    newStatus: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
    changedByUserId: adminUser?.id ?? null,
    createdAt: student.createdAt,
  }));

  const results = await StudentSeedService.seedManyInitialStatusHistory(inputs);
  logger.info(`Student status history seeded (${results.length} rows).`);
  return results;
}
