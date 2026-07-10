import { AppPermission, type FxProvider, type FxSyncStatus, FxSyncTrigger } from "@/backend/enum";
import type { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CurrencyCodePothosObject,
  FxProviderPothosEnum,
  FxSyncStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { FxIngestionService } from "@/backend/services/fx/fx-ingestion.service";
import { FxRateLimitService } from "@/backend/services/fx/fx-rate-limit.service";
import { FxRateQueryService } from "@/backend/services/fx/fx-rate-query.service";
import type {
  CurrencyExchangeRateReturnType,
  ExchangeRateHistoryPaginatedResult,
  ExchangeRateHistoryRow,
  FxSyncRunReturnType,
  PaginationArgs,
  PaginationInput,
  RefreshExchangeRatesResult,
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
        args.from as CurrencyCode,
        args.to as CurrencyCode,
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
      const { providerResponse: _providerResponse, ...rest } = syncRun;
      void _providerResponse;
      return {
        ...rest,
        provider: syncRun.provider as FxProvider,
        status: syncRun.status as FxSyncStatus,
      };
    },
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
