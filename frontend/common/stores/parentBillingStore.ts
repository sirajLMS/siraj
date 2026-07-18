import { create } from "zustand";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";

const DEFAULT_PAGE_SIZE = 10;

export interface ParentBillingState {
  readonly page: number;
  readonly pageSize: number;
  readonly searchQuery: string;
  readonly debouncedSearch: string;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error" | "info";
  // NEW FOR PLAN v5 (parent-billing wave): proof dialog target owned by the
  // store so it survives tier switches (per specs.md §6.2 + §6.4).
  readonly proofTarget: MarkPaidInvoiceTarget | null;
  // NEW FOR PLAN v5 (parent-billing wave): payment details dialog target
  // owned by the store so it survives tier switches (per specs.md §6.4).
  readonly detailsTarget: PaymentDetailsTarget | null;
  readonly setPage: (page: number) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setDebouncedSearch: (value: string) => void;
  readonly showFeedback: (message: string, severity: "success" | "error" | "info") => void;
  readonly closeSnackbar: () => void;
  // NEW FOR PLAN v5 (parent-billing wave): proof dialog setter (per §6.4).
  readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
  // NEW FOR PLAN v5 (parent-billing wave): payment details dialog setter.
  readonly setDetailsTarget: (target: PaymentDetailsTarget | null) => void;
}

export const useParentBillingStore = create<ParentBillingState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  searchQuery: "",
  debouncedSearch: "",
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "success",
  proofTarget: null,
  detailsTarget: null,
  setPage: page => set({ page }),
  setSearchQuery: query => set({ searchQuery: query }),
  setDebouncedSearch: value => set({ debouncedSearch: value }),
  showFeedback: (message, severity) =>
    set({ snackbarOpen: true, snackbarMessage: message, snackbarSeverity: severity }),
  closeSnackbar: () => set({ snackbarOpen: false }),
  setProofTarget: target => set({ proofTarget: target }),
  setDetailsTarget: target => set({ detailsTarget: target }),
}));
