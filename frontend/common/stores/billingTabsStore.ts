import { create } from "zustand";
import { BILLING_TAB_IDS, type BillingTabId } from "@/frontend/common/views/dashboard/billing/tabs/types";

function isCompleteBillingTabRecord(
  value: Partial<Record<BillingTabId, boolean>>
): value is Record<BillingTabId, boolean> {
  return BILLING_TAB_IDS.every(tabId => typeof value[tabId] === "boolean");
}

function createInitialVisitedTabs(): Record<BillingTabId, boolean> {
  const tabs: Partial<Record<BillingTabId, boolean>> = {};
  for (const tabId of BILLING_TAB_IDS) {
    tabs[tabId] = false;
  }
  if (!isCompleteBillingTabRecord(tabs)) {
    throw new Error("Failed to initialize billing tab record");
  }
  return tabs;
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
