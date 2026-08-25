import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PaymentsLedgerService } from "@/backend/services";
import type { PaymentLedgerEntry } from "@/backend/services/payments-ledger/payments-ledger.service";

// ---------------------------------------------------------------------------
// Object types — single canonical, includes `id` (Apollo cache normalization).
// ---------------------------------------------------------------------------

const PaymentLedgerEntryRef = gqlSchemaBuilder.objectRef<PaymentLedgerEntry>("PaymentLedgerEntry");

export const PaymentLedgerEntryPothosObject = PaymentLedgerEntryRef.implement({
  description:
    "A single payment ledger entry for a parent/student, derived from payments + invoices + credit_transactions.",
  fields: t => ({
    id: t.exposeID("id"),
    studentId: t.exposeID("studentId", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    creditsPurchased: t.exposeInt("creditsPurchased"),
    amount: t.exposeString("amount"),
    currency: t.exposeString("currency"),
    packageName: t.exposeString("packageName", { nullable: true }),
    paymentGateway: t.exposeString("paymentGateway"),
    paymentDate: t.expose("paymentDate", { type: "DateTime" }),
  }),
});

// ---------------------------------------------------------------------------
// Query — myPaymentsLedger
// ---------------------------------------------------------------------------

gqlSchemaBuilder.queryField("myPaymentsLedger", t =>
  t.field({
    type: [PaymentLedgerEntryPothosObject],
    authScopes: { permission: AppPermission.PAYMENTS_LEDGER_VIEW },
    description: "Returns the authenticated user's payment ledger (parent sees all children; student sees own).",
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await PaymentsLedgerService.getMyPaymentsLedger(userId, ctx.locale);
      return result.entries;
    },
  })
);
