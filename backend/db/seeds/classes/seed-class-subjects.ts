import { CLASS_SUBJECT_SEEDS } from "@/backend/db/seeds/lib/class-catalog-factory";
import { seedCatalogLogoUrl } from "@/backend/db/seeds/lib/logo-seed-helper";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import { logger } from "@/backend/lib/logger";
import { ClassCatalogService } from "@/backend/services/classes/class-catalog.service";

export async function seedOrGet() {
  logger.info("Seeding class subjects...");

  const categories = await ClassCatalogService.findCategoriesBySlugs(
    CLASS_SUBJECT_SEEDS.map(spec => spec.categorySlug)
  );
  const categoryBySlug = new Map(categories.map(category => [category.slug, category] as const));

  const specs = CLASS_SUBJECT_SEEDS.map(spec => {
    const category = categoryBySlug.get(spec.categorySlug);
    if (!category) {
      throw new Error(`Missing class category for subject seed: ${spec.categorySlug}`);
    }
    return Object.assign(spec, { categoryId: category.id });
  });

  const results = await orchestrateSeedMany({
    specs,
    toKey: spec => spec.slug,
    findExisting: async slugs => {
      const rows = await ClassCatalogService.findSubjectsBySlugs(slugs);
      return new Map(rows.map(row => [row.slug, row] as const));
    },
    createMany: async toCreate => {
      const inputs = [];
      for (const spec of toCreate) {
        const avatarUrl = await seedCatalogLogoUrl("subjects", spec.slug);
        inputs.push({
          slug: spec.slug,
          name: spec.name,
          categoryId: spec.categoryId,
          description: spec.description,
          sortOrder: spec.sortOrder,
          avatarUrl,
          isActive: true,
        });
      }
      return ClassCatalogService.upsertManySubjects(inputs);
    },
    refetchOnRace: async slugs => {
      const rows = await ClassCatalogService.findSubjectsBySlugs(slugs);
      return new Map(rows.map(row => [row.slug, row] as const));
    },
  });

  logger.info(`Class subjects seeded (${results.length} rows).`);
  return results;
}
