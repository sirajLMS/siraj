import { create } from "zustand";
import type {
  CreditFilter,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";

const DEFAULT_PAGE_SIZE = 10;

export interface AdminBillingState {
  readonly page: number;
  readonly pageSize: number;
  readonly searchQuery: string;
  readonly debouncedSearch: string;
  readonly creditFilter: CreditFilter;
  readonly proofTarget: MarkPaidInvoiceTarget | null;
  readonly detailsTarget: PaymentDetailsTarget | null;
  readonly deleteTargetId: string | null;
  readonly sendingReminderId: string | null;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  setPage: (page: number) => void;
  setSearchQuery: (value: string) => void;
  setDebouncedSearch: (value: string) => void;
  setCreditFilter: (filter: CreditFilter) => void;
  setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
  setDetailsTarget: (target: PaymentDetailsTarget | null) => void;
  setDeleteTargetId: (id: string | null) => void;
  setSendingReminderId: (id: string | null) => void;
  setSnackbarOpen: (open: boolean) => void;
  showFeedback: (message: string, severity: "success" | "error") => void;
  resetDialogs: () => void;
}

export const useAdminBillingStore = create<AdminBillingState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  searchQuery: "",
  debouncedSearch: "",
  creditFilter: "all",
  proofTarget: null,
  detailsTarget: null,
  deleteTargetId: null,
  sendingReminderId: null,
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "success",
  setPage: page => set({ page }),
  setSearchQuery: value => set({ searchQuery: value }),
  setDebouncedSearch: value => set({ debouncedSearch: value }),
  setCreditFilter: filter => set({ creditFilter: filter }),
  setProofTarget: target => set({ proofTarget: target }),
  setDetailsTarget: target => set({ detailsTarget: target }),
  setDeleteTargetId: id => set({ deleteTargetId: id }),
  setSendingReminderId: id => set({ sendingReminderId: id }),
  setSnackbarOpen: open => set({ snackbarOpen: open }),
  showFeedback: (message, severity) =>
    set({ snackbarMessage: message, snackbarSeverity: severity, snackbarOpen: true }),
  resetDialogs: () => set({ proofTarget: null, detailsTarget: null, deleteTargetId: null }),
}));
