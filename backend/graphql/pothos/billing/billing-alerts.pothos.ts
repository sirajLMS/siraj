import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { UnpaidInvoiceSummaryItem, UnpaidInvoicesSummaryResult } from "@/backend/types/billing/billing.types";

const UnpaidInvoiceItemRef = gqlSchemaBuilder.objectRef<UnpaidInvoiceSummaryItem>("UnpaidInvoiceItem");

export const UnpaidInvoiceItemPothosObject = UnpaidInvoiceItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    userName: t.exposeString("userName"),
    userEmail: t.exposeString("userEmail"),
    totalUnpaidAmount: t.exposeString("totalUnpaidAmount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    overdueCount: t.exposeInt("overdueCount"),
    oldestDueDate: t.exposeString("oldestDueDate"),
  }),
});

const UnpaidInvoicesSummaryRef = gqlSchemaBuilder.objectRef<UnpaidInvoicesSummaryResult>("UnpaidInvoicesSummary");

export const UnpaidInvoicesSummaryPothosObject = UnpaidInvoicesSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalOverdueInvoices: t.exposeInt("totalOverdueInvoices"),
    totalOverdueAmount: t.exposeString("totalOverdueAmount"),
    items: t.expose("items", { type: [UnpaidInvoiceItemPothosObject] }),
  }),
});
