import type { currencyExchangeAuditLogs, currencyExchangeRates, currencyHedges, fxSyncRuns } from "@/backend/db/schema";
import type { FxProvider, FxProviderConfigSource, FxSyncStatus, FxSyncTrigger } from "@/backend/enum";
import type { PageInfo } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export type CurrencyExchangeRateSelectType = typeof currencyExchangeRates.$inferSelect;
export type CurrencyExchangeRateInsertType = typeof currencyExchangeRates.$inferInsert;

export type CurrencyExchangeRateSubmitInput = Omit<CurrencyExchangeRateInsertType, "id" | "createdAt" | "updatedAt">;

export type CurrencyExchangeRateReturnType = Omit<CurrencyExchangeRateSelectType, "providerResponse">;

export type FxSyncRunSelectType = typeof fxSyncRuns.$inferSelect;

export type FxSyncRunReturnType = Omit<FxSyncRunSelectType, "providerResponse"> & {
  provider: FxProvider;
  status: FxSyncStatus;
};

export type FxRatePair = {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly source: string;
};

export type FxProviderFetchResult = {
  readonly provider: FxProvider;
  readonly base: CurrencyCode;
  readonly timestamp: Date;
  readonly rates: ReadonlyMap<CurrencyCode, string>;
  readonly rawResponse: unknown;
};

export type RefreshExchangeRatesInput = {
  readonly triggeredByUserId: string | null;
  readonly trigger: FxSyncTrigger;
  readonly force?: boolean;
  readonly locale?: string;
};

export type RefreshExchangeRatesResult = {
  readonly id: string;
  readonly success: boolean;
  readonly pairsWritten: number;
  readonly pairsFailed: number;
  readonly syncRunId: string;
  readonly errorMessage?: string;
};

export type FxSyncHealthReturnType = {
  readonly id: string;
  readonly isStale: boolean;
  readonly status: FxSyncStatus | null;
  readonly finishedAt: Date | null;
};

export type FxProviderConfigReturnType = {
  readonly id: string;
  readonly activeProvider: FxProvider;
  readonly source: FxProviderConfigSource;
  readonly updatedAt: Date | null;
  readonly updatedByUserId: string | null;
  readonly updatedByName: string | null;
};

export type UpsertManualExchangeRateInput = {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly effectiveDate?: string | null;
};

export type UpsertManualExchangeRateResult = {
  readonly id: string;
  readonly rate: CurrencyExchangeRateReturnType;
};

export type CurrencyHedgeSelectType = typeof currencyHedges.$inferSelect;
export type CurrencyHedgeInsertType = typeof currencyHedges.$inferInsert;

export type CurrencyHedgeSubmitInput = Omit<CurrencyHedgeInsertType, "id" | "createdAt" | "updatedAt">;

export type CurrencyHedgeUpdateInput = Partial<
  Pick<CurrencyHedgeInsertType, "currency" | "amount" | "hedgeType" | "notes">
>;

export type ExchangeRateHistoryRow = {
  readonly id: string;
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly source: string | null;
  readonly effectiveDate: Date;
};

export type ExchangeRateHistoryPaginatedResult = {
  readonly id: string;
  readonly rows: ExchangeRateHistoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

export type CurrencyExchangeAuditLogInsertType = typeof currencyExchangeAuditLogs.$inferInsert;

export type ExchangeAuditLogInput = Omit<CurrencyExchangeAuditLogInsertType, "id">;
