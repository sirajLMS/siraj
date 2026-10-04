import { CurrencyCode, FxProvider, FxSyncStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  exchangeRateHistoryQueryDocument,
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";

export const MOCK_RATES = [
  {
    __typename: "ExchangeRate" as const,
    id: "rate-1",
    fromCurrency: CurrencyCode.Usd,
    toCurrency: CurrencyCode.Sar,
    rate: "3.7508",
    source: "openexchangerates",
    effectiveDate: "2026-07-10T00:00:00.000Z",
  },
  {
    __typename: "ExchangeRate" as const,
    id: "rate-2",
    fromCurrency: CurrencyCode.Eur,
    toCurrency: CurrencyCode.Sar,
    rate: "4.0521",
    source: "openexchangerates",
    effectiveDate: "2026-07-10T00:00:00.000Z",
  },
  {
    __typename: "ExchangeRate" as const,
    id: "rate-3",
    fromCurrency: CurrencyCode.Aed,
    toCurrency: CurrencyCode.Sar,
    rate: "1.0206",
    source: "fixer",
    effectiveDate: "2026-07-10T00:00:00.000Z",
  },
];

export const SUCCESS_SYNC_RUN = {
  __typename: "FxSyncRun" as const,
  id: "sync-1",
  provider: FxProvider.OpenExchangeRates,
  status: FxSyncStatus.Success,
  pairsWritten: "168",
  pairsFailed: "0",
  errorMessage: null,
  triggerType: "manual",
  triggeredByUserId: "user-1",
  startedAt: "2026-07-10T03:00:00.000Z",
  finishedAt: "2026-07-10T03:00:12.000Z",
};

export const FAILED_SYNC_RUN = {
  __typename: "FxSyncRun" as const,
  id: "sync-2",
  provider: FxProvider.Fixer,
  status: FxSyncStatus.Failed,
  pairsWritten: "0",
  pairsFailed: "168",
  errorMessage: "Provider API key rejected: 401 Unauthorized",
  triggerType: "manual",
  triggeredByUserId: "user-1",
  startedAt: "2026-07-10T02:45:00.000Z",
  finishedAt: "2026-07-10T02:45:03.000Z",
};

type SyncRunMock = typeof SUCCESS_SYNC_RUN | typeof FAILED_SYNC_RUN;

export const buildMocks = (rates: typeof MOCK_RATES, syncRun: SyncRunMock) => [
  {
    request: {
      query: latestExchangeRatesQueryDocument,
      variables: { paginationArgs: null },
    },
    result: {
      data: {
        latestExchangeRates: rates,
      },
    },
  },
  {
    request: {
      query: latestFxSyncRunQueryDocument,
    },
    result: {
      data: {
        latestFxSyncRun: syncRun,
      },
    },
  },
  {
    request: {
      query: exchangeRateHistoryQueryDocument,
      variables: {
        from: CurrencyCode.Usd,
        to: CurrencyCode.Sar,
        maxDays: 90,
        paginationArgs: null,
      },
    },
    result: {
      data: {
        exchangeRateHistory: {
          __typename: "ExchangeRateHistoryResult",
          id: "history-1",
          totalCount: 1,
          rows: [MOCK_RATES[0]],
          pageInfo: {
            __typename: "PageInfo",
            count: 1,
            currentPage: 1,
            firstItem: 1,
            lastItem: 1,
            hasMorePages: false,
            lastPage: 1,
            perPage: 100,
            total: 1,
          },
        },
      },
    },
  },
  {
    request: {
      query: refreshExchangeRatesMutationDocument,
      variables: { force: false },
    },
    result: {
      data: {
        refreshExchangeRates: {
          __typename: "RefreshExchangeRatesResult",
          id: "sync-3",
          success: true,
          pairsWritten: 168,
          pairsFailed: 0,
          syncRunId: "sync-3",
          errorMessage: null,
        },
      },
    },
  },
];
