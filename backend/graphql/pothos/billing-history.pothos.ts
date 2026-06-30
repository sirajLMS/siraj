import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import type {
  AdminBillingSummaryResult,
  InvoiceHistoryRow,
  ParentBillingSummaryResult,
  StudentCreditRow,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { InvoiceStatusPothosObject, InvoiceTypePothosObject, StudentStatusPothosObject } from "./enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "./pagination.objects";

const ParentInvoiceRowRef = gqlSchemaBuilder.objectRef<InvoiceHistoryRow>("ParentInvoiceRow");

export const ParentInvoiceRowPothosObject = ParentInvoiceRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    issueDate: t.exposeString("issueDate"),
    dueDate: t.exposeString("dueDate"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.exposeString("currency"),
    status: t.expose("status", { type: InvoiceStatusPothosObject }),
    invoiceType: t.expose("invoiceType", { type: InvoiceTypePothosObject }),
    studentId: t.exposeString("studentId", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
  }),
});

type InvoiceHistoryResultType = {
  id: string;
  rows: InvoiceHistoryRow[];
  totalCount: number;
  pageInfo: import("@/backend/types").PageInfo | null;
};

const ParentInvoiceHistoryResultRef =
  gqlSchemaBuilder.objectRef<InvoiceHistoryResultType>("ParentInvoiceHistoryResult");

export const ParentInvoiceHistoryResultPothosObject = ParentInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const AdminInvoiceHistoryResultRef = gqlSchemaBuilder.objectRef<InvoiceHistoryResultType>("AdminInvoiceHistoryResult");

export const AdminInvoiceHistoryResultPothosObject = AdminInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const AdminBillingSummaryRef = gqlSchemaBuilder.objectRef<AdminBillingSummaryResult>("AdminBillingSummary");

export const AdminBillingSummaryPothosObject = AdminBillingSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalOutstanding: t.exposeString("totalOutstanding"),
    pendingCount: t.exposeInt("pendingCount"),
    mtdRevenue: t.exposeString("mtdRevenue"),
    negativeBalanceCount: t.exposeInt("negativeBalanceCount"),
  }),
});

const StudentCreditRowRef = gqlSchemaBuilder.objectRef<StudentCreditRow>("StudentCreditRow");

export const StudentCreditRowPothosObject = StudentCreditRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    parentEmail: t.exposeString("parentEmail"),
    planType: t.expose("planType", { type: InvoiceTypePothosObject }),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    status: t.expose("status", { type: StudentStatusPothosObject }),
  }),
});

const ParentBillingSummaryRef = gqlSchemaBuilder.objectRef<ParentBillingSummaryResult>("ParentBillingSummary");

export const ParentBillingSummaryPothosObject = ParentBillingSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    outstandingBalance: t.exposeString("outstandingBalance"),
    paidThisTerm: t.exposeString("paidThisTerm"),
    nextDueDate: t.exposeString("nextDueDate", { nullable: true }),
    activeStudents: t.exposeInt("activeStudents"),
  }),
});

export const BillingMonthInputRef = gqlSchemaBuilder.inputRef<{ year: number; month: number }>("BillingMonthInput");

BillingMonthInputRef.implement({
  fields: t => ({
    year: t.int({ required: true }),
    month: t.int({ required: true }),
  }),
});

gqlSchemaBuilder.queryField("parentInvoiceHistory", t =>
  t.field({
    type: ParentInvoiceHistoryResultPothosObject,
    args: {
      parentId: t.arg.string({ required: false }),
      userId: t.arg.string({ required: false }),
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

      return BillingHistoryService.getParentInvoiceHistory(
        ctx.user?.id || "",
        args.parentId ?? null,
        args.userId ?? null,
        pagination,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("adminInvoices", t =>
  t.field({
    type: AdminInvoiceHistoryResultPothosObject,
    args: {
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

      return BillingHistoryService.getAdminInvoices(ctx.user?.id || "", pagination, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("adminBillingSummary", t =>
  t.field({
    type: AdminBillingSummaryPothosObject,
    resolve: async (_root, _args, ctx) => {
      return BillingHistoryService.getAdminBillingSummary(ctx.user?.id || "", ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentCreditStatus", t =>
  t.field({
    type: [StudentCreditRowPothosObject],
    resolve: async (_root, _args, ctx) => {
      return BillingHistoryService.getStudentCreditStatus(ctx.user?.id || "", ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentBillingSummary", t =>
  t.field({
    type: ParentBillingSummaryPothosObject,
    args: {
      parentId: t.arg.string({ required: false }),
      userId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      return BillingHistoryService.getParentBillingSummary(
        ctx.user?.id || "",
        args.parentId ?? null,
        args.userId ?? null,
        ctx.locale
      );
    },
  })
);
