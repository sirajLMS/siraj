// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  resolveAuthCtx,
  SupportedCurrencyPothosObject,
  SupportedCurrencyUpsertInputPothos,
} from "@/backend/graphql/pothos/billing/currency.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { CurrencyCatalogService as CurrencyService } from "@/backend/services";

gqlSchemaBuilder.mutationField("activateSupportedCurrency", t =>
  t.field({
    type: SupportedCurrencyPothosObject,
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCIES, notImpersonating: true },
    args: {
      input: t.arg({ type: SupportedCurrencyUpsertInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return CurrencyService.activateCurrency(
        actorUserId,
        {
          ...args.input,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deactivateSupportedCurrency", t =>
  t.field({
    type: "Boolean",
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCIES, notImpersonating: true },
    args: {
      code: t.arg({ type: CurrencyCodePothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return CurrencyService.deactivateCurrency(actorUserId, args.code, tErrors);
    },
  })
);
