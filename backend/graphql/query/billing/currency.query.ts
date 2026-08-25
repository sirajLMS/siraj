// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SupportedCurrencyPothosObject } from "@/backend/graphql/pothos/billing/currency.pothos";
import { CurrencyCatalogService as CurrencyService } from "@/backend/services";

gqlSchemaBuilder.queryField("supportedCurrencies", t =>
  t.field({
    type: [SupportedCurrencyPothosObject],
    authScopes: { loggedIn: true },
    args: {
      activeOnly: t.arg.boolean({ required: false }),
    },
    resolve: (_root, args) =>
      (args.activeOnly ?? true) ? CurrencyService.listActiveCurrencies() : CurrencyService.listAllCurrencies(),
  })
);
