import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { PaymentLedgerEntry } from "@/backend/services/payments-ledger/payments-ledger.service";

// ---------------------------------------------------------------------------
// Object types — single canonical, includes `id` (Apollo cache normalization).
// ---------------------------------------------------------------------------

export const PaymentLedgerEntryRef = gqlSchemaBuilder.objectRef<PaymentLedgerEntry>("PaymentLedgerEntry");

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
