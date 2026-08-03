import { getFakerForIndex, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { ClassOutcome } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { StudentSeedService } from "@/backend/services/seed/student-seed.service";
import type { ClassInstanceSelectType } from "@/backend/types";

export async function seedOrGet(classInstancesList: ClassInstanceSelectType[], config?: SeedConfig) {
  logger.info("Seeding student progress...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !classInstancesList?.length) {
    return [];
  }

  const takenInstances = classInstancesList.filter(ci => ci.outcome === ClassOutcome.TAKEN);
  const sampleRate = seedConfig.profile === "standard" ? 10 : 50;
  const inputs = [];

  for (let i = 0; i < takenInstances.length; i++) {
    if (i % sampleRate !== 0) continue;

    const instance = takenInstances[i];
    const faker = getFakerForIndex(seedConfig.fakerSeed, instance.id.length);

    inputs.push({
      studentId: instance.studentId,
      classInstanceId: instance.id,
      teacherId: instance.teacherId,
      topicsCovered: faker.lorem.sentence(),
      homeworkAssigned: faker.lorem.sentence(),
      notes: faker.lorem.paragraph(),
      parentVisible: true,
      createdAt: instance.actualEndAt ?? instance.scheduledEndAt,
      updatedAt: now,
    });
  }

  const results = await StudentSeedService.seedManyStudentProgress(inputs);
  logger.info(`Student progress seeded (${results.length} rows).`);
  return results;
}
