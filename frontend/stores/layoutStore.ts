import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutState {
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({
      sidebarOpen: true,
      mobileDrawerOpen: false,
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
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
