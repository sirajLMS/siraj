import { create } from "zustand";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";

interface SiteContentSettingsUiState {
  readonly formOpen: boolean;
  readonly editRow: SiteContentRow | null;
  readonly deleteRow: SiteContentRow | null;
  readonly togglingPublishId: string | null;
  readonly openCreateForm: () => void;
  readonly openEditForm: (row: SiteContentRow) => void;
  readonly closeForm: () => void;
  readonly openDeleteDialog: (row: SiteContentRow) => void;
  readonly closeDeleteDialog: () => void;
  readonly setTogglingPublishId: (id: string | null) => void;
  readonly reset: () => void;
}

const initialState = {
  formOpen: false,
  editRow: null as SiteContentRow | null,
  deleteRow: null as SiteContentRow | null,
  togglingPublishId: null as string | null,
};

export const useSiteContentSettingsStore = create<SiteContentSettingsUiState>(set => ({
  ...initialState,
  openCreateForm: () => set({ editRow: null, formOpen: true }),
  openEditForm: row => set({ editRow: row, formOpen: true }),
  closeForm: () => set({ formOpen: false, editRow: null }),
  openDeleteDialog: row => set({ deleteRow: row }),
  closeDeleteDialog: () => set({ deleteRow: null }),
  setTogglingPublishId: togglingPublishId => set({ togglingPublishId }),
  reset: () => set(initialState),
}));
