"use client";

// NEW FOR PLAN v5 (newly created for the migration wave): Zustand store for the
// Manual Invoice screen's UI state — owns the parent picker value, the
// student-options derivation flag, submission lifecycle flag, and success
// banner visibility. Per specs.md §6.4 the ViewModel is the SOLE owner of
// state and flows plain values + callbacks down to tier views. Per
// `frontend/common/stores/AGENTS.md` no non-serializable values live here.

import { create } from "zustand";

export interface ManualInvoiceUiState {
  // NEW FOR PLAN v5 (manual-invoice wave): currently selected parent id from
  // the parent-autocomplete. Drives the student options fetch (per §6.2).
  readonly selectedParentId: string | null;
  // NEW FOR PLAN v5 (manual-invoice wave): mutation pending flag exposed as
  // `isSubmitting` to the tier views (per §6.2).
  readonly isSubmitting: boolean;
  // NEW FOR PLAN v5 (manual-invoice wave): success banner visibility, owned
  // by the store so it survives tier switches (per §6.4).
  readonly showSuccess: boolean;
  readonly setSelectedParentId: (parentId: string | null) => void;
  readonly setIsSubmitting: (isSubmitting: boolean) => void;
  readonly setShowSuccess: (showSuccess: boolean) => void;
  // NEW FOR PLAN v5 (manual-invoice wave): dismiss-success handler delegates
  // to the store so the banner auto-dismiss state lives in common (per §6.4).
  readonly dismissSuccess: () => void;
  // NEW FOR PLAN v5 (manual-invoice wave): reset all UI state when the form
  // unmounts or after a successful submit (per §6.4).
  readonly reset: () => void;
}

export const useManualInvoiceUiStore = create<ManualInvoiceUiState>(set => ({
  selectedParentId: null,
  isSubmitting: false,
  showSuccess: false,
  setSelectedParentId: parentId => set({ selectedParentId: parentId }),
  setIsSubmitting: isSubmitting => set({ isSubmitting }),
  setShowSuccess: showSuccess => set({ showSuccess }),
  dismissSuccess: () => set({ showSuccess: false }),
  reset: () => set({ selectedParentId: null, isSubmitting: false, showSuccess: false }),
}));
