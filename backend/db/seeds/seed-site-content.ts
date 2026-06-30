import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { siteContent } from "@/backend/db/schema/site-content";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { findAdminUserOrFallback, loadSeedConfig, type SeedConfig, SITE_CONTENT_SPECS } from "./lib";

export async function seedOrGet(usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding site content...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const editor = findAdminUserOrFallback(usersList);
  const results = [];

  for (const spec of SITE_CONTENT_SPECS) {
    const [existing] = await db.select().from(siteContent).where(eq(siteContent.slug, spec.slug)).limit(1);

    if (existing) {
      const [updated] = await db
        .update(siteContent)
        .set({
          title: spec.title,
          body: `<p>Seed content for ${spec.title}</p>`,
          contentType: spec.contentType,
          isPublished: true,
          updatedByUserId: editor.id,
          updatedAt: now,
        })
        .where(eq(siteContent.id, existing.id))
        .returning();
      results.push(updated);
      continue;
    }

    const [inserted] = await db
      .insert(siteContent)
      .values({
        slug: spec.slug,
        title: spec.title,
        body: `<p>Seed content for ${spec.title}</p>`,
        contentType: spec.contentType,
        isPublished: true,
        updatedByUserId: editor.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Site content seeded (${results.length} rows).`);
  return results;
}
