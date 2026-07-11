import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CountryCodePothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { SupportedCurrencyReturnType } from "@/backend/types/billing/currency.types";

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
