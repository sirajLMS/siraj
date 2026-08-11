import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DisplayAmountPothosObject,
  populateBillingFxDisplayCurrencyByUserId,
  resolveDisplayAmountFields,
  setBillingFxDisplayCurrencyForSubject,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  CurrencyCodePothosObject,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import type {
  AdminBillingSummaryResult,
  BillingCurrencyTotal,
  DisplayAmountReturnType,
  InvoiceHistoryPaginatedResult,
  InvoiceHistoryRow,
  NextUnpaidInvoiceSummary,
  ParentBillingSummaryResult,
  StudentCreditRow,
} from "@/backend/types";

function enrichCurrencyTotalsWithDisplay(
  totals: readonly BillingCurrencyTotal[],
  displayAmounts: Map<string, DisplayAmountReturnType | null>
): (BillingCurrencyTotal & { displayAmount: DisplayAmountReturnType | null })[] {
  return totals.map(t => ({
    ...t,
    displayAmount: displayAmounts.get(t.id) ?? null,
  }));
}

type BillingSummaryWithCurrencyTotals = {
  readonly id: string;
  readonly outstandingByCurrency: readonly BillingCurrencyTotal[];
  readonly [key: string]: unknown;
};

function extractCurrencyTotals(result: Record<string, unknown>, key: string): readonly BillingCurrencyTotal[] {
  const value = result[key];
  if (Array.isArray(value)) {
    return value as readonly BillingCurrencyTotal[];
  }
  return [];
}

async function enrichSummaryWithDisplayAmounts<T extends BillingSummaryWithCurrencyTotals>(
  result: T,
  ctx: import("@/backend/graphql/gqlContext").BaseContext,
  firstArrayKey: keyof T & string,
  secondArrayKey: keyof T & string
): Promise<T> {
  const firstArray = extractCurrencyTotals(result, firstArrayKey);
  const secondArray = extractCurrencyTotals(result, secondArrayKey);
  const allCurrencyTotals = [...firstArray, ...secondArray];

  const displayAmounts = await resolveDisplayAmountFields(
    allCurrencyTotals,
    ctx,
    "amount",
    "currency",
    "subjectUserId"
  );

  return {
    ...result,
    [firstArrayKey]: enrichCurrencyTotalsWithDisplay(firstArray, displayAmounts),
    [secondArrayKey]: enrichCurrencyTotalsWithDisplay(secondArray, displayAmounts),
  };
}

interface ParentScopedResolverArgs {
  parentId?: string | null;
  userId?: string | null;
}

async function prepareParentScopedResolver(
  ctx: import("@/backend/graphql/gqlContext").BaseContext,
  args: ParentScopedResolverArgs
) {
  const callerUserId = await requireAuth(ctx);
  await setBillingFxDisplayCurrencyForSubject(ctx, args.userId ?? null, callerUserId);
  return { callerUserId, tErrors: ctx.t().errorsTranslations };
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
    displayAmount: t.expose("displayAmount", {
      type: DisplayAmountPothosObject,
      nullable: true,
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
    displayAmount: t.expose("displayAmount", {
      type: DisplayAmountPothosObject,
      nullable: true,
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
      const { callerUserId, tErrors } = await prepareParentScopedResolver(ctx, args);
      const pagination = parsePaginationArgs(args.paginationArgs);

      const result = await BillingHistoryService.getParentInvoiceHistory(
        callerUserId,
        args.parentId ?? null,
        args.userId ?? null,
        tErrors,
        pagination,
        args.search ?? null
      );

      const displayAmounts = await resolveDisplayAmountFields(result.rows, ctx, "amount", "currency", "parentUserId");
      return {
        ...result,
        rows: result.rows.map(row => Object.assign(row, { displayAmount: displayAmounts.get(row.id) ?? null })),
      };
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
      const result = await BillingHistoryService.getAdminInvoices(userId, tErrors, pagination, args.search ?? null);
      await populateBillingFxDisplayCurrencyByUserId(
        ctx,
        result.rows.map(row => row.parentUserId)
      );

      const displayAmounts = await resolveDisplayAmountFields(result.rows, ctx, "amount", "currency", "parentUserId");
      return {
        ...result,
        rows: result.rows.map(row => Object.assign(row, { displayAmount: displayAmounts.get(row.id) ?? null })),
      };
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
      const result = await BillingHistoryService.getAdminBillingSummary(userId, tErrors);

      return enrichSummaryWithDisplayAmounts(result, ctx, "outstandingByCurrency", "mtdRevenueByCurrency");
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
      const { callerUserId, tErrors } = await prepareParentScopedResolver(ctx, args);

      const result = await BillingHistoryService.getParentBillingSummary(
        callerUserId,
        args.parentId ?? null,
        args.userId ?? null,
        tErrors
      );

      return enrichSummaryWithDisplayAmounts(result, ctx, "outstandingByCurrency", "paidThisTermByCurrency");
    },
  })
);
