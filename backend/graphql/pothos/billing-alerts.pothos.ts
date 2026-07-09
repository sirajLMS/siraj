import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { UnpaidInvoiceSummaryItem, UnpaidInvoicesSummaryResult } from "@/backend/types/billing.types";

const UnpaidInvoiceItemRef = gqlSchemaBuilder.objectRef<UnpaidInvoiceSummaryItem>("UnpaidInvoiceItem");

export const UnpaidInvoiceItemPothosObject = UnpaidInvoiceItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    userName: t.exposeString("userName"),
    userEmail: t.exposeString("userEmail"),
    totalUnpaidAmount: t.exposeString("totalUnpaidAmount"),
    currency: t.exposeString("currency"),
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
