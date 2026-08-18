"use client";

import { create } from "zustand";
import type { SettingsTabId } from "@/frontend/common/views/dashboard/settings/types/settings.types";

interface SettingsState {
  readonly activeTab: SettingsTabId;
  readonly setActiveTab: (tab: SettingsTabId) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  activeTab: "general",
  setActiveTab: tab => set({ activeTab: tab }),
}));
