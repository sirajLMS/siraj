import { useApolloClient } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { usePaymentsLedgerStore } from "@/frontend/common/stores/paymentsLedgerStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  PaymentsLedgerChild,
  PaymentsLedgerRow,
} from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import type { BalanceEntry } from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel.helpers";

/** Distinct children appearing in the ledger, first-appearance order preserved. */
export function useLedgerChildren(rows: readonly PaymentsLedgerRow[]): readonly PaymentsLedgerChild[] {
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
export function useChildHourBalances(childrenKey: string): boolean {
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
