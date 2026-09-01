import { create } from "zustand";

interface ProfileTabStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useProfileTabStore = create<ProfileTabStore>(set => ({
  activeTab: "profile",
  setActiveTab: (tab: string) => set({ activeTab: tab }),
}));
