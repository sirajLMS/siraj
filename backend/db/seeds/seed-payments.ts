import { db } from "@/backend/db/drizzleDb";
import { payments } from "@/backend/db/schema/billing";
import logger from "@/backend/lib/logger";
import type { InvoiceSelectType } from "@/backend/types";
import { InvoiceStatus } from "@/shared/lib/enum";
import { ALL_PAYMENT_METHODS, cycleAtIndex, DEFAULT_INVOICE_CURRENCY, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding payments...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !invoicesList?.length) {
    return [];
  }

  const results = [];
  const paidInvoices = invoicesList.filter(inv => inv.status === InvoiceStatus.PAID);

  for (const [index, invoice] of paidInvoices.entries()) {
    const idempotencyKey = `seed_pay_${invoice.id}`;

    const [inserted] = await db
      .insert(payments)
      .values({
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency ?? DEFAULT_INVOICE_CURRENCY,
        paymentDate: invoice.paidDate ? new Date(`${invoice.paidDate}T12:00:00.000Z`) : now,
        paymentMethod: cycleAtIndex(ALL_PAYMENT_METHODS, index),
        transactionId: `seed_txn_${invoice.id.slice(0, 8)}`,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: payments.idempotencyKey,
        set: { updatedAt: now },
      })
      .returning();

    results.push(inserted);
  }

  logger.info(`Payments seeded (${results.length} rows).`);
  return results;
}
