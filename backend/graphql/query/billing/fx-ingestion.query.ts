// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission, FxProvider, FxSyncStatus } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ExchangeRateHistoryResultPothosObject,
  ExchangeRatePothosObject,
  FxProviderConfigPothosObject,
  FxSyncHealthPothosObject,
  FxSyncRunPothosObject,
  isFxProvider,
  isFxSyncStatus,
} from "@/backend/graphql/pothos/billing/fx-ingestion.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { FxProviderConfigService, FxRateQueryService } from "@/backend/services";

gqlSchemaBuilder.queryField("latestExchangeRates", t =>
  t.field({
    type: [ExchangeRatePothosObject],
    authScopes: { permission: AppPermission.BILLING_VIEW_EXCHANGE_RATES },
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const pagination = parsePaginationArgs(args.paginationArgs);
      return FxRateQueryService.listLatestExchangeRates(userId, pagination, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("exchangeRateHistory", t =>
  t.field({
    type: ExchangeRateHistoryResultPothosObject,
    authScopes: { permission: AppPermission.BILLING_VIEW_EXCHANGE_RATES },
    args: {
      from: t.arg({ type: CurrencyCodePothosObject, required: true }),
      to: t.arg({ type: CurrencyCodePothosObject, required: true }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      maxDays: t.arg.int({ required: false, defaultValue: 90, directives: { constraint: { min: 1, max: 3650 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const pagination = parsePaginationArgs(args.paginationArgs);
      return FxRateQueryService.listExchangeRateHistory(
        userId,
        args.from,
        args.to,
        pagination,
        args.maxDays ?? 90,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("latestFxSyncRun", t =>
  t.field({
    type: FxSyncRunPothosObject,
    nullable: true,
    authScopes: { permission: AppPermission.BILLING_VIEW_EXCHANGE_RATES },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const syncRun = await FxRateQueryService.getLatestSyncRun(userId, ctx.locale);
      if (!syncRun) {
        return null;
      }
      // Discard `providerResponse` and `errorMessage` from the response —
      // `errorMessage` may contain raw provider/DB internals that should not
      // be exposed to GraphQL clients.
      const { providerResponse: _providerResponse, errorMessage: _errorMessage, ...rest } = syncRun;
      return {
        ...rest,
        errorMessage: null,
        provider: isFxProvider(syncRun.provider) ? syncRun.provider : FxProvider.OpenExchangeRates,
        status: isFxSyncStatus(syncRun.status) ? syncRun.status : FxSyncStatus.Failed,
      };
    },
  })
);

gqlSchemaBuilder.queryField("fxSyncHealth", t =>
  t.field({
    type: FxSyncHealthPothosObject,
    authScopes: { loggedIn: true },
    resolve: async () => FxRateQueryService.getSyncHealth(),
  })
);

gqlSchemaBuilder.queryField("fxProviderConfig", t =>
  t.field({
    type: FxProviderConfigPothosObject,
    authScopes: { permission: AppPermission.BILLING_VIEW_EXCHANGE_RATES },
    resolve: async () => FxProviderConfigService.getConfig(),
  })
);
