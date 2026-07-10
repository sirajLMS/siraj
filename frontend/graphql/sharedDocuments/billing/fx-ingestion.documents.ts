import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const latestExchangeRatesQueryDocument: TypedDocumentNode<
  Operations.LatestExchangeRatesQuery,
  Types.QueryLatestExchangeRatesArgs
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
  Operations.ExchangeRateHistoryQuery,
  Types.QueryExchangeRateHistoryArgs
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

export const latestFxSyncRunQueryDocument: TypedDocumentNode<Operations.LatestFxSyncRunQuery> = gql`
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
  Operations.RefreshExchangeRatesMutation,
  Types.MutationRefreshExchangeRatesArgs
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

export const fxSyncHealthQueryDocument: TypedDocumentNode<Operations.FxSyncHealthQuery> = gql`
  query FxSyncHealth {
    fxSyncHealth {
      id
      isStale
      status
      finishedAt
    }
  }
`;

export const fxProviderConfigQueryDocument: TypedDocumentNode<Operations.FxProviderConfigQuery> = gql`
  query FxProviderConfig {
    fxProviderConfig {
      id
      activeProvider
      source
    }
  }
`;

export const updateFxProviderMutationDocument: TypedDocumentNode<
  Operations.UpdateFxProviderMutation,
  Types.MutationUpdateFxProviderArgs
> = gql`
  mutation UpdateFxProvider($provider: FxProvider!) {
    updateFxProvider(provider: $provider) {
      id
      activeProvider
      source
    }
  }
`;

export const upsertManualExchangeRateMutationDocument: TypedDocumentNode<
  Operations.UpsertManualExchangeRateMutation,
  Types.MutationUpsertManualExchangeRateArgs
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

export const currencyHedgesQueryDocument: TypedDocumentNode<Operations.CurrencyHedgesQuery> = gql`
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
  Operations.CreateCurrencyHedgeMutation,
  Types.MutationCreateCurrencyHedgeArgs
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
  Operations.UpdateCurrencyHedgeMutation,
  Types.MutationUpdateCurrencyHedgeArgs
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
  Operations.DeleteCurrencyHedgeMutation,
  Types.MutationDeleteCurrencyHedgeArgs
> = gql`
  mutation DeleteCurrencyHedge($id: String!) {
    deleteCurrencyHedge(id: $id)
  }
`;
