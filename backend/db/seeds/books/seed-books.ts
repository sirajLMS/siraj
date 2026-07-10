import { BOOK_CATALOG_SEEDS } from "@/backend/db/seeds/lib/class-catalog-factory";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import logger from "@/backend/lib/logger";
import { BookService } from "@/backend/services/resource/book.service";

export async function seedOrGet() {
  logger.info("Seeding books...");

  const specs = [...BOOK_CATALOG_SEEDS];
  const results = await orchestrateSeedMany({
    specs,
    toKey: spec => spec.name,
    findExisting: async names => {
      const rows = await BookService.findBooksByNames(names);
      return new Map(rows.map(row => [row.name, row] as const));
    },
    createMany: toCreate => BookService.upsertManyBooks(toCreate),
    refetchOnRace: async names => {
      const rows = await BookService.findBooksByNames(names);
      return new Map(rows.map(row => [row.name, row] as const));
    },
  });

  logger.info(`Books seeded (${results.length} rows).`);
  return results;
}
