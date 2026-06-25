import { db } from "@/backend/db/drizzleDb";
import { studentProgress } from "@/backend/db/schema/students";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity } from "@/backend/types";
import { ClassOutcome } from "@/shared/lib/enum";
import { getFakerForIndex, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(classInstancesList: ClassInstanceEntity[], config?: SeedConfig) {
  logger.info("Seeding student progress...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !classInstancesList?.length) {
    return [];
  }

  const takenInstances = classInstancesList.filter(ci => ci.outcome === ClassOutcome.TAKEN);
  const sampleRate = seedConfig.profile === "standard" ? 10 : 50;
  const results = [];

  for (let i = 0; i < takenInstances.length; i++) {
    if (i % sampleRate !== 0) continue;

    const instance = takenInstances[i];
    const faker = getFakerForIndex(seedConfig.fakerSeed, instance.id.length);

    const [inserted] = await db
      .insert(studentProgress)
      .values({
        studentId: instance.studentId,
        classInstanceId: instance.id,
        teacherId: instance.teacherId,
        topicsCovered: faker.lorem.sentence(),
        homeworkAssigned: faker.lorem.sentence(),
        notes: faker.lorem.paragraph(),
        parentVisible: true,
        createdAt: instance.actualEndAt ?? instance.scheduledEndAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [studentProgress.studentId, studentProgress.classInstanceId],
        set: { updatedAt: now },
      })
      .returning();

    results.push(inserted);
  }

  logger.info(`Student progress seeded (${results.length} rows).`);
  return results;
}
