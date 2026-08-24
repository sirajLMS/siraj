import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaymentPothosObject } from "@/backend/graphql/pothos/billing/billing-payments.pothos";
import {
  resolveDisplayAmountFields,
  setBillingFxDisplayCurrencyForInvoiceParent,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingHistoryService, BillingManagementService, PermissionsService } from "@/backend/services";

gqlSchemaBuilder.queryField("invoicePayments", t =>
  t.field({
    type: [PaymentPothosObject],
    authScopes: { loggedIn: true },
    args: {
      invoiceId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const canView =
        (await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY)) ||
        (await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID));
      if (!canView) {
        throw new Error(tErrors.insufficientPermissions);
      }

      // Scope the invoice to the caller — having a billing-history permission
      // does NOT grant access to ANY invoice; the caller must either be a
      // super-admin / have an invoices-list permission, OR be the parent who
      // owns the invoice. This closes the IDOR on invoiceId.
      const context = { isSuperAdmin: ctx.isSuperAdmin, permissions: ctx.permissions };
      await BillingManagementService.verifyInvoiceAccess(actorUserId, args.invoiceId, context, tErrors);

      await setBillingFxDisplayCurrencyForInvoiceParent(ctx, args.invoiceId, actorUserId);

      const payments = await BillingHistoryService.getPaymentsByInvoiceId(args.invoiceId);
      const displayAmounts = await resolveDisplayAmountFields(payments, ctx, "amount", "currency");
      return payments.map(payment => Object.assign(payment, { displayAmount: displayAmounts.get(payment.id) ?? null }));
    },
  })
);
