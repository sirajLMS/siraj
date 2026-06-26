import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import { PaginationArgs } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PageInfoObject, PaginationArgsObject } from "./pagination.objects";

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

export type ParentInvoiceHistoryResultDefinition = {
  id: string;
  rows: ParentInvoiceRowDefinition[];
  totalCount: number;
  pageInfo: import("@/backend/types").PageInfo | null;
};

const ParentInvoiceHistoryResultRef =
  gqlSchemaBuilder.objectRef<ParentInvoiceHistoryResultDefinition>("ParentInvoiceHistoryResult");

export const ParentInvoiceHistoryResultPothosObject = ParentInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

gqlSchemaBuilder.queryField("parentInvoiceHistory", t =>
  t.field({
    type: ParentInvoiceHistoryResultPothosObject,
    args: {
      parentId: t.arg.string({ required: true }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      let pagination: PaginationArgs | null = null;
      if (args.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.paginationArgs.first ?? null,
          skip: args.paginationArgs.skip ?? null,
          after: args.paginationArgs.after ?? null,
          before: args.paginationArgs.before ?? null,
          last: args.paginationArgs.last ?? null,
          page: args.paginationArgs.page ?? null,
          maxCount: args.paginationArgs.maxCount ?? null,
        });
      }

      return BillingHistoryService.getParentInvoiceHistory(ctx.user?.id || "", args.parentId, pagination, ctx.locale);
    },
  })
);
