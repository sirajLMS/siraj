"use client";

import { create } from "zustand";
import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";

const DEFAULT_PAGE_SIZE = 10;

export interface RescheduleTrackingState {
  readonly page: number;
  readonly pageSize: number;
  readonly statusFilter: LeaveRequestStatus | null;
  readonly setPage: (page: number) => void;
  readonly setStatusFilter: (filter: LeaveRequestStatus | null) => void;
}

export const useRescheduleTrackingStore = create<RescheduleTrackingState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  statusFilter: null,
  setPage: page => set({ page }),
  setStatusFilter: filter => set({ statusFilter: filter, page: 0 }),
}));
