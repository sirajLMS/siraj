import { create } from "zustand";
import type { SettingsTabId } from "@/frontend/common/views/dashboard/settings/types/settings.types";

const ALL_TAB_IDS: readonly SettingsTabId[] = [
  "general",
  "environment",
  "session",
  "audit",
  "siteContent",
  "timezones",
] as const;

function createInitialVisitedTabs(): Record<SettingsTabId, boolean> {
  return ALL_TAB_IDS.reduce(
    (acc, tabId) => {
      acc[tabId] = false;
      return acc;
    },
    {} as Record<SettingsTabId, boolean>
  );
}

interface SettingsState {
  readonly activeTab: SettingsTabId;
  readonly visitedTabs: Record<SettingsTabId, boolean>;
  readonly setActiveTab: (tab: SettingsTabId) => void;
  readonly markTabVisited: (tab: SettingsTabId) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  activeTab: "general",
  visitedTabs: createInitialVisitedTabs(),
  setActiveTab: tab =>
    set(state => ({
      activeTab: tab,
      visitedTabs: { ...state.visitedTabs, [tab]: true },
    })),
  markTabVisited: tab =>
    set(state => ({
      visitedTabs: { ...state.visitedTabs, [tab]: true },
    })),
}));
