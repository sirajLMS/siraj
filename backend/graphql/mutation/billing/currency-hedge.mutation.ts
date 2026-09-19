// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyHedgePothosObject } from "@/backend/graphql/pothos/billing/currency-hedge.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CurrencyHedgeService } from "@/backend/services";

gqlSchemaBuilder.mutationField("createCurrencyHedge", t =>
  t.field({
    type: CurrencyHedgePothosObject,
    authScopes: { $all: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true } },
    args: {
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      amount: t.arg.string({ required: true, directives: { constraint: { maxLength: 64 } } }),
      hedgeType: t.arg.string({ required: true, directives: { constraint: { maxLength: 64 } } }),
      notes: t.arg.string({ required: false, directives: { constraint: { maxLength: 10000 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CurrencyHedgeService.createHedge(
        userId,
        {
          currency: args.currency,
          amount: args.amount,
          hedgeType: args.hedgeType,
          notes: args.notes ?? null,
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateCurrencyHedge", t =>
  t.field({
    type: CurrencyHedgePothosObject,
    authScopes: { $all: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true } },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: false }),
      amount: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
      hedgeType: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
      notes: t.arg.string({ required: false, directives: { constraint: { maxLength: 10000 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CurrencyHedgeService.updateHedge(
        userId,
        args.id,
        {
          currency: args.currency ?? undefined,
          amount: args.amount ?? undefined,
          hedgeType: args.hedgeType ?? undefined,
          notes: args.notes ?? undefined,
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteCurrencyHedge", t =>
  t.field({
    type: "Boolean",
    authScopes: { $all: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true } },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CurrencyHedgeService.deleteHedge(userId, args.id, tErrors);
    },
  })
);
