import { db } from "@/backend/db/drizzleDb";
import { payments } from "@/backend/db/schema/billing/billing";
import { DEFAULT_INVOICE_CURRENCY, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { InvoiceStatus } from "@/backend/enum";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import logger from "@/backend/lib/logger";
import type { InvoiceSelectType } from "@/backend/types";
import type { PaymentMethodTransactionSnapshot } from "@/backend/types/billing/payment-method.types";

function buildPaymentSnapshot(
  index: number,
  snapshottedAt: string
): {
  paymentMethodType: PaymentMethodType;
  paymentMethodSnapshot: PaymentMethodTransactionSnapshot;
} {
  if (index % 2 === 0) {
    return {
      paymentMethodType: PaymentMethodType.CASH,
      paymentMethodSnapshot: {
        userPaymentMethodId: null,
        type: PaymentMethodType.CASH,
        direction: PaymentDirection.PAYIN,
        label: null,
        details: { note: "Cash payment at office" },
        catalog: null,
        snapshottedAt,
      },
    };
  }

  return {
    paymentMethodType: PaymentMethodType.ONLINE_ACCOUNT,
    paymentMethodSnapshot: {
      userPaymentMethodId: null,
      type: PaymentMethodType.ONLINE_ACCOUNT,
      direction: PaymentDirection.PAYIN,
      label: "PayPal",
      details: {
        onlineAccountId: "seed-online-account",
        identifier: "parent@example.com",
      },
      catalog: null,
      snapshottedAt,
    },
  };
}

export async function seedOrGet(invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding payments...");
  const now = new Date();
  const snapshottedAt = now.toISOString();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !invoicesList?.length) {
    return [];
  }

  const results = [];
  const paidInvoices = invoicesList.filter(inv => inv.status === InvoiceStatus.PAID);

  for (const [index, invoice] of paidInvoices.entries()) {
    const idempotencyKey = `seed_pay_${invoice.id}`;
    const { paymentMethodType, paymentMethodSnapshot } = buildPaymentSnapshot(index, snapshottedAt);

    const [inserted] = await db
      .insert(payments)
      .values({
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency ?? DEFAULT_INVOICE_CURRENCY,
        paymentDate: invoice.paidDate ? new Date(`${invoice.paidDate}T12:00:00.000Z`) : now,
        userPaymentMethodId: null,
        paymentMethodType,
        paymentMethodSnapshot,
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
