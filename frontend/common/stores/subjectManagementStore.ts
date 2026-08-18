"use client";

import { create } from "zustand";

export type DialogTarget = "subject" | "category" | null;

interface SubjectManagementState {
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  selectedId: string | null;
  isDeleteDialogOpen: boolean;
  pendingDeleteId: string | null;
  dialogTarget: DialogTarget;
  categoriesSectionOpen: boolean;

  // NEW FOR PLAN v5: per-spec §6.4 named dialog-open flags. The pre-existing
  // `isCreateDialogOpen` / `isEditDialogOpen` fields are target-polymorphic
  // (they fire for either subject OR category depending on `dialogTarget`).
  // The new flags below are the explicit per-dialog booleans consumed by the
  // lifted form-state hooks in `useSubjectsViewModel` so each form instance
  // can subscribe to its own open/close state without re-deriving from
  // `dialogTarget`.
  createSubjectDialogOpen: boolean;
  editSubjectDialogOpen: boolean;
  createCategoryDialogOpen: boolean;
  editCategoryDialogOpen: boolean;

  openCreateDialog: (target: DialogTarget) => void;
  closeCreateDialog: () => void;
  openEditDialog: (id: string, target: DialogTarget) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (id: string, target: DialogTarget) => void;
  closeDeleteDialog: () => void;
  toggleCategoriesSection: () => void;
  reset: () => void;

  // NEW FOR PLAN v5: explicit open/close setters for the four per-dialog flags
  // so the ViewModel can drive each dialog independently of the polymorphic
  // create/edit pair.
  setCreateSubjectDialogOpen: (open: boolean) => void;
  setEditSubjectDialogOpen: (open: boolean) => void;
  setCreateCategoryDialogOpen: (open: boolean) => void;
  setEditCategoryDialogOpen: (open: boolean) => void;
}

const initialState = {
  isCreateDialogOpen: false,
  isEditDialogOpen: false,
  selectedId: null as string | null,
  isDeleteDialogOpen: false,
  pendingDeleteId: null as string | null,
  dialogTarget: null as DialogTarget,
  categoriesSectionOpen: false,
  // NEW FOR PLAN v5: initial values for the named per-dialog open flags.
  createSubjectDialogOpen: false,
  editSubjectDialogOpen: false,
  createCategoryDialogOpen: false,
  editCategoryDialogOpen: false,
};

export const useSubjectManagementStore = create<SubjectManagementState>(set => ({
  ...initialState,

  openCreateDialog: (target: DialogTarget) => {
    set({ isCreateDialogOpen: true, dialogTarget: target });
    // NEW FOR PLAN v5: mirror the polymorphic open into the named per-dialog
    // flag so subscribers using the new fields see the change.
    if (target === "subject") set({ createSubjectDialogOpen: true });
    if (target === "category") set({ createCategoryDialogOpen: true });
  },
  closeCreateDialog: () => {
    set({
      isCreateDialogOpen: false,
      dialogTarget: null,
      createSubjectDialogOpen: false,
      createCategoryDialogOpen: false,
    });
  },

  openEditDialog: (id: string, target: DialogTarget) => {
    set({ isEditDialogOpen: true, selectedId: id, dialogTarget: target });
    // NEW FOR PLAN v5: mirror the polymorphic open into the named per-dialog
    // flag so subscribers using the new fields see the change.
    if (target === "subject") set({ editSubjectDialogOpen: true });
    if (target === "category") set({ editCategoryDialogOpen: true });
  },
  closeEditDialog: () => {
    set({
      isEditDialogOpen: false,
      selectedId: null,
      dialogTarget: null,
      editSubjectDialogOpen: false,
      editCategoryDialogOpen: false,
    });
  },

  openDeleteDialog: (id: string, target: DialogTarget) =>
    set({ isDeleteDialogOpen: true, pendingDeleteId: id, dialogTarget: target }),
  closeDeleteDialog: () => set({ isDeleteDialogOpen: false, pendingDeleteId: null, dialogTarget: null }),

  toggleCategoriesSection: () => set(state => ({ categoriesSectionOpen: !state.categoriesSectionOpen })),

  // NEW FOR PLAN v5: explicit per-dialog open/close setters.
  setCreateSubjectDialogOpen: open => set({ createSubjectDialogOpen: open }),
  setEditSubjectDialogOpen: open => set({ editSubjectDialogOpen: open }),
  setCreateCategoryDialogOpen: open => set({ createCategoryDialogOpen: open }),
  setEditCategoryDialogOpen: open => set({ editCategoryDialogOpen: open }),

  reset: () => set(initialState),
}));
