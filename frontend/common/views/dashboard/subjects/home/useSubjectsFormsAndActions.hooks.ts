"use client";

import { useCategoryFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useCategoryFormState";
import { useSubjectFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useSubjectFormState";
import { buildActionHandlers } from "@/frontend/common/views/dashboard/subjects/home/subjectsActions";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";

type SubjectFormState = ReturnType<typeof useSubjectFormState>;
type CategoryFormState = ReturnType<typeof useCategoryFormState>;

interface SubjectsFormAndActionsStore {
  readonly createSubjectDialogOpen: boolean;
  readonly editSubjectDialogOpen: boolean;
  readonly createCategoryDialogOpen: boolean;
  readonly editCategoryDialogOpen: boolean;
  readonly openCreateDialog: (target: "subject" | "category") => void;
  readonly openEditDialog: (id: string, target: "subject" | "category") => void;
  readonly openDeleteDialog: (id: string, target: "subject" | "category") => void;
}

interface SubjectsFormAndActionsResult {
  readonly createSubjectForm: SubjectFormState;
  readonly editSubjectForm: SubjectFormState;
  readonly createCategoryForm: CategoryFormState;
  readonly editCategoryForm: CategoryFormState;
  readonly subjectActions: ReturnType<typeof buildActionHandlers>;
  readonly categoryActions: ReturnType<typeof buildActionHandlers>;
}

export function useSubjectsFormsAndActions(
  store: SubjectsFormAndActionsStore,
  selectedSubject: SubjectItem | null,
  selectedCategory: CategoryItem | null,
  canManageSubjects: boolean,
  canManageCategories: boolean
): SubjectsFormAndActionsResult {
  const createSubjectForm = useSubjectFormState({ open: store.createSubjectDialogOpen, subject: null });
  const editSubjectForm = useSubjectFormState({ open: store.editSubjectDialogOpen, subject: selectedSubject });
  const createCategoryForm = useCategoryFormState({ open: store.createCategoryDialogOpen, category: null });
  const editCategoryForm = useCategoryFormState({ open: store.editCategoryDialogOpen, category: selectedCategory });

  const subjectActions = buildActionHandlers(
    canManageSubjects,
    () => store.openCreateDialog("subject"),
    (id: string) => store.openEditDialog(id, "subject"),
    (id: string) => store.openDeleteDialog(id, "subject")
  );

  const categoryActions = buildActionHandlers(
    canManageCategories,
    () => store.openCreateDialog("category"),
    (id: string) => store.openEditDialog(id, "category"),
    (id: string) => store.openDeleteDialog(id, "category")
  );

  return {
    createSubjectForm,
    editSubjectForm,
    createCategoryForm,
    editCategoryForm,
    subjectActions,
    categoryActions,
  };
}
