import { db } from "@/backend/db/drizzleDb";
import { supportedPaymentLinks } from "@/backend/db/schema";
import { PAYMENT_LINK_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";

export async function seedOrGet() {
  logger.info("Seeding supported payment links...");
  const now = new Date();
  const results = [];

  for (const spec of PAYMENT_LINK_CATALOG_SEEDS) {
    const [row] = await db
      .insert(supportedPaymentLinks)
      .values({
        slug: spec.slug,
        name: spec.name,
        description: spec.description,
        instructions: spec.instructions,
        urlAllowlist: spec.urlAllowlist,
        urlExample: spec.urlExample,
        supportedDirections: spec.supportedDirections,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: supportedPaymentLinks.slug,
        set: {
          name: spec.name,
          description: spec.description,
          instructions: spec.instructions,
          urlAllowlist: spec.urlAllowlist,
          urlExample: spec.urlExample,
          supportedDirections: spec.supportedDirections,
          isActive: true,
          updatedAt: now,
        },
      })
      .returning();

    results.push(row);
  }

  logger.info(`Supported payment links seeded (${results.length} rows).`);
  return results;
}
