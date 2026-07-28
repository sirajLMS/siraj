import { create } from "zustand";
import type { SessionConfigRow } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";

interface SessionConfigSettingsUiState {
  readonly formOpen: boolean;
  readonly editRow: SessionConfigRow | null;
  readonly deleteRow: SessionConfigRow | null;
  readonly openCreateForm: () => void;
  readonly openEditForm: (row: SessionConfigRow) => void;
  readonly closeForm: () => void;
  readonly openDeleteDialog: (row: SessionConfigRow) => void;
  readonly closeDeleteDialog: () => void;
  readonly reset: () => void;
}

const initialState = {
  formOpen: false,
  editRow: null as SessionConfigRow | null,
  deleteRow: null as SessionConfigRow | null,
};

export const useSessionConfigSettingsStore = create<SessionConfigSettingsUiState>(set => ({
  ...initialState,
  openCreateForm: () => set({ editRow: null, formOpen: true }),
  openEditForm: row => set({ editRow: row, formOpen: true }),
  closeForm: () => set({ formOpen: false, editRow: null }),
  openDeleteDialog: row => set({ deleteRow: row }),
  closeDeleteDialog: () => set({ deleteRow: null }),
  reset: () => set(initialState),
}));
