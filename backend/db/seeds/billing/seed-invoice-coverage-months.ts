import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import { logger } from "@/backend/lib/logger";
import { BillingManagementService } from "@/backend/services/billing/billing-management.service";
import type { InvoiceCoverageMonthInput, InvoiceSelectType } from "@/backend/types";

type CoverageSeedSpec = InvoiceCoverageMonthInput & { readonly key: string };

function coverageKey(input: Pick<InvoiceCoverageMonthInput, "invoiceId" | "year" | "month">): string {
  return `${input.invoiceId}:${input.year}:${input.month}`;
}

function buildCoverageSpecs(invoicesList: InvoiceSelectType[]): CoverageSeedSpec[] {
  const specs: CoverageSeedSpec[] = [];

  for (const invoice of invoicesList) {
    const match = /_(\d{4})-(\d{2})$/.exec(invoice.idempotencyKey);
    if (!match) continue;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const spec = { invoiceId: invoice.id, year, month };
    specs.push({ ...spec, key: coverageKey(spec) });
  }

  return specs;
}

async function findCoverageByKeys(keys: readonly string[]) {
  const invoiceIds = [...new Set(keys.map(key => key.split(":")[0]))];
  const rows = await BillingManagementService.findInvoiceCoverageMonthsByInvoiceIds(invoiceIds);
  return new Map(rows.map(row => [coverageKey(row), row] as const));
}

export async function seedOrGet(invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding invoice coverage months...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !invoicesList?.length) {
    return [];
  }

  const specs = buildCoverageSpecs(invoicesList);
  const results = await orchestrateSeedMany({
    specs,
    toKey: spec => spec.key,
    findExisting: findCoverageByKeys,
    createMany: toCreate =>
      BillingManagementService.createManyInvoiceCoverageMonths(
        toCreate.map(({ invoiceId, year, month }) => ({ invoiceId, year, month }))
      ),
    refetchOnRace: findCoverageByKeys,
  });

  logger.info(`Invoice coverage months seeded (${results.length} rows).`);
  return results;
}
