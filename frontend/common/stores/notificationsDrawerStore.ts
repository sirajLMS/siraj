import { create } from "zustand";

interface NotificationsDrawerState {
  readonly drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useNotificationsDrawerStore = create<NotificationsDrawerState>(set => ({
  drawerOpen: false,
  setDrawerOpen: drawerOpen => set({ drawerOpen }),
  toggleDrawer: () => set(s => ({ drawerOpen: !s.drawerOpen })),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));
