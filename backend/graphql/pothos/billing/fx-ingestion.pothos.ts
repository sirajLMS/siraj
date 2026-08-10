import { AppPermission, FxProvider, FxSyncStatus, FxSyncTrigger } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CurrencyCodePothosObject,
  FxProviderConfigSourcePothosEnum,
  FxProviderPothosEnum,
  FxSyncStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  FxIngestionService,
  FxProviderConfigService,
  FxRateAdminService,
  FxRateLimitService,
  FxRateQueryService,
} from "@/backend/services";
import type {
  CurrencyExchangeRateReturnType,
  ExchangeRateHistoryPaginatedResult,
  ExchangeRateHistoryRow,
  FxProviderConfigReturnType,
  FxSyncHealthReturnType,
  FxSyncRunReturnType,
  PaginationArgs,
  PaginationInput,
  RefreshExchangeRatesResult,
  UpsertManualExchangeRateResult,
} from "@/backend/types";
import { PaginationArgs as PaginationArgsClass } from "@/backend/types";

function parsePaginationArgs(input: PaginationInput | null | undefined): PaginationArgs | null {
  if (!input) {
    return null;
  }
  return new PaginationArgsClass({
    first: input.first ?? null,
    skip: input.skip ?? null,
    after: input.after ?? null,
    before: input.before ?? null,
    last: input.last ?? null,
    page: input.page ?? null,
    maxCount: input.maxCount ?? null,
  });
}

function isFxProvider(value: string): value is FxProvider {
  return (Object.values(FxProvider) as readonly string[]).includes(value);
}

function isFxSyncStatus(value: string): value is FxSyncStatus {
  return (Object.values(FxSyncStatus) as readonly string[]).includes(value);
}

// ─── ExchangeRate Object (latest exchange rates) ──────────────────────────────

const ExchangeRateRef = gqlSchemaBuilder.objectRef<CurrencyExchangeRateReturnType>("ExchangeRate");

export const ExchangeRatePothosObject = ExchangeRateRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    fromCurrency: t.exposeString("fromCurrency"),
    toCurrency: t.exposeString("toCurrency"),
    rate: t.exposeString("rate"),
    source: t.exposeString("source", { nullable: true }),
    effectiveDate: t.expose("effectiveDate", { type: "DateTime" }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── ExchangeRateHistoryRow Object (history rows) ─────────────────────────────

const ExchangeRateHistoryRowRef = gqlSchemaBuilder.objectRef<ExchangeRateHistoryRow>("ExchangeRateHistoryRow");

export const ExchangeRateHistoryRowPothosObject = ExchangeRateHistoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    fromCurrency: t.expose("fromCurrency", { type: CurrencyCodePothosObject }),
    toCurrency: t.expose("toCurrency", { type: CurrencyCodePothosObject }),
    rate: t.exposeString("rate"),
    source: t.exposeString("source", { nullable: true }),
    effectiveDate: t.expose("effectiveDate", { type: "DateTime" }),
  }),
});

// ─── ExchangeRateHistoryResult Object (paginated wrapper) ──────────────────────

const ExchangeRateHistoryResultRef =
  gqlSchemaBuilder.objectRef<ExchangeRateHistoryPaginatedResult>("ExchangeRateHistoryResult");

export const ExchangeRateHistoryResultPothosObject = ExchangeRateHistoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ExchangeRateHistoryRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── FxSyncRun Object ──────────────────────────────────────────────────────────

const FxSyncRunRef = gqlSchemaBuilder.objectRef<FxSyncRunReturnType>("FxSyncRun");

export const FxSyncRunPothosObject = FxSyncRunRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    provider: t.expose("provider", { type: FxProviderPothosEnum }),
    status: t.expose("status", { type: FxSyncStatusPothosEnum }),
    pairsWritten: t.exposeString("pairsWritten"),
    pairsFailed: t.exposeString("pairsFailed"),
    errorMessage: t.exposeString("errorMessage", { nullable: true }),
    triggerType: t.exposeString("triggerType"),
    startedAt: t.expose("startedAt", { type: "DateTime" }),
    finishedAt: t.expose("finishedAt", { type: "DateTime", nullable: true }),
    triggeredByUserId: t.exposeString("triggeredByUserId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── RefreshExchangeRatesResult Object ────────────────────────────────────────

const RefreshExchangeRatesResultRef =
  gqlSchemaBuilder.objectRef<RefreshExchangeRatesResult>("RefreshExchangeRatesResult");

export const RefreshExchangeRatesResultPothosObject = RefreshExchangeRatesResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
    pairsWritten: t.exposeInt("pairsWritten"),
    pairsFailed: t.exposeInt("pairsFailed"),
    syncRunId: t.exposeString("syncRunId"),
    errorMessage: t.exposeString("errorMessage", { nullable: true }),
  }),
});

const FxSyncHealthRef = gqlSchemaBuilder.objectRef<FxSyncHealthReturnType>("FxSyncHealth");

export const FxSyncHealthPothosObject = FxSyncHealthRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    isStale: t.exposeBoolean("isStale"),
    status: t.expose("status", { type: FxSyncStatusPothosEnum, nullable: true }),
    finishedAt: t.expose("finishedAt", { type: "DateTime", nullable: true }),
  }),
});

const FxProviderConfigRef = gqlSchemaBuilder.objectRef<FxProviderConfigReturnType>("FxProviderConfig");

export const FxProviderConfigPothosObject = FxProviderConfigRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    activeProvider: t.expose("activeProvider", { type: FxProviderPothosEnum }),
    source: t.expose("source", { type: FxProviderConfigSourcePothosEnum }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: true }),
    updatedByUserId: t.exposeString("updatedByUserId", { nullable: true }),
    updatedByName: t.exposeString("updatedByName", { nullable: true }),
  }),
});

const UpsertManualExchangeRateResultRef = gqlSchemaBuilder.objectRef<UpsertManualExchangeRateResult>(
  "UpsertManualExchangeRateResult"
);

export const UpsertManualExchangeRateResultPothosObject = UpsertManualExchangeRateResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rate: t.expose("rate", { type: ExchangeRatePothosObject }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

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
      maxDays: t.arg.int({ required: false, defaultValue: 90 }),
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
      // Discard `providerResponse` from the response — uses the `_`-prefix
      const { providerResponse: _providerResponse, ...rest } = syncRun;
      return {
        ...rest,
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

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("refreshExchangeRates", t =>
  t.field({
    type: RefreshExchangeRatesResultPothosObject,
    authScopes: { permission: AppPermission.BILLING_REFRESH_EXCHANGE_RATES, notImpersonating: true },
    args: {
      force: t.arg.boolean({ required: false, defaultValue: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      await FxRateLimitService.checkManualRefreshRateLimit(userId);
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
      rate: t.arg.string({ required: true }),
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
