"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSidebarCookie } from "@/frontend/common/lib/sidebar-detection";

interface LayoutState {
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  /**
   * Per-group collapse state, keyed by `NavGroup.id`. `true` means the group
   * is collapsed (items hidden, header visible). Initialised lazily from each
   * group's `defaultCollapsed` flag via `initGroupCollapsed`, never silently
   * overridden — the user's choice owns the persisted entry after first paint.
   */
  collapsedGroups: Record<string, boolean>;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  initGroupCollapsed: (groupId: string, defaultCollapsed: boolean) => void;
  toggleGroupCollapsed: (groupId: string) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({
      sidebarOpen: true,
      mobileDrawerOpen: false,
      collapsedGroups: {},
      setSidebarOpen: (open: boolean) => {
        setSidebarCookie(open);
        set({ sidebarOpen: open });
      },
      toggleSidebar: () => {
        set(state => {
          const next = !state.sidebarOpen;
          setSidebarCookie(next);
          return { sidebarOpen: next };
        });
      },
      toggleMobileDrawer: () => {
        set(state => ({ mobileDrawerOpen: !state.mobileDrawerOpen }));
      },
      closeMobileDrawer: () => {
        set({ mobileDrawerOpen: false });
      },
      initGroupCollapsed: (groupId: string, defaultCollapsed: boolean) => {
        set(state => {
          if (Object.hasOwn(state.collapsedGroups, groupId)) {
            return {};
          }
          return { collapsedGroups: { ...state.collapsedGroups, [groupId]: defaultCollapsed } };
        });
      },
      toggleGroupCollapsed: (groupId: string) => {
        set(state => {
          const current = state.collapsedGroups[groupId] ?? false;
          return { collapsedGroups: { ...state.collapsedGroups, [groupId]: !current } };
        });
      },
    }),
    {
      name: "layout-storage",
    }
  )
);
