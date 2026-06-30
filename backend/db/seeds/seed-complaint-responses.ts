import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaintResponses } from "@/backend/db/schema/communications";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { ComplaintStatus } from "@/shared/lib/enum";
import { findAdminUser, getFakerForIndex, loadSeedConfig, type SeedConfig } from "./lib";

type ComplaintRow = {
  id: string;
  status: string;
};

export async function seedOrGet(complaintsList: ComplaintRow[], usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding complaint responses...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !complaintsList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const results = [];

  for (let i = 0; i < complaintsList.length; i++) {
    const complaint = complaintsList[i];
    if (complaint.status !== ComplaintStatus.ANSWERED) continue;

    const [existing] = await db
      .select()
      .from(complaintResponses)
      .where(eq(complaintResponses.complaintId, complaint.id))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const faker = getFakerForIndex(seedConfig.fakerSeed, 12000 + i);
    const [inserted] = await db
      .insert(complaintResponses)
      .values({
        complaintId: complaint.id,
        responderUserId: adminUser?.id ?? null,
        body: faker.lorem.paragraph(),
        emailSent: true,
        createdAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Complaint responses seeded (${results.length} rows).`);
  return results;
}
