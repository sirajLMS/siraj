"use client";

import { create } from "zustand";

/** Outcome of a token test against Meta for a specific account/number. */
export type WhatsappTokenTestState = "success" | "failed";

/**
 * In-memory (non-persisted) store tracking which token values have been
 * tested against which account, and whether each test passed. Tokens are
 * secrets, so this store is intentionally NOT persisted — state survives tier
 * switches and SPA navigation but is cleared on a full page refresh.
 *
 * Shape: `accountId -> tokenValue -> "success" | "failed"`. Absence means the
 * token has never been tested for that account.
 */
interface WhatsappTokenTestStoreState {
  readonly tokenTests: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestState>>>>;
  /** Record the test outcome for `accountId` + `token`. */
  readonly setTokenTest: (accountId: string, token: string, state: WhatsappTokenTestState) => void;
  /** Drop all recorded test outcomes for an account (e.g. after it is deleted). */
  readonly clearAccount: (accountId: string) => void;
}

export const useWhatsappTokenTestStore = create<WhatsappTokenTestStoreState>(set => ({
  tokenTests: {},
  setTokenTest: (accountId, token, state) =>
    set(current => {
      const accountTests = { ...current.tokenTests[accountId], [token]: state };
      return { tokenTests: { ...current.tokenTests, [accountId]: accountTests } };
    }),
  clearAccount: accountId =>
    set(current => {
      const next = { ...current.tokenTests };
      delete next[accountId];
      return { tokenTests: next };
    }),
}));
