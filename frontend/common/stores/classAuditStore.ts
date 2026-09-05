"use client";

import { create } from "zustand";

interface ClassAuditState {
  readonly adminNoteDialogOpen: boolean;
  readonly adminNoteDraft: string;
  readonly overrideDialogOpen: boolean;
  setAdminNoteDialogOpen: (value: boolean) => void;
  setAdminNoteDraft: (value: string) => void;
  setOverrideDialogOpen: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  adminNoteDialogOpen: false,
  adminNoteDraft: "",
  overrideDialogOpen: false,
};

export const useClassAuditStore = create<ClassAuditState>()(set => ({
  ...initialState,
  setAdminNoteDialogOpen: (value: boolean) => set({ adminNoteDialogOpen: value }),
  setAdminNoteDraft: (value: string) => set({ adminNoteDraft: value }),
  setOverrideDialogOpen: (value: boolean) => set({ overrideDialogOpen: value }),
  reset: () => set(initialState),
}));
