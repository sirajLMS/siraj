import { BillingAlertsService } from "@/backend/services/billing/billing-alerts.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { UnpaidInvoicesSummaryPothosObject } from "../pothos/billing-alerts.pothos";

gqlSchemaBuilder.queryFields(t => ({
  unpaidInvoicesAlert: t.field({
    type: UnpaidInvoicesSummaryPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }
      return BillingAlertsService.getUnpaidInvoices(ctx.user.id, ctx.locale);
    },
  }),
}));
