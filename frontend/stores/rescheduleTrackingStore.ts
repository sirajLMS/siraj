import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

interface RescheduleTrackingState {
  readonly page: number;
  readonly pageSize: number;
  readonly setPage: (page: number) => void;
}

export const useRescheduleTrackingStore = create<RescheduleTrackingState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: page => set({ page }),
}));
