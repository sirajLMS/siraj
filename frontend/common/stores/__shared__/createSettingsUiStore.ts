"use client";

import { create } from "zustand";

/**
 * Generic factory that builds a settings UI store with the standard
 * form-open / edit-row / delete-dialog pattern.
 *
 * Eliminates the duplicated store body between `generalSettingsStore.ts`
 * and `sessionConfigSettingsStore.ts` (and any future settings store
 * that follows the same pattern).
 *
 * @template TRow — the row type used for edit/delete operations
 */
export function createSettingsUiStore<TRow>() {
  interface SettingsUiState {
    readonly formOpen: boolean;
    readonly editRow: TRow | null;
    readonly deleteRow: TRow | null;
    readonly openCreateForm: () => void;
    readonly openEditForm: (row: TRow) => void;
    readonly closeForm: () => void;
    readonly openDeleteDialog: (row: TRow) => void;
    readonly closeDeleteDialog: () => void;
    readonly reset: () => void;
  }

  const initialState = {
    formOpen: false,
    editRow: null as TRow | null,
    deleteRow: null as TRow | null,
  };

  return create<SettingsUiState>(set => ({
    ...initialState,
    openCreateForm: () => set({ editRow: null, formOpen: true }),
    openEditForm: row => set({ editRow: row, formOpen: true }),
    closeForm: () => set({ formOpen: false, editRow: null }),
    openDeleteDialog: row => set({ deleteRow: row }),
    closeDeleteDialog: () => set({ deleteRow: null }),
    reset: () => set(initialState),
  }));
}
