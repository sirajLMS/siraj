"use client";

import { useApolloClient, useQuery } from "@apollo/client/react";
import { ChildCareOutlined } from "@mui/icons-material";
import { useEffect, useMemo } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  MyPaymentsLedgerQuery_myPaymentsLedger,
  StudentCreditHourBalanceQuery_studentCreditHourBalance,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { myPaymentsLedgerQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { usePaymentsLedgerStore } from "@/frontend/common/stores/paymentsLedgerStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import type {
  PaymentsLedgerChild,
  PaymentsLedgerRow,
} from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import { useRouter } from "@/shared/i18n/navigation";
import {
  type AppLocale,
  type PaymentsLedgerLabels,
  Translation,
  useAppLocale,
  useAppTranslation,
} from "@/shared/locale";

type LedgerEntry = MyPaymentsLedgerQuery_myPaymentsLedger;
type BalanceEntry = StudentCreditHourBalanceQuery_studentCreditHourBalance;
type BalanceMap = Readonly<Record<string, BalanceEntry>>;

const LEDGER_PAGE_SIZE = 10;

/** Display value for cells whose backing field is null (hour-less rows, unnamed students). */
const MISSING_VALUE = "—";

const paginationOptions: ListPaginationOptions = {
  mode: "client",
  pageSize: LEDGER_PAGE_SIZE,
  pageSizeOptions: [LEDGER_PAGE_SIZE],
};

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

function formatMethodLabel(method: string | null): string {
  if (!method) return MISSING_VALUE;
  return method
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatLedgerDate(isoDate: string, locale: AppLocale): string {
  if (!isoDate) return MISSING_VALUE;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return MISSING_VALUE;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Money amounts are decimal strings from the API; always render two fraction digits. */
function formatLedgerAmount(amount: string | null, currency: string | null, locale: AppLocale): string {
  const rawAmount = amount?.trim() ?? "";
  const numeric = rawAmount === "" ? Number.NaN : Number(rawAmount);
  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)
    : MISSING_VALUE;
  const currencyCode = currency?.trim() ?? "";
  return currencyCode ? `${formatted} ${currencyCode}` : formatted;
}

function mapLedgerEntry(entry: LedgerEntry, labels: PaymentsLedgerLabels, locale: AppLocale): PaymentsLedgerRow {
  const hours = entry.creditHours;
  const creditsPurchased = entry.creditsPurchased ?? 0;
  let creditsLabel = MISSING_VALUE;
  if (hours != null) {
    creditsLabel = labels.hoursAddedChip(hours);
  } else if (creditsPurchased > 0) {
    creditsLabel = labels.creditsAddedChip(creditsPurchased);
  }
  return {
    id: entry.id ?? "",
    studentId: entry.studentId ?? null,
    studentName: entry.studentName ?? null,
    creditHours: hours,
    creditsPurchased,
    creditsLabel,
    amountLabel: formatLedgerAmount(entry.amount ?? null, entry.currency ?? null, locale),
    packageName: entry.packageName ?? null,
    methodLabel: formatMethodLabel(entry.paymentMethodType ?? null),
    dateLabel: formatLedgerDate(entry.paymentDate ?? "", locale),
  };
}

/** Distinct children appearing in the ledger, first-appearance order preserved. */
function useLedgerChildren(rows: readonly PaymentsLedgerRow[]): readonly PaymentsLedgerChild[] {
  return useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (row.studentId && !seen.has(row.studentId)) {
        seen.set(row.studentId, row.studentName ?? "");
      }
    }
    return [...seen.entries()].map(([studentId, studentName]) => ({ studentId, studentName }));
  }, [rows]);
}

async function fetchChildBalance(
  client: ReturnType<typeof useApolloClient>,
  studentId: string
): Promise<BalanceEntry | null> {
  try {
    const { data } = await client.query({
      query: studentCreditHourBalanceQueryDocument,
      variables: { studentId },
      fetchPolicy: "cache-first",
    });
    return data?.studentCreditHourBalance ?? null;
  } catch (error) {
    logger.warn("Payments ledger: child balance fetch failed", { studentId, error });
    return null;
  }
}

/**
 * Fetches each child's credit-hour balance in one ViewModel-level fan-out and
 * lands the results in the store. The Apollo link is BatchHttpLink, so the
 * per-student queries issued in the same tick coalesce into a single HTTP
 * round-trip — the ledger owns the whole batch instead of one query per card.
 */
function useChildHourBalances(childrenKey: string): boolean {
  const client = useApolloClient();
  const applyBalances = usePaymentsLedgerStore(state => state.applyBalances);
  const fetchedKey = usePaymentsLedgerStore(state => state.balancesFetchedKey);

  useEffect(() => {
    let stale = false;
    if (childrenKey !== "" && fetchedKey !== childrenKey) {
      const ids = childrenKey.split("|");
      Promise.all(ids.map(studentId => fetchChildBalance(client, studentId)))
        .then(results => {
          if (!stale) {
            applyBalances(
              childrenKey,
              results.filter((entry): entry is BalanceEntry => entry != null)
            );
          }
          return results;
        })
        .catch((error: unknown) => {
          logger.error("Payments ledger: balance fan-out failed", { error });
        });
    }
    return () => {
      stale = true;
    };
  }, [client, childrenKey, fetchedKey, applyBalances]);

  return childrenKey !== "" && fetchedKey !== childrenKey;
}

function buildBalanceMetrics(
  children: readonly PaymentsLedgerChild[],
  balances: BalanceMap,
  labels: PaymentsLedgerLabels
): readonly MetricItem[] {
  return children.map(child => {
    const balance = balances[child.studentId];
    const remaining = balance?.creditHoursRemaining != null ? Number(balance.creditHoursRemaining) : null;
    const threshold = balance?.lowHoursThreshold ?? null;
    const isLow = remaining != null && threshold != null && remaining <= threshold;
    return {
      key: child.studentId,
      labelKey: child.studentId,
      label: child.studentName || MISSING_VALUE,
      count: remaining != null ? labels.hoursRemainingValue(remaining) : MISSING_VALUE,
      subLabel: isLow ? labels.lowBalanceHint : labels.balanceSubLabel,
      icon: ChildCareOutlined,
      variant: isLow ? "error" : "default",
    };
  });
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
