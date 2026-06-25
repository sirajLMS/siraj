import { db } from "@/backend/db/drizzleDb";
import { invoices } from "@/backend/db/schema/billing";
import logger from "@/backend/lib/logger";
import type { ParentEntity, StudentEntity, UserEntity } from "@/backend/types";
import {
  ALL_INVOICE_TYPES,
  buildInvoiceAmount,
  cycleAtIndex,
  DEFAULT_INVOICE_CURRENCY,
  iterateInvoiceMonths,
  loadSeedConfig,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "./lib";

export async function seedOrGet(
  parentsList: ParentEntity[],
  studentsList: StudentEntity[],
  usersList: UserEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding invoices...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !parentsList?.length) {
    return [];
  }

  const adminUser = usersList.find(u => u.email === "academy@siraj.local");
  const results = [];
  const months = [...iterateInvoiceMonths(seedConfig)];
  const parentsToSeed = seedConfig.profile === "standard" ? parentsList : parentsList.slice(0, 1);

  for (const [parentIndex, parent] of parentsToSeed.entries()) {
    const student = studentsList.find(s => s.parentId === parent.id) ?? studentsList[0];
    const invoiceType = cycleAtIndex(ALL_INVOICE_TYPES, parentIndex);
    const monthsToUse = seedConfig.profile === "standard" ? months : months.slice(0, 1);

    for (const monthSpec of monthsToUse) {
      const monthKey = `${monthSpec.year}-${String(monthSpec.month).padStart(2, "0")}`;
      const idempotencyKey = `seed_inv_${parent.id}_${monthKey}`;

      const [inserted] = await db
        .insert(invoices)
        .values({
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
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: invoices.idempotencyKey,
          set: {
            status: monthSpec.status,
            paidDate: monthSpec.paidDate,
            updatedAt: now,
          },
        })
        .returning();

      if (shouldSeedExtendedFiles(seedConfig)) {
        try {
          await seedEntityFile({
            assetRelativePath: "documents/sample-invoice.pdf",
            bucketPath: `public/invoices/${idempotencyKey}.pdf`,
            referenceTable: "invoices",
            referenceId: inserted.id,
            usageType: "invoice_pdf",
            ensureParentDirs: ["public/invoices"],
          });
        } catch (error) {
          logger.error(`Failed to seed invoice file for ${inserted.id}:`, error);
        }
      }

      results.push(inserted);
    }
  }

  logger.info(`Invoices seeded (${results.length} rows).`);
  return results;
}
