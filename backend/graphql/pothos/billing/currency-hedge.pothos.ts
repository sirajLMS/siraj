import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CurrencyHedgeService } from "@/backend/services/fx/currency-hedge.service";
import type { CurrencyHedgeReturnType } from "@/backend/types";

const CurrencyHedgeRef = gqlSchemaBuilder.objectRef<CurrencyHedgeReturnType>("CurrencyHedge");

export const CurrencyHedgePothosObject = CurrencyHedgeRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    amount: t.exposeString("amount"),
    hedgeType: t.exposeString("hedgeType"),
    notes: t.exposeString("notes", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

gqlSchemaBuilder.queryField("currencyHedges", t =>
  t.field({
    type: [CurrencyHedgePothosObject],
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return CurrencyHedgeService.listHedges(userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("createCurrencyHedge", t =>
  t.field({
    type: CurrencyHedgePothosObject,
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true },
    args: {
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      amount: t.arg.string({ required: true }),
      hedgeType: t.arg.string({ required: true }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return CurrencyHedgeService.createHedge(
        userId,
        {
          currency: args.currency,
          amount: args.amount,
          hedgeType: args.hedgeType,
          notes: args.notes ?? null,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateCurrencyHedge", t =>
  t.field({
    type: CurrencyHedgePothosObject,
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: false }),
      amount: t.arg.string({ required: false }),
      hedgeType: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return CurrencyHedgeService.updateHedge(
        userId,
        args.id,
        {
          currency: args.currency ?? undefined,
          amount: args.amount ?? undefined,
          hedgeType: args.hedgeType ?? undefined,
          notes: args.notes ?? undefined,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteCurrencyHedge", t =>
  t.field({
    type: "Boolean",
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return CurrencyHedgeService.deleteHedge(userId, args.id, ctx.locale);
    },
  })
);
