import { create } from "zustand";

export interface FutureScheduleDateState {
  readonly selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const useFutureScheduleDateStore = create<FutureScheduleDateState>(set => ({
  selectedDate: new Date().toISOString().split("T")[0],
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
}));
