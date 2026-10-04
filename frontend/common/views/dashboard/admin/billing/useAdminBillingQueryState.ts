"use client";

import { useQuery } from "@apollo/client/react";
import {
  adminBillingSummaryQueryDocument,
  adminInvoicesQueryDocument,
  studentCreditStatusQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { buildInvoicePaginationArgs } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.helpers";

const BILLING_QUERY_FETCH_POLICY = "cache-and-network" as const;

interface AdminBillingQueryStateArgs {
  readonly page: number;
  readonly pageSize: number;
  readonly debouncedSearch: string;
  readonly pollInterval: number;
}

/**
 * Runs the invoices, summary, and credit-status queries and returns the raw
 * Apollo state (data, loading, error, refetch) for each, so the queries hook
 * can map it onto the view model.
 */
export function useAdminBillingQueryState(args: Readonly<AdminBillingQueryStateArgs>) {
  const { page, pageSize, debouncedSearch, pollInterval } = args;

  const invoices = useQuery(adminInvoicesQueryDocument, {
    variables: {
      search: debouncedSearch || null,
      paginationArgs: buildInvoicePaginationArgs(page, pageSize),
    },
    fetchPolicy: BILLING_QUERY_FETCH_POLICY,
    pollInterval,
  });

  const summary = useQuery(adminBillingSummaryQueryDocument, {
    fetchPolicy: BILLING_QUERY_FETCH_POLICY,
    pollInterval,
  });

  const credit = useQuery(studentCreditStatusQueryDocument, {
    fetchPolicy: BILLING_QUERY_FETCH_POLICY,
  });

  return {
    invoicesData: invoices.data,
    invoicesLoading: invoices.loading,
    invoicesError: invoices.error,
    refetchInvoices: invoices.refetch,
    summaryData: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refetchSummary: summary.refetch,
    creditData: credit.data,
    creditLoading: credit.loading,
    creditError: credit.error,
    refetchCredit: credit.refetch,
  };
}
