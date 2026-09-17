"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSidebarCookie } from "@/frontend/common/lib/sidebar-detection";

interface LayoutState {
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  /**
   * Per-group collapse state, keyed by `NavGroup.id`. `true` means the group
   * is collapsed (items hidden, header visible). Holds explicit user toggles
   * plus any `defaultCollapsed` values seeded by `initGroupCollapsed` during
   * the current session — never persisted directly, so a nav-config default
   * change is not frozen into localStorage.
   */
  collapsedGroups: Record<string, boolean>;
  /**
   * Per-group collapse state the user explicitly toggled, keyed by
   * `NavGroup.id`. This is the only collapse map that is persisted; entries
   * here always win over `defaultCollapsed` on rehydration.
   */
  userCollapsedGroups: Record<string, boolean>;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  initGroupCollapsed: (groupId: string, defaultCollapsed: boolean) => void;
  toggleGroupCollapsed: (groupId: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBooleanRecord(value: unknown): Record<string, boolean> | null {
  if (!isRecord(value)) return null;
  const result: Record<string, boolean> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "boolean") return null;
    result[key] = entry;
  }
  return result;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({
      sidebarOpen: true,
      mobileDrawerOpen: false,
      collapsedGroups: {},
      userCollapsedGroups: {},
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
          const next = !current;
          return {
            collapsedGroups: { ...state.collapsedGroups, [groupId]: next },
            userCollapsedGroups: { ...state.userCollapsedGroups, [groupId]: next },
          };
        });
      },
    }),
    {
      name: "layout-storage",
      partialize: state => ({
        sidebarOpen: state.sidebarOpen,
        collapsedGroups: state.userCollapsedGroups,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        const userCollapsedGroups = readBooleanRecord(persisted.collapsedGroups) ?? {};
        const sidebarOpen =
          typeof persisted.sidebarOpen === "boolean" ? persisted.sidebarOpen : currentState.sidebarOpen;
        return {
          ...currentState,
          sidebarOpen,
          collapsedGroups: { ...userCollapsedGroups },
          userCollapsedGroups: { ...userCollapsedGroups },
        };
      },
    }
  )
);
