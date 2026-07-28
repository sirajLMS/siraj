import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSidebarCookie } from "@/frontend/common/lib/sidebar-detection";

interface LayoutState {
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({
      sidebarOpen: true,
      mobileDrawerOpen: false,
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
    }),
    {
      name: "layout-storage",
    }
  )
);
