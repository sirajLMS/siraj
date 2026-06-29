import { create } from "zustand";

export type DialogTarget = "subject" | "category" | null;

interface SubjectManagementState {
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  selectedId: string | null;
  isDeleteDialogOpen: boolean;
  pendingDeleteId: string | null;
  dialogTarget: DialogTarget;

  openCreateDialog: (target: DialogTarget) => void;
  closeCreateDialog: () => void;
  openEditDialog: (id: string, target: DialogTarget) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (id: string, target: DialogTarget) => void;
  closeDeleteDialog: () => void;
  reset: () => void;
}

const initialState = {
  isCreateDialogOpen: false,
  isEditDialogOpen: false,
  selectedId: null as string | null,
  isDeleteDialogOpen: false,
  pendingDeleteId: null as string | null,
  dialogTarget: null as DialogTarget,
};

export const useSubjectManagementStore = create<SubjectManagementState>(set => ({
  ...initialState,

  openCreateDialog: (target: DialogTarget) => set({ isCreateDialogOpen: true, dialogTarget: target }),
  closeCreateDialog: () => set({ isCreateDialogOpen: false, dialogTarget: null }),

  openEditDialog: (id: string, target: DialogTarget) =>
    set({ isEditDialogOpen: true, selectedId: id, dialogTarget: target }),
  closeEditDialog: () => set({ isEditDialogOpen: false, selectedId: null, dialogTarget: null }),

  openDeleteDialog: (id: string, target: DialogTarget) =>
    set({ isDeleteDialogOpen: true, pendingDeleteId: id, dialogTarget: target }),
  closeDeleteDialog: () => set({ isDeleteDialogOpen: false, pendingDeleteId: null, dialogTarget: null }),

  reset: () => set(initialState),
}));
