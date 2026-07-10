import { findAdminUserOrFallback, loadSeedConfig, type SeedConfig, SITE_CONTENT_SPECS } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { StorageService } from "@/backend/services/storage/storage.service";
import type { UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding site content...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const editor = findAdminUserOrFallback(usersList);
  if (!editor) {
    logger.warn("No admin user found for site content seeding — skipping.");
    return [];
  }

  const inputs = SITE_CONTENT_SPECS.map(spec => ({
    slug: spec.slug,
    title: spec.title,
    body: `<p>Seed content for ${spec.title}</p>`,
    contentType: spec.contentType,
    isPublished: true,
    updatedByUserId: editor.id,
  }));

  const results = await StorageService.upsertManySiteContent(inputs);
  logger.info(`Site content seeded (${results.length} rows).`);
  return results;
}
