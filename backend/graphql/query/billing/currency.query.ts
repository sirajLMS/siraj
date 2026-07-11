import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SupportedCurrencyPothosObject } from "@/backend/graphql/pothos/billing/currency.pothos";
import { CurrencyCatalogService } from "@/backend/services/billing/currency.service";

gqlSchemaBuilder.queryField("supportedCurrencies", t =>
  t.field({
    type: [SupportedCurrencyPothosObject],
    authScopes: { loggedIn: true },
    args: {
      activeOnly: t.arg.boolean({ required: false, defaultValue: true }),
    },
    resolve: async (_parent, args) => {
      return CurrencyCatalogService.listSupportedCurrencies(args.activeOnly ?? true);
    },
    description: "Lists supported currency metadata for display and selection.",
  })
);
