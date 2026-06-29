"use client";

import { useSubjectManagementStore } from "@/frontend/stores/subjectManagementStore";
import type { CategoryItem, SubjectItem } from "../types";
import { useSubjectMutations } from "../useSubjectMutations";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { CreateSubjectDialog } from "./CreateSubjectDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { DeleteSubjectDialog } from "./DeleteSubjectDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { EditSubjectDialog } from "./EditSubjectDialog";

interface SubjectDialogsProps {
  categories: readonly CategoryItem[];
  selectedSubject: SubjectItem | null;
  selectedCategory: CategoryItem | null;
  pendingDeleteSubject: SubjectItem | null;
  pendingDeleteCategory: CategoryItem | null;
  refetchSubjects: () => Promise<unknown>;
  activeCategoryId: string | null;
  onCategoryReset: () => void;
}

export function SubjectDialogs({
  categories,
  selectedSubject,
  selectedCategory,
  pendingDeleteSubject,
  pendingDeleteCategory,
  refetchSubjects,
  activeCategoryId,
  onCategoryReset,
}: Readonly<SubjectDialogsProps>) {
  const store = useSubjectManagementStore();
  const isSubject = store.dialogTarget === "subject";
  const isCategory = store.dialogTarget === "category";

  const mutations = useSubjectMutations({
    refetchSubjects,
    activeCategoryId,
    onCategoryReset,
  });

  return (
    <>
      <CreateSubjectDialog
        open={store.isCreateDialogOpen && isSubject}
        onClose={store.closeCreateDialog}
        onSubmit={mutations.handleCreateSubject}
        categories={categories}
        isLoading={mutations.isCreatingSubject}
      />

      <EditSubjectDialog
        open={store.isEditDialogOpen && isSubject}
        onClose={store.closeEditDialog}
        onSubmit={mutations.handleUpdateSubject}
        subject={selectedSubject}
        categories={categories}
        isLoading={mutations.isUpdatingSubject}
      />

      <DeleteSubjectDialog
        open={store.isDeleteDialogOpen && isSubject}
        onClose={store.closeDeleteDialog}
        onConfirm={mutations.handleDeleteSubject}
        subjectName={pendingDeleteSubject?.name ?? ""}
        isLoading={mutations.isDeletingSubject}
      />

      <CreateCategoryDialog
        open={store.isCreateDialogOpen && isCategory}
        onClose={store.closeCreateDialog}
        onSubmit={mutations.handleCreateCategory}
        isLoading={mutations.isCreatingCategory}
      />

      <EditCategoryDialog
        open={store.isEditDialogOpen && isCategory}
        onClose={store.closeEditDialog}
        onSubmit={mutations.handleUpdateCategory}
        category={selectedCategory}
        isLoading={mutations.isUpdatingCategory}
      />

      <DeleteCategoryDialog
        open={store.isDeleteDialogOpen && isCategory}
        onClose={store.closeDeleteDialog}
        onConfirm={mutations.handleDeleteCategory}
        categoryName={pendingDeleteCategory?.name ?? ""}
        isLoading={mutations.isDeletingCategory}
      />
    </>
  );
}
