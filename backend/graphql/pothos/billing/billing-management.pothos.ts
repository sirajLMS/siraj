import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  CurrencyCodePothosObject,
  InvoicePaymentSubmissionStatusPothosEnum,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
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

export function flattenMarkInvoicePaidResult(result: MarkInvoicePaidResult): MarkInvoicePaidReturnType {
  return {
    id: result.invoice.id,
    parentId: result.invoice.parentId,
    status: result.invoice.status,
    paidDate: result.invoice.paidDate,
    version: result.invoice.version,
    notificationSummaryUpdated: result.notificationSummaryUpdated,
  };
}

export function flattenDeleteInvoiceResult(result: DeleteInvoiceResult): DeleteInvoiceReturnType {
  return {
    id: result.invoice.id,
    parentId: result.invoice.parentId,
    version: result.invoice.version,
    notificationSummaryUpdated: result.notificationSummaryUpdated,
  };
}

// Shared resolver helper: authenticates and calls the service, then flattens the result.
// Eliminates duplicated resolver bodies across the four MarkInvoicePaid mutations.

export function markInvoicePaidResolver<TArgs extends Record<string, unknown>>(
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

export const ManualInvoiceResultRef = gqlSchemaBuilder.objectRef<ManualInvoiceResult>("ManualInvoiceResult");

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

export const MarkInvoicePaidResultRef = gqlSchemaBuilder.objectRef<MarkInvoicePaidReturnType>("MarkInvoicePaidResult");

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

export const DeleteInvoiceResultRef = gqlSchemaBuilder.objectRef<DeleteInvoiceReturnType>("DeleteInvoiceResult");

export const DeleteInvoiceResultPothosObject = DeleteInvoiceResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    version: t.exposeInt("version"),
    notificationSummaryUpdated: t.exposeBoolean("notificationSummaryUpdated"),
  }),
});

export const InvoicePaymentSubmissionRef =
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

export const SendPaymentReminderResultRef =
  gqlSchemaBuilder.objectRef<SendPaymentReminderResult>("SendPaymentReminderResult");

export const SendPaymentReminderResultPothosObject = SendPaymentReminderResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
