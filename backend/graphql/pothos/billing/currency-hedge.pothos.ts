import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CurrencyHedgeService } from "@/backend/services";
import type { CurrencyHedgeSelectType } from "@/backend/types";

const CurrencyHedgeRef = gqlSchemaBuilder.objectRef<CurrencyHedgeSelectType>("CurrencyHedge");

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
      const tErrors = ctx.t().errorsTranslations;
      return CurrencyHedgeService.listHedges(userId, tErrors);
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
    authScopes: { permission: AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CurrencyHedgeService.deleteHedge(userId, args.id, tErrors);
    },
  })
);
