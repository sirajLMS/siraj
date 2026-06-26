import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

interface AdminBillingState {
  readonly page: number;
  readonly pageSize: number;
  setPage: (page: number) => void;
}

export const useAdminBillingStore = create<AdminBillingState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: page => set({ page }),
}));