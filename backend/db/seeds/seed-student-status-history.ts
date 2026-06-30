import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { studentStatusHistory } from "@/backend/db/schema/students";
import logger from "@/backend/lib/logger";
import type { StudentEntity, UserEntity } from "@/backend/types";
import { findAdminUser, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(studentsList: StudentEntity[], usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding student status history...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !studentsList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const results = [];

  for (const student of studentsList) {
    const [existing] = await db
      .select()
      .from(studentStatusHistory)
      .where(eq(studentStatusHistory.studentId, student.id))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const [inserted] = await db
      .insert(studentStatusHistory)
      .values({
        studentId: student.id,
        oldStatus: null,
        newStatus: student.status,
        changedByUserId: adminUser?.id ?? null,
        createdAt: student.createdAt,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Student status history seeded (${results.length} rows).`);
  return results;
}
