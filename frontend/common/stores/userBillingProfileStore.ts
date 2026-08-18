"use client";

import { create } from "zustand";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";

const DEFAULT_PAGE_SIZE = 10;

export interface UserBillingProfileState {
  readonly page: number;
  readonly pageSize: number;
  readonly searchQuery: string;
  readonly debouncedSearch: string;
  readonly proofTarget: MarkPaidInvoiceTarget | null;
  readonly detailsTarget: PaymentDetailsTarget | null;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: SnackbarSeverity;
  readonly setPage: (page: number) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setDebouncedSearch: (value: string) => void;
  readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
  readonly setDetailsTarget: (target: PaymentDetailsTarget | null) => void;
  readonly showFeedback: (message: string, severity: SnackbarSeverity) => void;
  readonly closeSnackbar: () => void;
}

export { DEFAULT_PAGE_SIZE };

export const useUserBillingProfileStore = create<UserBillingProfileState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  searchQuery: "",
  debouncedSearch: "",
  proofTarget: null,
  detailsTarget: null,
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "success",
  setPage: page => set({ page }),
  setSearchQuery: query => set({ searchQuery: query }),
  setDebouncedSearch: value => set({ debouncedSearch: value }),
  setProofTarget: target => set({ proofTarget: target }),
  setDetailsTarget: target => set({ detailsTarget: target }),
  showFeedback: (message, severity) =>
    set({ snackbarOpen: true, snackbarMessage: message, snackbarSeverity: severity }),
  closeSnackbar: () => set({ snackbarOpen: false }),
}));
