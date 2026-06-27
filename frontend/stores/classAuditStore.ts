import { create } from "zustand";

interface ClassAuditUiState {
  readonly noteDialogOpen: boolean;
  setNoteDialogOpen: (open: boolean) => void;
}

export const useClassAuditStore = create<ClassAuditUiState>(set => ({
  noteDialogOpen: false,
  setNoteDialogOpen: (open: boolean) => set({ noteDialogOpen: open }),
}));
