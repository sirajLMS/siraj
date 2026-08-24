import { loadSeedConfig, resolveAssetPath, type SeedConfig } from "@/backend/db/seeds/lib";
import { InvoiceStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { BillingManagementService, StorageService } from "@/backend/services";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import type { InvoiceSelectType, ParentSelectType, UserSelectType } from "@/backend/types";

const targetStatuses = new Set<string>([InvoiceStatus.UNPAID, InvoiceStatus.PAYMENT_PENDING]);

export async function seedOrGet(
  invoicesList: InvoiceSelectType[],
  parentsList: ParentSelectType[],
  usersList: UserSelectType[],
  config?: SeedConfig
) {
  logger.info("Seeding invoice payment submissions...");
  const seedConfig = config ?? loadSeedConfig();

  if (!invoicesList.length) {
    logger.warn("No invoices found — skipping invoice payment submissions.");
    return [];
  }

  const parentUsers = new Map(parentsList.map(parent => [parent.id, parent.userId]));
  const submitterByParent = new Map(
    parentsList.map(parent => [parent.id, usersList.find(user => user.id === parent.userId)?.id ?? parent.userId])
  );

  const candidates = invoicesList
    .filter(invoice => targetStatuses.has(invoice.status))
    .slice(0, seedConfig.profile === "standard" ? 3 : 1);

  if (candidates.length === 0) {
    logger.warn("No unpaid invoices found — skipping invoice payment submissions.");
    return [];
  }

  const existing = await BillingManagementService.findInvoicePaymentSubmissionsByInvoiceIds(
    candidates.map(invoice => invoice.id)
  );
  const existingInvoiceIds = new Set(existing.map(row => row.invoiceId));

  const fileSeeder = await createFileSeedingService();
  await fileSeeder.ensureDirectory("public/payment-proofs", true);

  const pending: Array<{ invoice: InvoiceSelectType; index: number; parentUserId: string }> = [];
  for (const [index, invoice] of candidates.entries()) {
    if (existingInvoiceIds.has(invoice.id)) continue;

    const parentUserId = submitterByParent.get(invoice.parentId) ?? parentUsers.get(invoice.parentId);
    if (!parentUserId) continue;

    pending.push({ invoice, index, parentUserId });
  }

  const toCreate = await pending.reduce<
    Promise<
      Array<{
        invoiceId: string;
        fileId: string;
        submittedByUserId: string;
        submittedAt: Date;
        status: "pending";
      }>
    >
  >(async (prev, { invoice, index, parentUserId }) => {
    const acc = await prev;
    const bucketPath = `public/payment-proofs/seed_submission_${invoice.id}.pdf`;
    const localFilePath = resolveAssetPath("documents/sample-invoice.pdf");

    await fileSeeder.seedFile({ bucketPath, localFilePath });
    const file = await StorageService.createFileAndGet(bucketPath);

    if (index === 0) {
      logger.info(`Prepared payment proof for invoice ${invoice.id}`);
    }

    acc.push({
      invoiceId: invoice.id,
      fileId: file.id,
      submittedByUserId: parentUserId,
      submittedAt: new Date(),
      status: "pending" as const,
    });
    return acc;
  }, Promise.resolve([]));

  const results = await BillingManagementService.createManyInvoicePaymentSubmissions(toCreate);
  logger.info(`Invoice payment submissions seeded (${results.length} rows).`);
  return results;
}
