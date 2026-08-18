import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { BillingMonthInputRef } from "@/backend/graphql/pothos/billing/billing-history.pothos";
import {
  DisplayAmountPothosObject,
  resolveDisplayAmountFields,
  setBillingFxDisplayCurrencyForInvoiceParent,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  CurrencyCodePothosObject,
  InvoicePaymentSubmissionStatusPothosEnum,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuthWithRateLimit } from "@/backend/graphql/shared";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingManagementService } from "@/backend/services";
import type {
  DeleteInvoiceResult,
  DeleteInvoiceReturnType,
  InvoicePaymentSubmissionReturnType,
  ManualInvoiceResult,
  MarkInvoicePaidResult,
  MarkInvoicePaidReturnType,
  SendPaymentReminderResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Result Flattening Helpers ──────────────────────────────────────────────
// Services return nested { invoice: {...}, notificationSummaryUpdated } shapes.
// GraphQL objects expose flat top-level fields, so these helpers perform the mapping.

function flattenMarkInvoicePaidResult(result: MarkInvoicePaidResult): MarkInvoicePaidReturnType {
  return {
    id: result.invoice.id,
    parentId: result.invoice.parentId,
    status: result.invoice.status,
    paidDate: result.invoice.paidDate,
    version: result.invoice.version,
    notificationSummaryUpdated: result.notificationSummaryUpdated,
  };
}

function flattenDeleteInvoiceResult(result: DeleteInvoiceResult): DeleteInvoiceReturnType {
  return {
    id: result.invoice.id,
    parentId: result.invoice.parentId,
    version: result.invoice.version,
    notificationSummaryUpdated: result.notificationSummaryUpdated,
  };
}

// Shared resolver helper: authenticates and calls the service, then flattens the result.
// Eliminates duplicated resolver bodies across the four MarkInvoicePaid mutations.

function markInvoicePaidResolver<TArgs extends Record<string, unknown>>(
  serviceCall: (userId: string, args: TArgs, tErrors: ErrorsLabels) => Promise<MarkInvoicePaidResult>
) {
  return async (_root: unknown, args: TArgs, ctx: BaseContext): Promise<MarkInvoicePaidReturnType> => {
    const userId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    const result = await serviceCall(userId, args, tErrors);
    return flattenMarkInvoicePaidResult(result);
  };
}

// ─── ManualInvoiceResult Object ──────────────────────────────────────────────

const ManualInvoiceResultRef = gqlSchemaBuilder.objectRef<ManualInvoiceResult>("ManualInvoiceResult");

export const ManualInvoiceResultPothosObject = ManualInvoiceResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    status: t.expose("status", { type: InvoiceStatusPothosObject }),
    invoiceType: t.expose("invoiceType", { type: InvoiceTypePothosObject }),
    issueDate: t.exposeString("issueDate"),
    dueDate: t.exposeString("dueDate"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    version: t.exposeInt("version"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    displayAmount: t.expose("displayAmount", {
      type: DisplayAmountPothosObject,
      nullable: true,
    }),
  }),
});

// ─── MarkInvoicePaidResult Object ────────────────────────────────────────────
// GraphQL flattens service's nested { invoice: {...} } shape to top-level fields.

const MarkInvoicePaidResultRef = gqlSchemaBuilder.objectRef<MarkInvoicePaidReturnType>("MarkInvoicePaidResult");

export const MarkInvoicePaidResultPothosObject = MarkInvoicePaidResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    status: t.expose("status", { type: InvoiceStatusPothosObject }),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    version: t.exposeInt("version"),
    notificationSummaryUpdated: t.exposeBoolean("notificationSummaryUpdated"),
  }),
});

// ─── DeleteInvoiceResult Object ──────────────────────────────────────────────
// GraphQL flattens service's nested { invoice: {...} } shape to top-level fields.

const DeleteInvoiceResultRef = gqlSchemaBuilder.objectRef<DeleteInvoiceReturnType>("DeleteInvoiceResult");

export const DeleteInvoiceResultPothosObject = DeleteInvoiceResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    version: t.exposeInt("version"),
    notificationSummaryUpdated: t.exposeBoolean("notificationSummaryUpdated"),
  }),
});

const InvoicePaymentSubmissionRef =
  gqlSchemaBuilder.objectRef<InvoicePaymentSubmissionReturnType>("InvoicePaymentSubmission");

