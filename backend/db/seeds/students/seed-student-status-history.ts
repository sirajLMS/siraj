import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { StudentStatus } from "@/backend/enum";
import { parseStudentStatus } from "@/backend/lib/enum";
import logger from "@/backend/lib/logger";
import { StudentBootstrapService } from "@/backend/services/student/student-bootstrap.service";
import type { StudentEntity, UserSelectType } from "@/backend/types";

export async function seedOrGet(studentsList: StudentEntity[], usersList: UserSelectType[], config?: SeedConfig) {
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

  const results = await StudentBootstrapService.createManyInitialStatusHistory(inputs);
  logger.info(`Student status history seeded (${results.length} rows).`);
  return results;
}
