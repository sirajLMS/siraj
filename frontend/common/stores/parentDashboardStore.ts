"use client";

import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

interface ParentDashboardState {
  readonly page: number;
  readonly pageSize: number;
  readonly scheduleTotalCount: number;
  setPage: (page: number) => void;
  setScheduleTotalCount: (count: number) => void;
}

export const useParentDashboardStore = create<ParentDashboardState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  scheduleTotalCount: 0,
  setPage: page => set({ page }),
  setScheduleTotalCount: scheduleTotalCount => set({ scheduleTotalCount }),
}));
