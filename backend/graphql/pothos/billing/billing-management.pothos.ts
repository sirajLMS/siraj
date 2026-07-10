import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { BillingMonthInputRef } from "@/backend/graphql/pothos/billing/billing-history.pothos";
import {
  CurrencyCodePothosObject,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingManagementService } from "@/backend/services/billing/billing-management.service";
import type {
  DeleteInvoiceReturnType,
  ManualInvoiceResult,
  MarkInvoicePaidReturnType,
  SendPaymentReminderResult,
} from "@/backend/types";

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

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("createManualInvoice", t =>
  t.field({
    type: ManualInvoiceResultRef,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      parentId: t.arg.string({ required: true }),
      studentId: t.arg.string({ required: false }),
      amount: t.arg.string({ required: true }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      invoiceType: t.arg({ type: InvoiceTypePothosObject, required: true }),
      issueDate: t.arg.string({ required: true }),
      dueDate: t.arg.string({ required: true }),
      exchangeRateSnapshot: t.arg.string({ required: false }),
      exchangeRateSource: t.arg.string({ required: false }),
      billingMonths: t.arg({ type: [BillingMonthInputRef], required: false }),
      sendEmail: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return BillingManagementService.createManualInvoice(
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
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("markInvoicePaid", t =>
  t.field({
    type: MarkInvoicePaidResultRef,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await BillingManagementService.markInvoicePaid(
        userId,
        args.invoiceId,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
      return {
        id: result.invoice.id,
        parentId: result.invoice.parentId,
        status: result.invoice.status,
        paidDate: result.invoice.paidDate,
        version: result.invoice.version,
        notificationSummaryUpdated: result.notificationSummaryUpdated,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("deleteInvoice", t =>
  t.field({
    type: DeleteInvoiceResultRef,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      invoiceId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await BillingManagementService.deleteInvoice(userId, args.invoiceId, ctx.locale);
      return {
        id: result.invoice.id,
        parentId: result.invoice.parentId,
        version: result.invoice.version,
        notificationSummaryUpdated: result.notificationSummaryUpdated,
      };
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
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      studentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return BillingManagementService.sendPaymentReminder(userId, args.studentId, ctx.locale);
    },
  })
);
