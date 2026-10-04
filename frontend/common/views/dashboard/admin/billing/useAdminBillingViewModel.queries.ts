"use client";

import { useCallback, useMemo } from "react";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { useAdminBillingQueryState } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingQueryState";
import {
  mapBillingSummary,
  mapCreditRows,
  mapInvoiceRows,
} from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.mappers";
import type { CreditFilter } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";

interface AdminBillingQueriesArgs {
  readonly page: number;
  readonly pageSize: number;
  readonly debouncedSearch: string;
  readonly pollInterval: number;
  readonly locale: string;
  readonly fxMessages: FxDisplayMessages;
  readonly creditFilter: CreditFilter;
}

/**
 * Maps the billing queries' data onto the view model: `vm` holds the public
 * fields, `refetch` exposes the raw refetch handles the refresh and handler
 * workflows share. Query execution lives in `useAdminBillingQueryState`.
 */
export function useAdminBillingQueries(args: Readonly<AdminBillingQueriesArgs>) {
  const { page, pageSize, debouncedSearch, locale, fxMessages, creditFilter } = args;
  const queries = useAdminBillingQueryState({
    page,
    pageSize,
    debouncedSearch,
    pollInterval: args.pollInterval,
  });
  const { refetchInvoices, refetchSummary, refetchCredit } = queries;

  const invoices = useMemo(
    () => mapInvoiceRows(queries.invoicesData?.adminInvoices, locale, fxMessages),
    [queries.invoicesData, locale, fxMessages]
  );
  const summary = useMemo(
    () => mapBillingSummary(queries.summaryData?.adminBillingSummary, locale, fxMessages),
    [queries.summaryData, locale, fxMessages]
  );
  const allCreditRows = useMemo(() => mapCreditRows(queries.creditData?.studentCreditStatus), [queries.creditData]);
  const creditRows = useMemo(
    () =>
      creditFilter === "negative_balance"
        ? allCreditRows.filter(row => row.status === "negative_balance")
        : allCreditRows,
    [creditFilter, allCreditRows]
  );
  const totalCount = queries.invoicesData ? (queries.invoicesData.adminInvoices?.totalCount ?? 0) : undefined;

  const refreshBillingData = useCallback(() => {
    void refetchInvoices();
    void refetchSummary();
  }, [refetchInvoices, refetchSummary]);

  return {
    vm: {
      summary,
      summaryLoading: queries.summaryLoading,
      summaryError: queries.summaryError ?? null,
      invoices,
      invoicesLoading: queries.invoicesLoading,
      invoicesError: queries.invoicesError ?? null,
      creditRows,
      creditLoading: queries.creditLoading,
      creditError: queries.creditError ?? null,
      totalCount,
      refetchSummary,
      refetchCredit,
      refreshBillingData,
    },
    refetch: { invoices: refetchInvoices, summary: refetchSummary, credit: refetchCredit },
  };
}

export type AdminBillingQueries = ReturnType<typeof useAdminBillingQueries>;
