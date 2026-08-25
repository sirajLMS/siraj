import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CountryCodePothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { SupportedCurrencyReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}

export const SupportedCurrencyRef = gqlSchemaBuilder.objectRef<SupportedCurrencyReturnType>("SupportedCurrency");

export const SupportedCurrencyPothosObject = SupportedCurrencyRef.implement({
  fields: t => ({
    id: t.string({ resolve: parent => parent.code }),
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
    symbol: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
    countryCode: t.field({ type: CountryCodePothosObject, required: false }),
    decimals: t.int({ required: false, directives: { constraint: { min: 0, max: 8 } } }),
    sortOrder: t.int({ required: false, directives: { constraint: { min: 0, max: 999 } } }),
  }),
});
