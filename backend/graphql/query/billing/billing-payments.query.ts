import { BillingRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaymentPothosObject } from "@/backend/graphql/pothos/billing/billing-payments.pothos";
import { setBillingFxDisplayCurrencyForInvoiceParent } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { getBackendTranslations } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";

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
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("insufficientPermissions"));
      }

      await setBillingFxDisplayCurrencyForInvoiceParent(ctx, args.invoiceId, actorUserId);

      return BillingRepository.getPaymentsByInvoiceId(args.invoiceId);
    },
  })
);
