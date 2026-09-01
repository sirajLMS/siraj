import { create } from "zustand";

export type ProfileTab = "overview" | "courses" | "settings" | "students" | "classes";

interface ProfileTabStore {
  currentTab: ProfileTab;
  setTab: (tab: ProfileTab) => void;
}

export const useProfileTabStore = create<ProfileTabStore>(set => ({
  currentTab: "overview",
  setTab: tab => set({ currentTab: tab }),
}));
