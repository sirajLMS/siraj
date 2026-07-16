import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DisplayAmountPothosObject,
  populateBillingFxDisplayCurrencyByUserId,
  resolveDisplayAmountField,
  setBillingFxDisplayCurrencyForSubject,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  CurrencyCodePothosObject,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import type {
  AdminBillingSummaryResult,
  BillingCurrencyTotal,
  InvoiceHistoryPaginatedResult,
  InvoiceHistoryRow,
  NextUnpaidInvoiceSummary,
  PaginationInput,
  ParentBillingSummaryResult,
  StudentCreditRow,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types";

function parsePaginationArgs(input: PaginationInput | null | undefined): PaginationArgs | null {
  if (!input) {
    return null;
  }
  return new PaginationArgs({
    first: input.first ?? null,
    skip: input.skip ?? null,
    after: input.after ?? null,
    before: input.before ?? null,
    last: input.last ?? null,
    page: input.page ?? null,
    maxCount: input.maxCount ?? null,
  });
}

const ParentInvoiceRowRef = gqlSchemaBuilder.objectRef<InvoiceHistoryRow>("ParentInvoiceRow");

export const ParentInvoiceRowPothosObject = ParentInvoiceRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    issueDate: t.exposeString("issueDate"),
    dueDate: t.exposeString("dueDate"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    status: t.expose("status", { type: InvoiceStatusPothosObject }),
    invoiceType: t.expose("invoiceType", { type: InvoiceTypePothosObject }),
    studentId: t.exposeString("studentId", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    parentId: t.exposeString("parentId"),
    parentUserId: t.exposeString("parentUserId", { nullable: true }),
    hasPaymentProof: t.exposeBoolean("hasPaymentProof"),
    hasRejectedSubmission: t.exposeBoolean("hasRejectedSubmission"),
    displayAmount: t.field({
      type: DisplayAmountPothosObject,
      nullable: true,
      resolve: (parent, _args, ctx) =>
        resolveDisplayAmountField(parent, ctx, "amount", "currency", parent.parentUserId),
    }),
  }),
});

const ParentInvoiceHistoryResultRef =
  gqlSchemaBuilder.objectRef<InvoiceHistoryPaginatedResult>("ParentInvoiceHistoryResult");

export const ParentInvoiceHistoryResultPothosObject = ParentInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const AdminInvoiceHistoryResultRef =
  gqlSchemaBuilder.objectRef<InvoiceHistoryPaginatedResult>("AdminInvoiceHistoryResult");

export const AdminInvoiceHistoryResultPothosObject = AdminInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const BillingCurrencyTotalRef = gqlSchemaBuilder.objectRef<BillingCurrencyTotal>("BillingCurrencyTotal");

export const BillingCurrencyTotalPothosObject = BillingCurrencyTotalRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    amount: t.exposeString("amount"),
    displayAmount: t.field({
      type: DisplayAmountPothosObject,
      nullable: true,
      resolve: (parent, _args, ctx) =>
        resolveDisplayAmountField(parent, ctx, "amount", "currency", parent.subjectUserId),
    }),
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
    outstandingByCurrency: t.expose("outstandingByCurrency", { type: [BillingCurrencyTotalPothosObject] }),
    mtdRevenueByCurrency: t.expose("mtdRevenueByCurrency", { type: [BillingCurrencyTotalPothosObject] }),
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

const NextUnpaidInvoiceSummaryRef = gqlSchemaBuilder.objectRef<NextUnpaidInvoiceSummary>("NextUnpaidInvoiceSummary");

export const NextUnpaidInvoiceSummaryPothosObject = NextUnpaidInvoiceSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    dueDate: t.exposeString("dueDate"),
    studentName: t.exposeString("studentName", { nullable: true }),
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
    nextUnpaidInvoice: t.expose("nextUnpaidInvoice", {
      type: NextUnpaidInvoiceSummaryPothosObject,
      nullable: true,
    }),
    pendingPaymentCount: t.exposeInt("pendingPaymentCount"),
    outstandingByCurrency: t.expose("outstandingByCurrency", { type: [BillingCurrencyTotalPothosObject] }),
    paidThisTermByCurrency: t.expose("paidThisTermByCurrency", { type: [BillingCurrencyTotalPothosObject] }),
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
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: false }),
      userId: t.arg.string({ required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      search: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const callerUserId = await requireAuth(ctx);
      const pagination = parsePaginationArgs(args.paginationArgs);

      await setBillingFxDisplayCurrencyForSubject(ctx, args.userId ?? null, callerUserId);

      const tErrors = ctx.t().errorsTranslations;
      return BillingHistoryService.getParentInvoiceHistory(
        callerUserId,
        args.parentId ?? null,
        args.userId ?? null,
        pagination,
        args.search ?? null,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.queryField("adminInvoices", t =>
  t.field({
    type: AdminInvoiceHistoryResultPothosObject,
    authScopes: { permission: AppPermission.BILLING_VIEW_HISTORY },
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      search: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const pagination = parsePaginationArgs(args.paginationArgs);

      const tErrors = ctx.t().errorsTranslations;
      const result = await BillingHistoryService.getAdminInvoices(userId, pagination, args.search ?? null, tErrors);
      await populateBillingFxDisplayCurrencyByUserId(
        ctx,
        result.rows.map(row => row.parentUserId)
      );
      return result;
    },
  })
);

gqlSchemaBuilder.queryField("adminBillingSummary", t =>
  t.field({
    type: AdminBillingSummaryPothosObject,
    authScopes: { permission: AppPermission.BILLING_VIEW_HISTORY },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return BillingHistoryService.getAdminBillingSummary(userId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("studentCreditStatus", t =>
  t.field({
    type: [StudentCreditRowPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return BillingHistoryService.getStudentCreditStatus(userId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("parentBillingSummary", t =>
  t.field({
    type: ParentBillingSummaryPothosObject,
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: false }),
      userId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const callerUserId = await requireAuth(ctx);

      await setBillingFxDisplayCurrencyForSubject(ctx, args.userId ?? null, callerUserId);

      const tErrors = ctx.t().errorsTranslations;
      return BillingHistoryService.getParentBillingSummary(
        callerUserId,
        args.parentId ?? null,
        args.userId ?? null,
        tErrors
      );
    },
  })
);
