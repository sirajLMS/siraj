import { DEFAULT_INVOICE_CURRENCY, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { logger } from "@/backend/lib/logger";
import { PaymentMethodService } from "@/backend/services";
import type { InvoiceSelectType, PaymentMethodTransactionSnapshot, PaymentRecordInput } from "@/backend/types";

type PaymentSeedSpec = PaymentRecordInput & { readonly idempotencyKey: string };

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

function buildPaymentSpecs(invoicesList: InvoiceSelectType[], now: Date, snapshottedAt: string): PaymentSeedSpec[] {
  const paidInvoices = invoicesList.filter(inv => inv.status === "PAID");

  return paidInvoices.map((invoice, index) => {
    const { paymentMethodType, paymentMethodSnapshot } = buildPaymentSnapshot(index, snapshottedAt);
    const idempotencyKey = `seed_pay_${invoice.id}`;

    return {
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency ?? DEFAULT_INVOICE_CURRENCY,
      paymentDate: invoice.paidDate ? new Date(`${invoice.paidDate}T12:00:00.000Z`) : now,
      userPaymentMethodId: null,
      paymentMethodType,
      paymentMethodSnapshot,
      transactionId: `seed_txn_${invoice.id.slice(0, 8)}`,
      idempotencyKey,
    };
  });
}

async function findPaymentsByKeys(keys: readonly string[]) {
  const rows = await PaymentMethodService.findPaymentsByIdempotencyKeys(keys);
  return new Map(rows.map(row => [row.idempotencyKey, row] as const));
}

export async function seedOrGet(invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding payments...");
  const now = new Date();
  const snapshottedAt = now.toISOString();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !invoicesList?.length) {
    return [];
  }

  const specs = buildPaymentSpecs(invoicesList, now, snapshottedAt);
  const results = await orchestrateSeedMany({
    specs,
    toKey: spec => spec.idempotencyKey,
    findExisting: findPaymentsByKeys,
    createMany: toCreate => PaymentMethodService.createManyPayments(toCreate),
    refetchOnRace: findPaymentsByKeys,
  });

  logger.info(`Payments seeded (${results.length} rows).`);
  return results;
}
