import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UnpaidInvoicesSummaryPothosObject } from "@/backend/graphql/pothos/billing/billing-alerts.pothos";
import {
  populateBillingFxDisplayCurrencyByUserId,
  resolveDisplayAmountFields,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { BillingAlertsService } from "@/backend/services/billing/billing-alerts.service";

gqlSchemaBuilder.queryFields(t => ({
  unpaidInvoicesAlert: t.field({
    type: UnpaidInvoicesSummaryPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      if (!ctx.user) {
        throw new Error(tErrors.unauthorized);
      }
      const result = await BillingAlertsService.getUnpaidInvoices(ctx.user.id, tErrors);
      await populateBillingFxDisplayCurrencyByUserId(
        ctx,
        result.items.map(item => item.userId)
      );

      const displayAmounts = await resolveDisplayAmountFields(
        result.items,
        ctx,
        "totalUnpaidAmount",
        "currency",
        "userId"
      );

      return {
        ...result,
        items: result.items.map(item => ({
          ...item,
          displayAmount: displayAmounts.get(item.id) ?? null,
        })),
      };
    },
  }),
}));
