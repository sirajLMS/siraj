import { create } from "zustand";

/**
 * Generic per-domain "tab pane visited" store factory — replicates the
 * Settings `visitedTabs` pattern (NOT persisted; initialised all-`false`) so
 * that any tabbed parent page can create its own typed store in one line:
 *
 *   export const useBillingTabsStore = createTabbedPaneStore<BillingTabId>(BILLING_TAB_IDS);
 *
 * Visited tabs stay mounted but visually hidden (via the
 * `visibility:hidden + height:0 + position:absolute` trick in
 * `<TabbedPanePanels>`) so DataGrid widths and form state persist when the
 * user toggles between tabs.
 */
export function createTabbedPaneStore<TabId extends string>(allTabIds: readonly TabId[]) {
  interface TabbedPaneState {
    readonly visitedTabs: Record<TabId, boolean>;
    readonly markTabVisited: (tab: TabId) => void;
  }

  function createInitialVisitedTabs(): Record<TabId, boolean> {
    return allTabIds.reduce(
      (acc, tabId) => {
        acc[tabId] = false;
        return acc;
      },
      {} as Record<TabId, boolean>
    );
  }

  return create<TabbedPaneState>(set => ({
    visitedTabs: createInitialVisitedTabs(),
    markTabVisited: tab =>
      set(state => ({
        visitedTabs: { ...state.visitedTabs, [tab]: true },
      })),
  }));
}
