import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

export interface ParentBillingState {
  readonly page: number;
  readonly pageSize: number;
  readonly searchQuery: string;
  readonly debouncedSearch: string;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error" | "info";
  readonly setPage: (page: number) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setDebouncedSearch: (value: string) => void;
  readonly showFeedback: (message: string, severity: "success" | "error" | "info") => void;
  readonly closeSnackbar: () => void;
}

export const useParentBillingStore = create<ParentBillingState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  searchQuery: "",
  debouncedSearch: "",
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "success",
  setPage: page => set({ page }),
  setSearchQuery: query => set({ searchQuery: query }),
  setDebouncedSearch: value => set({ debouncedSearch: value }),
  showFeedback: (message, severity) =>
    set({ snackbarOpen: true, snackbarMessage: message, snackbarSeverity: severity }),
  closeSnackbar: () => set({ snackbarOpen: false }),
}));