export const InvoicePaymentSubmissionPothosObject = InvoicePaymentSubmissionRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    invoiceId: t.exposeString("invoiceId"),
    fileId: t.exposeString("fileId"),
    filePath: t.exposeString("filePath"),
    mimeType: t.exposeString("mimeType"),
    status: t.expose("status", { type: InvoicePaymentSubmissionStatusPothosEnum }),
    submittedByUserId: t.exposeString("submittedByUserId"),
    submittedAt: t.exposeString("submittedAt"),
    reviewedByUserId: t.exposeString("reviewedByUserId", { nullable: true }),
    reviewedAt: t.exposeString("reviewedAt", { nullable: true }),
    rejectionReason: t.exposeString("rejectionReason", { nullable: true }),
  }),
});

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("createManualInvoice", t =>
  t.field({
    type: ManualInvoiceResultRef,
    authScopes: { permission: AppPermission.BILLING_CREATE_INVOICE, notImpersonating: true },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      studentId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      amount: t.arg.string({ required: true, directives: { constraint: { maxLength: 64 } } }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      invoiceType: t.arg({ type: InvoiceTypePothosObject, required: true }),
      issueDate: t.arg.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
      dueDate: t.arg.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
      exchangeRateSnapshot: t.arg.string({ required: false, directives: { constraint: { maxLength: 8192 } } }),
      exchangeRateSource: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
      billingMonths: t.arg({ type: [BillingMonthInputRef], required: false }),
      sendEmail: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const result = await BillingManagementService.createManualInvoice(
        userId,
        {
          parentId: args.parentId,
          studentId: args.studentId ?? null,
          amount: args.amount,
          currency: args.currency,
          invoiceType: args.invoiceType,
          issueDate: args.issueDate,
          dueDate: args.dueDate,
          exchangeRateSnapshot: args.exchangeRateSnapshot ?? null,
          exchangeRateSource: args.exchangeRateSource ?? null,
          billingMonths: args.billingMonths?.map(m => ({ year: m.year, month: m.month })) ?? null,
          sendEmail: args.sendEmail ?? null,
        },
        tErrors
      );

      const displayAmounts = await resolveDisplayAmountFields([result], ctx, "amount", "currency");
      return {
        ...result,
        displayAmount: displayAmounts.get(result.id) ?? null,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("submitPaymentProof", t =>
  t.field({
    type: MarkInvoicePaidResultRef,
    authScopes: { permission: AppPermission.BILLING_SUBMIT_PAYMENT_PROOF, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      proofFileId: t.arg.id({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: markInvoicePaidResolver((_userId, _args, tErrors) =>
      BillingManagementService.submitPaymentProof(
        _userId,
        _args.invoiceId,
        _args.proofFileId,
        tErrors,
        _args.expectedVersion ?? undefined
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("approvePaymentProof", t =>
  t.field({
    type: MarkInvoicePaidResultRef,
    authScopes: { permission: AppPermission.BILLING_UPDATE_STATUS_PAID, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: markInvoicePaidResolver((_userId, _args, tErrors) =>
      BillingManagementService.approvePaymentProof(
        _userId,
        _args.invoiceId,
        tErrors,
        _args.expectedVersion ?? undefined
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("rejectPaymentProof", t =>
  t.field({
    type: MarkInvoicePaidResultRef,
    authScopes: { permission: AppPermission.BILLING_UPDATE_STATUS_PAID, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      rejectionReason: t.arg.string({ required: false, directives: { constraint: { maxLength: 1000 } } }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: markInvoicePaidResolver((_userId, _args, tErrors) =>
      BillingManagementService.rejectPaymentProof(
        _userId,
        _args.invoiceId,
        tErrors,
        _args.rejectionReason ?? null,
        _args.expectedVersion ?? undefined
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("markInvoicePaid", t =>
  t.field({
    type: MarkInvoicePaidResultRef,
    authScopes: { permission: AppPermission.BILLING_UPDATE_STATUS_PAID, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      expectedVersion: t.arg.int({ required: false }),
      proofFileId: t.arg.id({ required: true }),
    },
    resolve: markInvoicePaidResolver((_userId, _args, tErrors) =>
      BillingManagementService.markInvoicePaid(
        _userId,
        _args.invoiceId,
        _args.proofFileId,
        tErrors,
        _args.expectedVersion ?? undefined
      )
    ),
  })
);

gqlSchemaBuilder.queryField("invoicePaymentSubmission", t =>
  t.field({
    type: InvoicePaymentSubmissionRef,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      await setBillingFxDisplayCurrencyForInvoiceParent(ctx, args.invoiceId, userId);
      const tErrors = ctx.t().errorsTranslations;
      return BillingManagementService.getInvoicePaymentSubmission(userId, args.invoiceId, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("deleteInvoice", t =>
  t.field({
    type: DeleteInvoiceResultRef,
    authScopes: { permission: AppPermission.BILLING_DELETE_INVOICE, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const result = await BillingManagementService.deleteInvoice(userId, args.invoiceId, tErrors);
      return flattenDeleteInvoiceResult(result);
    },
  })
);

const SendPaymentReminderResultRef = gqlSchemaBuilder.objectRef<SendPaymentReminderResult>("SendPaymentReminderResult");

export const SendPaymentReminderResultPothosObject = SendPaymentReminderResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

gqlSchemaBuilder.mutationField("sendPaymentReminder", t =>
  t.field({
    type: SendPaymentReminderResultRef,
    authScopes: { permission: AppPermission.BILLING_UPDATE_STATUS_PAID, notImpersonating: true },
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { userId, tErrors } = await requireAuthWithRateLimit(ctx);
      return BillingManagementService.sendPaymentReminder(userId, args.studentId, tErrors);
    },
  })
);
