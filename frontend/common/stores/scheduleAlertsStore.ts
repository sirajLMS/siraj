"use client";

import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

export interface ScheduleAlertsState {
  readonly page: number;
  readonly pageSize: number;
  setPage: (page: number) => void;
}

export const useScheduleAlertsStore = create<ScheduleAlertsState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: page => set({ page }),
}));
