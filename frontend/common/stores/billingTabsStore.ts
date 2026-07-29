import { create } from "zustand";
import { BILLING_TAB_IDS, type BillingTabId } from "@/frontend/common/views/dashboard/billing/tabs/types";

function createInitialVisitedTabs(): Record<BillingTabId, boolean> {
  return BILLING_TAB_IDS.reduce(
    (acc, tabId) => {
      acc[tabId] = false;
      return acc;
    },
    {} as Record<BillingTabId, boolean>
  );
}

interface BillingTabsState {
  readonly visitedTabs: Record<BillingTabId, boolean>;
  readonly markTabVisited: (tab: BillingTabId) => void;
}

export const useBillingTabsStore = create<BillingTabsState>(set => ({
  visitedTabs: createInitialVisitedTabs(),
  markTabVisited: tab =>
    set(state => ({
      visitedTabs: { ...state.visitedTabs, [tab]: true },
    })),
}));
