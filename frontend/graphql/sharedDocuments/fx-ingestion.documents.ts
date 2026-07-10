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
