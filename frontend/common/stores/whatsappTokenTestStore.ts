"use client";

import { create } from "zustand";
import type { WhatsappTokenTestFailureKind } from "@/frontend/common/graphql/generated/gql/graphql";

/** Outcome of a token test against Meta for a specific account/number. */
export type WhatsappTokenTestState = "success" | "failed";

/** Recorded outcome of a token test, including the failure reason. */
export interface WhatsappTokenTestResult {
  readonly state: WhatsappTokenTestState;
  /** Human-readable explanation of a failure (null when the test passed). */
  readonly reason: string | null;
  /**
   * Machine-readable failure classification. A value from the enum means the
   * outcome came from Meta or the transport to Meta; null means the request
   * was rejected before Meta was involved (Siraj auth/validation/GraphQL
   * error) — the UI renders it with the "request rejected" hint.
   */
  readonly failureKind: WhatsappTokenTestFailureKind | null;
}

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
  readonly tokenTests: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
  /** Record the test outcome for `accountId` + `token`. */
  readonly setTokenTest: (accountId: string, token: string, result: WhatsappTokenTestResult) => void;
  /** Drop all recorded test outcomes for an account (e.g. after it is deleted). */
  readonly clearAccount: (accountId: string) => void;
}

export const useWhatsappTokenTestStore = create<WhatsappTokenTestStoreState>(set => ({
  tokenTests: {},
  setTokenTest: (accountId, token, result) =>
    set(current => {
      const accountTests = { ...current.tokenTests[accountId], [token]: result };
      return { tokenTests: { ...current.tokenTests, [accountId]: accountTests } };
    }),
  clearAccount: accountId =>
    set(current => {
      const next = { ...current.tokenTests };
      delete next[accountId];
      return { tokenTests: next };
    }),
}));
