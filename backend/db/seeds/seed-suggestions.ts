import { db } from "@/backend/db/drizzleDb";
import { suggestions } from "@/backend/db/schema/communications";
import logger from "@/backend/lib/logger";
import type { ParentEntity, UserEntity } from "@/backend/types";
import { SuggestionStatus } from "@/shared/lib/enum";
import { buildSuggestionBody, loadSeedConfig, pickSuggestionStatus, type SeedConfig } from "./lib";

export async function seedOrGet(parentsList: ParentEntity[], usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding suggestions...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !parentsList?.length) {
    return [];
  }

  const adminUser = usersList.find(u => u.email === "admin@siraj.local");
  const count = seedConfig.profile === "standard" ? 10 : 2;
  const results = [];

  for (let i = 0; i < count; i++) {
    const parent = parentsList[i % parentsList.length];
    const parentUser = usersList.find(u => u.id === parent.userId);
    const status = pickSuggestionStatus(i);

    const [inserted] = await db
      .insert(suggestions)
      .values({
        parentId: parent.id,
        submitterName: parentUser?.name ?? `Parent ${i + 1}`,
        body: buildSuggestionBody(seedConfig, i),
        status,
        adminResponse: status === SuggestionStatus.REVIEWED ? "Thank you for your feedback." : null,
        reviewedByUserId: status === SuggestionStatus.REVIEWED ? adminUser?.id : null,
        reviewedAt: status === SuggestionStatus.REVIEWED ? now : null,
        createdAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Suggestions seeded (${results.length} rows).`);
  return results;
}
