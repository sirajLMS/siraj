import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { leaveRequests } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity, TeacherEntity, UserEntity } from "@/backend/types";
import { ClassOutcome, LeaveRequesterType, LeaveRequestStatus } from "@/shared/lib/enum";
import { getFakerForIndex, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(
  classInstancesList: ClassInstanceEntity[],
  teachersList: TeacherEntity[],
  usersList: UserEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding leave requests...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !classInstancesList?.length) {
    return [];
  }

  const leaveInstances = classInstancesList.filter(ci => ci.outcome === ClassOutcome.LEAVE);
  const teacherUserMap = new Map(teachersList.map(t => [t.id, t.userId]));
  const adminUser = usersList.find(u => u.email === "admin@siraj.local");
  const results = [];
  const maxLeaves = seedConfig.profile === "standard" ? leaveInstances.length : Math.min(2, leaveInstances.length);

  for (let i = 0; i < maxLeaves; i++) {
    const instance = leaveInstances[i];
    const actorUserId = teacherUserMap.get(instance.teacherId) ?? adminUser?.id;
    if (!actorUserId) continue;

    const [existing] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.classInstanceId, instance.id))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const faker = getFakerForIndex(seedConfig.fakerSeed, instance.id.length);
    const [inserted] = await db
      .insert(leaveRequests)
      .values({
        classInstanceId: instance.id,
        requestedByUserId: actorUserId,
        requesterType: LeaveRequesterType.TEACHER,
        reason: faker.lorem.sentence(),
        status: LeaveRequestStatus.APPROVED,
        createdAt: instance.scheduledStartAt,
        processedAt: instance.scheduledEndAt,
        processedByUserId: adminUser?.id ?? null,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Leave requests seeded (${results.length} rows).`);
  return results;
}
