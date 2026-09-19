import {
  ALL_INVOICE_TYPES,
  buildInvoiceAmount,
  cycleAtIndex,
  DEFAULT_INVOICE_CURRENCY,
  iterateInvoiceMonths,
  loadSeedConfig,
  orchestrateSeedMany,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { BillingManagementService } from "@/backend/services";
import type { ManualInvoiceInsertType, ParentSelectType, StudentSelectType, UserSelectType } from "@/backend/types";

type InvoiceSeedSpec = ManualInvoiceInsertType & { readonly idempotencyKey: string };

function buildInvoiceSpecs(
  parentsList: ParentSelectType[],
  studentsList: StudentSelectType[],
  usersList: UserSelectType[],
  seedConfig: SeedConfig
): InvoiceSeedSpec[] {
  const adminUser = usersList.find(u => u.email === "academy@siraj.local");
  const months = [...iterateInvoiceMonths(seedConfig)];
  const parentsToSeed = seedConfig.profile === "standard" ? parentsList : parentsList.slice(0, 1);
  const specs: InvoiceSeedSpec[] = [];

  for (const [parentIndex, parent] of parentsToSeed.entries()) {
    const student = studentsList.find(s => s.parentId === parent.id) ?? studentsList[0];
    const invoiceType = cycleAtIndex(ALL_INVOICE_TYPES, parentIndex);
    const monthsToUse = seedConfig.profile === "standard" ? months : months.slice(0, 1);

    for (const monthSpec of monthsToUse) {
      const monthKey = `${monthSpec.year}-${String(monthSpec.month).padStart(2, "0")}`;
      const idempotencyKey = `seed_inv_${parent.id}_${monthKey}`;

      specs.push({
        parentId: parent.id,
        studentId: student?.id ?? null,
        issueDate: monthSpec.issueDate,
        dueDate: monthSpec.dueDate,
        paidDate: monthSpec.paidDate,
        amount: buildInvoiceAmount(seedConfig, parentIndex, monthKey),
        currency: DEFAULT_INVOICE_CURRENCY,
        status: monthSpec.status,
        invoiceType,
        createdByUserId: adminUser?.id ?? null,
        idempotencyKey,
      });
    }
  }

  return specs;
}

async function findInvoicesByKeys(keys: readonly string[]) {
  const rows = await BillingManagementService.findInvoicesByIdempotencyKeys(keys);
  return new Map(rows.map(row => [row.idempotencyKey, row] as const));
}

export async function seedOrGet(
  parentsList: ParentSelectType[],
  studentsList: StudentSelectType[],
  usersList: UserSelectType[],
  config?: SeedConfig
) {
  logger.info("Seeding invoices...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !parentsList?.length) {
    return [];
  }

  const specs = buildInvoiceSpecs(parentsList, studentsList, usersList, seedConfig);

  const results = await orchestrateSeedMany({
    specs,
    toKey: spec => spec.idempotencyKey,
    findExisting: findInvoicesByKeys,
    createMany: toCreate => BillingManagementService.createManyManualInvoices(toCreate),
    refetchOnRace: findInvoicesByKeys,
  });

  if (shouldSeedExtendedFiles(seedConfig)) {
    await results.reduce(async (prev, inserted) => {
      await prev;
      try {
        await seedEntityFile({
          assetRelativePath: "documents/sample-invoice.pdf",
          bucketPath: `invoices/${inserted.idempotencyKey}.pdf`,
          referenceTable: "invoices",
          referenceId: inserted.id,
          usageType: "invoice_pdf",
          ensureParentDirs: ["invoices"],
        });
      } catch (error) {
        logger.error(`Failed to seed invoice file for ${inserted.id}:`, error);
      }
    }, Promise.resolve());
  }

  logger.info(`Invoices seeded (${results.length} rows).`);
  return results;
}
