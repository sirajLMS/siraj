import { db } from "@/backend/db/drizzleDb";
import { complaints } from "@/backend/db/schema/communications";
import {
  buildComplaintBody,
  loadSeedConfig,
  pickComplaintCategory,
  pickComplaintStatus,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import type { ParentEntity, StudentEntity, UserSelectType } from "@/backend/types";

export async function seedOrGet(
  parentsList: ParentEntity[],
  studentsList: StudentEntity[],
  usersList: UserSelectType[],
  config?: SeedConfig
) {
  logger.info("Seeding complaints...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !parentsList?.length) {
    return [];
  }

  const count = seedConfig.profile === "standard" ? 8 : 2;
  const results = [];

  for (let i = 0; i < count; i++) {
    const parent = parentsList[i % parentsList.length];
    const parentUser = usersList.find(u => u.id === parent.userId);
    const student = studentsList.find(s => s.parentId === parent.id);

    const [inserted] = await db
      .insert(complaints)
      .values({
        parentId: parent.id,
        studentId: student?.id ?? null,
        category: pickComplaintCategory(i),
        submitterEmail: parentUser?.email ?? `parent-${i}@seed.siraj.local`,
        body: buildComplaintBody(seedConfig, i),
        status: pickComplaintStatus(i),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (shouldSeedExtendedFiles(seedConfig) && i % 2 === 0) {
      try {
        await seedEntityFile({
          assetRelativePath: "documents/sample-attachment.pdf",
          bucketPath: `public/complaints/seed_${inserted.id}.pdf`,
          referenceTable: "complaints",
          referenceId: inserted.id,
          usageType: "attachment",
          ensureParentDirs: ["public/complaints"],
        });
      } catch (error) {
        logger.error(`Failed to seed complaint file for ${inserted.id}:`, error);
      }
    }

    results.push(inserted);
  }

  logger.info(`Complaints seeded (${results.length} rows).`);
  return results;
}
