import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CountryCodePothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CurrencyCatalogService as CurrencyService } from "@/backend/services";
import type { SupportedCurrencyReturnType } from "@/backend/types";

type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsTranslations }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}

const SupportedCurrencyRef = gqlSchemaBuilder.objectRef<SupportedCurrencyReturnType>("SupportedCurrency");

export const SupportedCurrencyPothosObject = SupportedCurrencyRef.implement({
  fields: t => ({
    code: t.expose("code", { type: CurrencyCodePothosObject }),
    symbol: t.exposeString("symbol"),
    countryCode: t.expose("countryCode", { type: CountryCodePothosObject, nullable: true }),
    decimals: t.exposeInt("decimals", { nullable: true }),
    sortOrder: t.exposeInt("sortOrder"),
    isActive: t.exposeBoolean("isActive"),
  }),
});

export const SupportedCurrencyUpsertInputPothos = gqlSchemaBuilder.inputType("SupportedCurrencyUpsertInput", {
  fields: t => ({
    code: t.field({ type: CurrencyCodePothosObject, required: true }),
    symbol: t.string({ required: true }),
    countryCode: t.field({ type: CountryCodePothosObject, required: false }),
    decimals: t.int({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});

gqlSchemaBuilder.queryField("supportedCurrencies", t =>
  t.field({
    type: [SupportedCurrencyPothosObject],
    args: {
      activeOnly: t.arg.boolean({ required: false }),
    },
    resolve: (_root, args) =>
      (args.activeOnly ?? true) ? CurrencyService.listActiveCurrencies() : CurrencyService.listAllCurrencies(),
  })
);

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
