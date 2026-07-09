import { db } from "@/backend/db/drizzleDb";
import { suggestions } from "@/backend/db/schema/communications";
import {
  buildSuggestionBody,
  findAdminUser,
  loadSeedConfig,
  pickSuggestionStatus,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { SuggestionStatus } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import type { ParentEntity, UserSelectType } from "@/backend/types";

function resolveAdminResponse(status: SuggestionStatus): string | null {
  if (status === SuggestionStatus.REVIEWED) {
    return "Thank you for your feedback.";
  }
  if (status === SuggestionStatus.DUPLICATE) {
    return "Marked as duplicate of an existing suggestion.";
  }
  return null;
}

export async function seedOrGet(parentsList: ParentEntity[], usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding suggestions...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !parentsList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
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
        adminResponse: resolveAdminResponse(status),
        reviewedByUserId:
          status === SuggestionStatus.REVIEWED || status === SuggestionStatus.DUPLICATE ? adminUser?.id : null,
        reviewedAt: status === SuggestionStatus.REVIEWED || status === SuggestionStatus.DUPLICATE ? now : null,
        createdAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Suggestions seeded (${results.length} rows).`);
  return results;
}
