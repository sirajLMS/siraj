import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type UnpaidInvoiceItemDefinition = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalUnpaidAmount: string;
  currency: string;
  overdueCount: number;
  oldestDueDate: string;
};

const UnpaidInvoiceItemRef = gqlSchemaBuilder.objectRef<UnpaidInvoiceItemDefinition>("UnpaidInvoiceItem");

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

export type UnpaidInvoicesSummaryDefinition = {
  id: string;
  totalOverdueInvoices: number;
  totalOverdueAmount: string;
  items: UnpaidInvoiceItemDefinition[];
};

const UnpaidInvoicesSummaryRef = gqlSchemaBuilder.objectRef<UnpaidInvoicesSummaryDefinition>("UnpaidInvoicesSummary");

export const UnpaidInvoicesSummaryPothosObject = UnpaidInvoicesSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalOverdueInvoices: t.exposeInt("totalOverdueInvoices"),
    totalOverdueAmount: t.exposeString("totalOverdueAmount"),
    items: t.expose("items", { type: [UnpaidInvoiceItemPothosObject] }),
  }),
});
