// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { BillingMonthInputRef } from "@/backend/graphql/pothos/billing/billing-history.pothos";
import {
  DeleteInvoiceResultRef,
  flattenDeleteInvoiceResult,
  ManualInvoiceResultRef,
  MarkInvoicePaidResultRef,
  markInvoicePaidResolver,
  SendPaymentReminderResultRef,
} from "@/backend/graphql/pothos/billing/billing-management.pothos";
import { resolveDisplayAmountFields } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { CurrencyCodePothosObject, InvoiceTypePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuthWithRateLimit } from "@/backend/graphql/shared";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingManagementService } from "@/backend/services";

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
