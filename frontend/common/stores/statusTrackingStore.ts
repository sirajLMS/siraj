import { create } from "zustand";
import { getTodayScheduleFilterDate } from "@/frontend/common/utils/scheduleFilterDate";

export interface StatusTrackingUIState {
  readonly selectedDate: string;
  readonly setSelectedDate: (date: string) => void;
}

export const useStatusTrackingStore = create<StatusTrackingUIState>(set => ({
  selectedDate: getTodayScheduleFilterDate(),
  setSelectedDate: selectedDate => set({ selectedDate }),
}));
