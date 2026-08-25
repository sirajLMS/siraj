// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { AppPermission, FxSyncTrigger } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  FxProviderConfigPothosObject,
  RefreshExchangeRatesResultPothosObject,
  UpsertManualExchangeRateResultPothosObject,
} from "@/backend/graphql/pothos/billing/fx-ingestion.pothos";
import { CurrencyCodePothosObject, FxProviderPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  FxIngestionService,
  FxProviderConfigService,
  FxRateAdminService,
  FxRateLimitService,
} from "@/backend/services";

gqlSchemaBuilder.mutationField("refreshExchangeRates", t =>
  t.field({
    type: RefreshExchangeRatesResultPothosObject,
    authScopes: { permission: AppPermission.BILLING_REFRESH_EXCHANGE_RATES, notImpersonating: true },
    args: {
      force: t.arg.boolean({ required: false, defaultValue: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      try {
        await FxRateLimitService.checkManualRefreshRateLimit(userId);
      } catch (err) {
        if (err instanceof Error && err.message === "fxRefreshRateLimitExceeded") {
          const tErrors = ctx.t().errorsTranslations;
          throw new GraphQLError(tErrors.billing.fxRefreshRateLimitExceeded, {
            extensions: { code: "FX_REFRESH_RATE_LIMIT_EXCEEDED" },
          });
        }
        throw err;
      }
      return FxIngestionService.refreshRates({
        triggeredByUserId: userId,
        trigger: FxSyncTrigger.Manual,
        force: args.force ?? false,
        locale: ctx.locale,
      });
    },
  })
);

gqlSchemaBuilder.mutationField("updateFxProvider", t =>
  t.field({
    type: FxProviderConfigPothosObject,
    authScopes: { permission: AppPermission.BILLING_MANAGE_FX_PROVIDER, notImpersonating: true },
    args: {
      provider: t.arg({ type: FxProviderPothosEnum, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return FxProviderConfigService.updateProvider(userId, args.provider, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("upsertManualExchangeRate", t =>
  t.field({
    type: UpsertManualExchangeRateResultPothosObject,
    authScopes: { permission: AppPermission.BILLING_OVERRIDE_EXCHANGE_RATES, notImpersonating: true },
    args: {
      fromCurrency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      toCurrency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      rate: t.arg.string({ required: true, directives: { constraint: { maxLength: 32 } } }),
      effectiveDate: t.arg({ type: "DateTime", required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return FxRateAdminService.upsertManualRate(
        userId,
        {
          fromCurrency: args.fromCurrency,
          toCurrency: args.toCurrency,
          rate: args.rate,
          effectiveDate: args.effectiveDate?.toISOString() ?? null,
        },
        ctx.locale
      );
    },
  })
);
