import { FxProvider, FxSyncStatus } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CurrencyCodePothosObject,
  FxProviderConfigSourcePothosEnum,
  FxProviderPothosEnum,
  FxSyncStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  CurrencyExchangeRateReturnType,
  ExchangeRateHistoryPaginatedResult,
  ExchangeRateHistoryRow,
  FxProviderConfigReturnType,
  FxSyncHealthReturnType,
  FxSyncRunReturnType,
  RefreshExchangeRatesResult,
  UpsertManualExchangeRateResult,
} from "@/backend/types";

export function isFxProvider(value: string): value is FxProvider {
  return (Object.values(FxProvider) as readonly string[]).includes(value);
}

export function isFxSyncStatus(value: string): value is FxSyncStatus {
  return (Object.values(FxSyncStatus) as readonly string[]).includes(value);
}

// ─── ExchangeRate Object (latest exchange rates) ──────────────────────────────

export const ExchangeRateRef = gqlSchemaBuilder.objectRef<CurrencyExchangeRateReturnType>("ExchangeRate");

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

export const ExchangeRateHistoryRowRef = gqlSchemaBuilder.objectRef<ExchangeRateHistoryRow>("ExchangeRateHistoryRow");

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

export const ExchangeRateHistoryResultRef =
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

export const FxSyncRunRef = gqlSchemaBuilder.objectRef<FxSyncRunReturnType>("FxSyncRun");

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

export const RefreshExchangeRatesResultRef =
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

export const FxSyncHealthRef = gqlSchemaBuilder.objectRef<FxSyncHealthReturnType>("FxSyncHealth");

export const FxSyncHealthPothosObject = FxSyncHealthRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    isStale: t.exposeBoolean("isStale"),
    status: t.expose("status", { type: FxSyncStatusPothosEnum, nullable: true }),
    finishedAt: t.expose("finishedAt", { type: "DateTime", nullable: true }),
  }),
});

export const FxProviderConfigRef = gqlSchemaBuilder.objectRef<FxProviderConfigReturnType>("FxProviderConfig");

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

export const UpsertManualExchangeRateResultRef = gqlSchemaBuilder.objectRef<UpsertManualExchangeRateResult>(
  "UpsertManualExchangeRateResult"
);

export const UpsertManualExchangeRateResultPothosObject = UpsertManualExchangeRateResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rate: t.expose("rate", { type: ExchangeRatePothosObject }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

// ─── Mutations ────────────────────────────────────────────────────────────────
