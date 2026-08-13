import { CLASS_CATEGORY_SEEDS, orchestrateSeedMany } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ClassCatalogService } from "@/backend/services";

export async function seedOrGet() {
  logger.info("Seeding class categories...");

  const results = await orchestrateSeedMany({
    specs: [...CLASS_CATEGORY_SEEDS],
    toKey: spec => spec.slug,
    findExisting: async slugs => {
      const rows = await ClassCatalogService.findCategoriesBySlugs(slugs);
      return new Map(rows.map(row => [row.slug, row] as const));
    },
    createMany: toCreate =>
      ClassCatalogService.upsertManyCategories(
        toCreate.map(spec => ({
          slug: spec.slug,
          name: spec.name,
          description: spec.description,
          sortOrder: spec.sortOrder,
          isActive: true,
        }))
      ),
    refetchOnRace: async slugs => {
      const rows = await ClassCatalogService.findCategoriesBySlugs(slugs);
      return new Map(rows.map(row => [row.slug, row] as const));
    },
  });

  logger.info(`Class categories seeded (${results.length} rows).`);
  return results;
}
