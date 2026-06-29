import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

interface UserBillingProfileState {
  readonly page: number;
  readonly pageSize: number;
  setPage: (page: number) => void;
}

export const useUserBillingProfileStore = create<UserBillingProfileState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: (page: number) => set({ page }),
}));
