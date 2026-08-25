import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DisplayAmountPothosObject,
  resolveDisplayAmountFields,
  setBillingFxDisplayCurrencyForSubject,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  CurrencyCodePothosObject,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type {
  AdminBillingSummaryResult,
  BillingCurrencyTotal,
  BillingMonthInput,
  BillingSummaryWithCurrencyTotals,
  DisplayAmountReturnType,
  InvoiceHistoryPaginatedResult,
  InvoiceHistoryRow,
  NextUnpaidInvoiceSummary,
  ParentBillingSummaryResult,
  ParentScopedResolverArgs,
  StudentCreditRow,
} from "@/backend/types";

export function enrichCurrencyTotalsWithDisplay(
  totals: readonly BillingCurrencyTotal[],
  displayAmounts: Map<string, DisplayAmountReturnType | null>
): (BillingCurrencyTotal & { displayAmount: DisplayAmountReturnType | null })[] {
  return totals.map(t => ({
    ...t,
    displayAmount: displayAmounts.get(t.id) ?? null,
  }));
}

export function extractCurrencyTotals(result: Record<string, unknown>, key: string): readonly BillingCurrencyTotal[] {
  const value = result[key];
  if (Array.isArray(value)) {
    return value as readonly BillingCurrencyTotal[];
  }
  return [];
}

export async function enrichSummaryWithDisplayAmounts<T extends BillingSummaryWithCurrencyTotals>(
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

export async function prepareParentScopedResolver(
  ctx: import("@/backend/graphql/gqlContext").BaseContext,
  args: ParentScopedResolverArgs
) {
  const callerUserId = await requireAuth(ctx);
  await setBillingFxDisplayCurrencyForSubject(ctx, args.userId ?? null, callerUserId);
  return { callerUserId, tErrors: ctx.t().errorsTranslations };
}

export const ParentInvoiceRowRef = gqlSchemaBuilder.objectRef<InvoiceHistoryRow>("ParentInvoiceRow");

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

export const ParentInvoiceHistoryResultRef =
  gqlSchemaBuilder.objectRef<InvoiceHistoryPaginatedResult>("ParentInvoiceHistoryResult");

export const ParentInvoiceHistoryResultPothosObject = ParentInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const AdminInvoiceHistoryResultRef =
  gqlSchemaBuilder.objectRef<InvoiceHistoryPaginatedResult>("AdminInvoiceHistoryResult");

export const AdminInvoiceHistoryResultPothosObject = AdminInvoiceHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentInvoiceRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const BillingCurrencyTotalRef = gqlSchemaBuilder.objectRef<BillingCurrencyTotal>("BillingCurrencyTotal");

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

export const AdminBillingSummaryRef = gqlSchemaBuilder.objectRef<AdminBillingSummaryResult>("AdminBillingSummary");

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

export const StudentCreditRowRef = gqlSchemaBuilder.objectRef<StudentCreditRow>("StudentCreditRow");

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

export const NextUnpaidInvoiceSummaryRef =
  gqlSchemaBuilder.objectRef<NextUnpaidInvoiceSummary>("NextUnpaidInvoiceSummary");

export const NextUnpaidInvoiceSummaryPothosObject = NextUnpaidInvoiceSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    dueDate: t.exposeString("dueDate"),
    studentName: t.exposeString("studentName", { nullable: true }),
  }),
});

export const ParentBillingSummaryRef = gqlSchemaBuilder.objectRef<ParentBillingSummaryResult>("ParentBillingSummary");

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

export const BillingMonthInputRef = gqlSchemaBuilder.inputRef<BillingMonthInput>("BillingMonthInput");

BillingMonthInputRef.implement({
  fields: t => ({
    year: t.int({ required: true, directives: { constraint: { min: 1900, max: 2100 } } }),
    month: t.int({ required: true, directives: { constraint: { min: 1, max: 12 } } }),
  }),
});
