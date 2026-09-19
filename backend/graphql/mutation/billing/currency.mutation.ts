// Mutation field registrations for supported currencies.
// Per mutation/AGENTS.md, Pothos objects live in the pothos layer; this file only registers fields.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  SupportedCurrencyPothosObject,
  SupportedCurrencyUpsertInputPothos,
} from "@/backend/graphql/pothos/billing/currency.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { resolveAuthCtx } from "@/backend/graphql/utils";
import { CurrencyCatalogService as CurrencyService } from "@/backend/services";

gqlSchemaBuilder.mutationField("activateSupportedCurrency", t =>
  t.field({
    type: SupportedCurrencyPothosObject,
    authScopes: { $all: { permission: AppPermission.BILLING_MANAGE_CURRENCIES, notImpersonating: true } },
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
    authScopes: { $all: { permission: AppPermission.BILLING_MANAGE_CURRENCIES, notImpersonating: true } },
    args: {
      code: t.arg({ type: CurrencyCodePothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return CurrencyService.deactivateCurrency(actorUserId, args.code, tErrors);
    },
  })
);
