"use client";

import { create } from "zustand";

/**
 * In-memory (non-persisted) store holding the active tab for each profile
 * shell route. Keyed by pathname so that the own-profile page and each
 * per-user admin profile page keep independent selections, and so the active
 * tab survives component unmount/remount cycles (e.g. mobile↔desktop tier
 * switches). The store holds no viewport or permission logic — consumers
 * must re-validate the stored tab against their visible-tab list before
 * rendering it.
 */
interface ProfileShellTabState {
  readonly activeTabByRoute: Readonly<Record<string, string>>;
  readonly setActiveTab: (route: string, tab: string) => void;
}

export const useProfileShellTabStore = create<ProfileShellTabState>()(set => ({
  activeTabByRoute: {},
  setActiveTab: (route, tab) =>
    set(state => {
      if (state.activeTabByRoute[route] === tab) {
        return state;
      }
      return {
        activeTabByRoute: { ...state.activeTabByRoute, [route]: tab },
      };
    }),
}));
