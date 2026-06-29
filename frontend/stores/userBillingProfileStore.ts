import { create } from "zustand";
import {
  DEFAULT_PAGE_SIZE,
  type UserBillingProfileState,
} from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";

export const useUserBillingProfileStore = create<UserBillingProfileState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: (page: number) => set({ page }),
}));
