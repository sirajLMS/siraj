import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaymentPothosObject } from "@/backend/graphql/pothos/billing/billing-payments.pothos";
import {
  resolveDisplayAmountFields,
  setBillingFxDisplayCurrencyForInvoiceParent,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingHistoryService, PermissionsService } from "@/backend/services";

gqlSchemaBuilder.queryField("invoicePayments", t =>
  t.field({
    type: [PaymentPothosObject],
    authScopes: { loggedIn: true },
    args: {
      invoiceId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const canView =
        (await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY)) ||
        (await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID));
      if (!canView) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
      }

      await setBillingFxDisplayCurrencyForInvoiceParent(ctx, args.invoiceId, actorUserId);

      const payments = await BillingHistoryService.getPaymentsByInvoiceId(args.invoiceId);
      const displayAmounts = await resolveDisplayAmountFields(payments, ctx, "amount", "currency");
      return payments.map(payment => Object.assign(payment, { displayAmount: displayAmounts.get(payment.id) ?? null }));
    },
  })
);
