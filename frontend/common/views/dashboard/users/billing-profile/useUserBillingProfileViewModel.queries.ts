"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type {
  UserBillingProfileInvoiceHistoryQuery,
  UserBillingProfileSummaryQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import {
  buildSummary,
  mapInvoiceRow,
  type SummaryRow,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.helpers";

/** Apollo queries (summary + invoice history). */
export function useBillingProfileQueries(
  userId: string,
  debouncedSearch: string,
  page: number,
  pageSize: number,
  pollInterval: number
) {
  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const { data, loading, refetch } = useQuery(userBillingProfileInvoiceHistoryQueryDocument, {
    variables: {
      userId,
      parentId: null,
      search: debouncedSearch || null,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    skip: summaryLoading,
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  return {
    summaryData,
    summaryLoading,
    refetchSummary,
    data,
    loading,
    refetch,
  };
}

/** Memoized invoice rows derived from the history query. */
export function useBillingProfileInvoices(
  data: UserBillingProfileInvoiceHistoryQuery | undefined,
  fxMessages: FxDisplayMessages,
  locale: string
): readonly ParentInvoiceRow[] {
  return useMemo(
    () =>
      (data?.parentInvoiceHistory?.rows ?? [])
        .filter((row): row is NonNullable<SummaryRow> => row != null)
        .map(inv => mapInvoiceRow(inv, locale, fxMessages)),
    [data?.parentInvoiceHistory, fxMessages, locale]
  );
}

/** Memoized summary block derived from the summary query. */
export function useBillingProfileSummary(
  summaryData: UserBillingProfileSummaryQuery | undefined,
  fxMessages: FxDisplayMessages,
  locale: string
): ParentBillingSummary {
  return useMemo(() => buildSummary(summaryData, locale, fxMessages), [locale, fxMessages, summaryData]);
}
