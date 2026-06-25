import { db } from "@/backend/db/drizzleDb";
import { invoiceCoverageMonths } from "@/backend/db/schema/billing";
import logger from "@/backend/lib/logger";
import type { InvoiceSelectType } from "@/backend/types";
import { loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding invoice coverage months...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !invoicesList?.length) {
    return [];
  }

  const results = [];

  for (const invoice of invoicesList) {
    const match = invoice.idempotencyKey.match(/_(\d{4})-(\d{2})$/);
    if (!match) continue;

    const year = Number(match[1]);
    const month = Number(match[2]);

    const [inserted] = await db
      .insert(invoiceCoverageMonths)
      .values({
        invoiceId: invoice.id,
        year,
        month,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) results.push(inserted);
  }

  logger.info(`Invoice coverage months seeded (${results.length} rows).`);
  return results;
}
