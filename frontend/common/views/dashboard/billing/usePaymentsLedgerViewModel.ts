"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { myPaymentsLedgerQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { usePaymentsLedgerStore } from "@/frontend/common/stores/paymentsLedgerStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { PaymentsLedgerRow } from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import {
  buildBalanceMetrics,
  mapLedgerEntry,
  paginationOptions,
} from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel.helpers";
import {
  useChildHourBalances,
  useLedgerChildren,
} from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import { type PaymentsLedgerLabels, Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export interface PaymentsLedgerViewModel {
  readonly rows: readonly PaymentsLedgerRow[];
  readonly loading: boolean;
  readonly balancesLoading: boolean;
  readonly showError: boolean;
  readonly metrics: readonly MetricItem[];
  readonly paginationOptions: ListPaginationOptions;
  readonly labels: PaymentsLedgerLabels;
  /** Balance-metric tap: navigates to the invoices top-up flow. */
  readonly onMetricClick: (key: string) => void;
}

export type UsePaymentsLedgerViewModelProps = Record<string, never>;

export function usePaymentsLedgerViewModel(
  _props?: Readonly<UsePaymentsLedgerViewModelProps>
): PaymentsLedgerViewModel {
  const billingLabels = useAppTranslation(Translation.Dashboard.Billing);
  const labels = billingLabels.paymentsLedger;
  const locale = useAppLocale();
  const router = useRouter();

  const { data, loading, error } = useQuery(myPaymentsLedgerQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo<readonly PaymentsLedgerRow[]>(
    () => (data?.myPaymentsLedger ?? []).map(entry => mapLedgerEntry(entry, labels, locale)),
    [data?.myPaymentsLedger, labels, locale]
  );

  const children = useLedgerChildren(rows);
  const childrenKey = children.map(child => child.studentId).join("|");
  const balancesLoading = useChildHourBalances(childrenKey);
  const balances = usePaymentsLedgerStore(state => state.balancesByStudentId);
  const metrics = useMemo(() => buildBalanceMetrics(children, balances, labels), [children, balances, labels]);

  const onMetricClick = () => {
    router.push("/billing/invoices");
  };

  return {
    rows,
    loading,
    balancesLoading,
    showError: error != null && !loading && rows.length === 0,
    metrics,
    paginationOptions,
    labels,
    onMetricClick,
  };
}
