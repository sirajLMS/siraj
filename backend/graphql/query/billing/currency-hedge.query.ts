// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyHedgePothosObject } from "@/backend/graphql/pothos/billing/currency-hedge.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CurrencyHedgeService } from "@/backend/services";

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
