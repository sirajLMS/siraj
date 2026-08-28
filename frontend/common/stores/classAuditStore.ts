"use client";

import { create } from "zustand";

interface ClassAuditState {
  readonly adminNoteDialogOpen: boolean;
  readonly adminNoteDraft: string;
  setAdminNoteDialogOpen: (value: boolean) => void;
  setAdminNoteDraft: (value: string) => void;
  reset: () => void;
}

const initialState = {
  adminNoteDialogOpen: false,
  adminNoteDraft: "",
};

export const useClassAuditStore = create<ClassAuditState>()(set => ({
  ...initialState,
  setAdminNoteDialogOpen: (value: boolean) => set({ adminNoteDialogOpen: value }),
  setAdminNoteDraft: (value: string) => set({ adminNoteDraft: value }),
  reset: () => set(initialState),
}));
