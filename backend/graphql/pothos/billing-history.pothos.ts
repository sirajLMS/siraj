import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type ParentInvoiceRowDefinition = {
  id: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  amount: string;
  currency: string;
  status: string;
  invoiceType: string;
  studentId: string | null;
};

const ParentInvoiceRowRef = gqlSchemaBuilder.objectRef<ParentInvoiceRowDefinition>("ParentInvoiceRow");

export const ParentInvoiceRowPothosObject = ParentInvoiceRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    issueDate: t.exposeString("issueDate"),
    dueDate: t.exposeString("dueDate"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.exposeString("currency"),
    status: t.exposeString("status"),
    invoiceType: t.exposeString("invoiceType"),
    studentId: t.exposeString("studentId", { nullable: true }),
  }),
});

gqlSchemaBuilder.queryField("parentInvoiceHistory", t =>
  t.field({
    type: [ParentInvoiceRowRef],
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return BillingHistoryService.getParentInvoiceHistory(ctx.user?.id || "", args.parentId, ctx.locale);
    },
  })
);
