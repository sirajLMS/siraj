import { db } from "@/backend/db/drizzleDb";
import { meetingProviders } from "@/backend/db/schema";
import { MEETING_PROVIDER_CATALOG_SEEDS } from "@/backend/db/seeds/lib/meeting-provider-factory";
import logger from "@/backend/lib/logger";

export async function seedOrGet() {
  logger.info("Seeding meeting providers...");
  const now = new Date();
  const results = [];

  for (const spec of MEETING_PROVIDER_CATALOG_SEEDS) {
    const [row] = await db
      .insert(meetingProviders)
      .values({
        slug: spec.slug,
        name: spec.name,
        description: spec.description,
        instructions: spec.instructions,
        urlAllowlist: spec.urlAllowlist,
        urlExample: spec.urlExample,
        fieldSchema: spec.fieldSchema,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: meetingProviders.slug,
        set: {
          name: spec.name,
          description: spec.description,
          instructions: spec.instructions,
          urlAllowlist: spec.urlAllowlist,
          urlExample: spec.urlExample,
          fieldSchema: spec.fieldSchema,
          isActive: true,
          updatedAt: now,
        },
      })
      .returning();

    results.push(row);
  }

  logger.info(`Meeting providers seeded (${results.length} rows).`);
  return results;
}
