import { create } from "zustand";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";

interface GeneralSettingsUiState {
  readonly formOpen: boolean;
  readonly editRow: SystemSettingRow | null;
  readonly deleteRow: SystemSettingRow | null;
  readonly openCreateForm: () => void;
  readonly openEditForm: (row: SystemSettingRow) => void;
  readonly closeForm: () => void;
  readonly openDeleteDialog: (row: SystemSettingRow) => void;
  readonly closeDeleteDialog: () => void;
  readonly reset: () => void;
}

const initialState = {
  formOpen: false,
  editRow: null as SystemSettingRow | null,
  deleteRow: null as SystemSettingRow | null,
};

export const useGeneralSettingsStore = create<GeneralSettingsUiState>(set => ({
  ...initialState,
  openCreateForm: () => set({ editRow: null, formOpen: true }),
  openEditForm: row => set({ editRow: row, formOpen: true }),
  closeForm: () => set({ formOpen: false, editRow: null }),
  openDeleteDialog: row => set({ deleteRow: row }),
  closeDeleteDialog: () => set({ deleteRow: null }),
  reset: () => set(initialState),
}));
