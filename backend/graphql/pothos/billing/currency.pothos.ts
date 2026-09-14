import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CountryCodePothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { SupportedCurrencyReturnType, SupportedCurrencyUpsertInput } from "@/backend/types";

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

export const SupportedCurrencyUpsertInputPothos = gqlSchemaBuilder
  .inputRef<SupportedCurrencyUpsertInput>("SupportedCurrencyUpsertInput")
  .implement({
    fields: t => ({
      code: t.field({ type: CurrencyCodePothosObject, required: true }),
      symbol: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
      countryCode: t.field({ type: CountryCodePothosObject, required: false }),
      decimals: t.int({ required: false, directives: { constraint: { min: 0, max: 8 } } }),
      sortOrder: t.int({ required: false, directives: { constraint: { min: 0, max: 999 } } }),
    }),
  });
