"use client";

import { create } from "zustand";
import type { StudentCreditHourBalanceQuery_studentCreditHourBalance } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * In-memory cache of per-child credit-hour balances for the payments-ledger
 * metrics strip. Non-persisted: entries are refetched when the component tree
 * remounts with a new children key; Apollo's normalized cache keeps repeat
 * fetches cheap.
 */
export interface PaymentsLedgerState {
  readonly balancesByStudentId: Readonly<
    Record<string, StudentCreditHourBalanceQuery_studentCreditHourBalance>
  >;
  /** Joined student-id key of the last completed balance fan-out. */
  readonly balancesFetchedKey: string;
  readonly applyBalances: (
    key: string,
    entries: readonly StudentCreditHourBalanceQuery_studentCreditHourBalance[]
  ) => void;
}

export const usePaymentsLedgerStore = create<PaymentsLedgerState>(set => ({
  balancesByStudentId: {},
  balancesFetchedKey: "",
  applyBalances: (key, entries) =>
    set(state => {
      const merged: Record<string, StudentCreditHourBalanceQuery_studentCreditHourBalance> = {
        ...state.balancesByStudentId,
      };
      for (const entry of entries) {
        if (entry.studentId != null) merged[entry.studentId] = entry;
      }
      return { balancesByStudentId: merged, balancesFetchedKey: key };
    }),
}));
