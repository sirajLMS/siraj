import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateCurrencyHedgeMutation,
  CreateCurrencyHedgeMutationVariables,
  CurrencyHedgesQuery,
  DeleteCurrencyHedgeMutation,
  DeleteCurrencyHedgeMutationVariables,
  ExchangeRateHistoryQuery,
  ExchangeRateHistoryQueryVariables,
  FxProviderConfigQuery,
  FxSyncHealthQuery,
  LatestExchangeRatesQuery,
  LatestExchangeRatesQueryVariables,
  LatestFxSyncRunQuery,
  RefreshExchangeRatesMutation,
  RefreshExchangeRatesMutationVariables,
  UpdateCurrencyHedgeMutation,
  UpdateCurrencyHedgeMutationVariables,
  UpdateFxProviderMutation,
  UpdateFxProviderMutationVariables,
  UpsertManualExchangeRateMutation,
  UpsertManualExchangeRateMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const latestExchangeRatesQueryDocument: TypedDocumentNode<
  LatestExchangeRatesQuery,
  LatestExchangeRatesQueryVariables
> = gql`
  query LatestExchangeRates($paginationArgs: PaginationArgs) {
    latestExchangeRates(paginationArgs: $paginationArgs) {
      id
      fromCurrency
      toCurrency
      rate
      source
      effectiveDate
    }
  }
`;

export const exchangeRateHistoryQueryDocument: TypedDocumentNode<
  ExchangeRateHistoryQuery,
  ExchangeRateHistoryQueryVariables
> = gql`
  query ExchangeRateHistory(
    $from: CurrencyCode!
    $to: CurrencyCode!
    $paginationArgs: PaginationArgs
    $maxDays: Int
  ) {
    exchangeRateHistory(
      from: $from
      to: $to
      paginationArgs: $paginationArgs
      maxDays: $maxDays
    ) {
      id
      totalCount
      rows {
        id
        fromCurrency
        toCurrency
        rate
        source
        effectiveDate
      }
      pageInfo {
        count
        currentPage
        firstItem
        lastItem
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`;

export const latestFxSyncRunQueryDocument: TypedDocumentNode<LatestFxSyncRunQuery> = gql`
  query LatestFxSyncRun {
    latestFxSyncRun {
      id
      provider
      status
      pairsWritten
      pairsFailed
      errorMessage
      triggerType
      triggeredByUserId
      startedAt
      finishedAt
    }
  }
`;

export const refreshExchangeRatesMutationDocument: TypedDocumentNode<
  RefreshExchangeRatesMutation,
  RefreshExchangeRatesMutationVariables
> = gql`
  mutation RefreshExchangeRates($force: Boolean) {
    refreshExchangeRates(force: $force) {
      id
      success
      pairsWritten
      pairsFailed
      syncRunId
      errorMessage
    }
  }
`;

export const fxSyncHealthQueryDocument: TypedDocumentNode<FxSyncHealthQuery> = gql`
  query FxSyncHealth {
    fxSyncHealth {
      id
      isStale
      status
      finishedAt
    }
  }
`;

export const fxProviderConfigQueryDocument: TypedDocumentNode<FxProviderConfigQuery> = gql`
  query FxProviderConfig {
    fxProviderConfig {
      id
      activeProvider
      source
      updatedAt
      updatedByUserId
      updatedByName
    }
  }
`;

export const updateFxProviderMutationDocument: TypedDocumentNode<
  UpdateFxProviderMutation,
  UpdateFxProviderMutationVariables
> = gql`
  mutation UpdateFxProvider($provider: FxProvider!) {
    updateFxProvider(provider: $provider) {
      id
      activeProvider
      source
      updatedAt
      updatedByUserId
      updatedByName
    }
  }
`;

export const upsertManualExchangeRateMutationDocument: TypedDocumentNode<
  UpsertManualExchangeRateMutation,
  UpsertManualExchangeRateMutationVariables
> = gql`
  mutation UpsertManualExchangeRate(
    $fromCurrency: CurrencyCode!
    $toCurrency: CurrencyCode!
    $rate: String!
    $effectiveDate: DateTime
  ) {
    upsertManualExchangeRate(
      fromCurrency: $fromCurrency
      toCurrency: $toCurrency
      rate: $rate
      effectiveDate: $effectiveDate
    ) {
      id
      rate {
        id
        fromCurrency
        toCurrency
        rate
        source
        effectiveDate
      }
    }
  }
`;

export const currencyHedgesQueryDocument: TypedDocumentNode<CurrencyHedgesQuery> = gql`
  query CurrencyHedges {
    currencyHedges {
      id
      currency
      amount
      hedgeType
      notes
      createdAt
      updatedAt
    }
  }
`;

export const createCurrencyHedgeMutationDocument: TypedDocumentNode<
  CreateCurrencyHedgeMutation,
  CreateCurrencyHedgeMutationVariables
> = gql`
  mutation CreateCurrencyHedge(
    $currency: CurrencyCode!
    $amount: String!
    $hedgeType: String!
    $notes: String
  ) {
    createCurrencyHedge(currency: $currency, amount: $amount, hedgeType: $hedgeType, notes: $notes) {
      id
      currency
      amount
      hedgeType
      notes
      createdAt
      updatedAt
    }
  }
`;

export const updateCurrencyHedgeMutationDocument: TypedDocumentNode<
  UpdateCurrencyHedgeMutation,
  UpdateCurrencyHedgeMutationVariables
> = gql`
  mutation UpdateCurrencyHedge(
    $id: String!
    $currency: CurrencyCode
    $amount: String
    $hedgeType: String
    $notes: String
  ) {
    updateCurrencyHedge(
      id: $id
      currency: $currency
      amount: $amount
      hedgeType: $hedgeType
      notes: $notes
    ) {
      id
      currency
      amount
      hedgeType
      notes
      createdAt
      updatedAt
    }
  }
`;

export const deleteCurrencyHedgeMutationDocument: TypedDocumentNode<
  DeleteCurrencyHedgeMutation,
  DeleteCurrencyHedgeMutationVariables
> = gql`
  mutation DeleteCurrencyHedge($id: String!) {
    deleteCurrencyHedge(id: $id)
  }
`;
