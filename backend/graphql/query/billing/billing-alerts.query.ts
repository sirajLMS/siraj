import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UnpaidInvoicesSummaryPothosObject } from "@/backend/graphql/pothos/billing/billing-alerts.pothos";
import { populateBillingFxDisplayCurrencyByUserId } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { BillingAlertsService } from "@/backend/services/billing/billing-alerts.service";

gqlSchemaBuilder.queryFields(t => ({
  unpaidInvoicesAlert: t.field({
    type: UnpaidInvoicesSummaryPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }
      const result = await BillingAlertsService.getUnpaidInvoices(ctx.user.id, ctx.locale);
      await populateBillingFxDisplayCurrencyByUserId(
        ctx,
        result.items.map(item => item.userId)
      );
      return result;
    },
  }),
}));
