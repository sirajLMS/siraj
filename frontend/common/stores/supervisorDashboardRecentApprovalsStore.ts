"use client";

import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 5;

interface SupervisorDashboardRecentApprovalsState {
  readonly page: number;
  readonly pageSize: number;
  readonly setPage: (page: number) => void;
}

export const useSupervisorDashboardRecentApprovalsStore = create<SupervisorDashboardRecentApprovalsState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: page => set({ page }),
}));
