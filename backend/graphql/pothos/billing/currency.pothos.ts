import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CountryCodePothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { CurrencyCatalogService as CurrencyService } from "@/backend/services/billing/currency.service";
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
