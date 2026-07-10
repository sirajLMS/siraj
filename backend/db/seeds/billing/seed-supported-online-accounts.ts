import { db } from "@/backend/db/drizzleDb";
import { supportedOnlineAccounts } from "@/backend/db/schema";
import { ONLINE_ACCOUNT_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";

export async function seedOrGet() {
  logger.info("Seeding supported online accounts...");
  const now = new Date();
  const results = [];

  for (const spec of ONLINE_ACCOUNT_CATALOG_SEEDS) {
    const [row] = await db
      .insert(supportedOnlineAccounts)
      .values({
        slug: spec.slug,
        name: spec.name,
        description: spec.description,
        instructions: spec.instructions,
        identifierKind: spec.identifierKind,
        identifierLabel: spec.identifierLabel,
        supportedDirections: spec.supportedDirections,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: supportedOnlineAccounts.slug,
        set: {
          name: spec.name,
          description: spec.description,
          instructions: spec.instructions,
          identifierKind: spec.identifierKind,
          identifierLabel: spec.identifierLabel,
          supportedDirections: spec.supportedDirections,
          isActive: true,
          updatedAt: now,
        },
      })
      .returning();

    results.push(row);
  }

  logger.info(`Supported online accounts seeded (${results.length} rows).`);
  return results;
}
