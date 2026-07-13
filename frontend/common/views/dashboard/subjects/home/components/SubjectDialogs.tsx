"use client";

import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { CreateCategoryDialog } from "@/frontend/common/views/dashboard/subjects/home/components/CreateCategoryDialog";
import { CreateSubjectDialog } from "@/frontend/common/views/dashboard/subjects/home/components/CreateSubjectDialog";
import { DeleteCategoryDialog } from "@/frontend/common/views/dashboard/subjects/home/components/DeleteCategoryDialog";
import { DeleteSubjectDialog } from "@/frontend/common/views/dashboard/subjects/home/components/DeleteSubjectDialog";
import { EditCategoryDialog } from "@/frontend/common/views/dashboard/subjects/home/components/EditCategoryDialog";
import { EditSubjectDialog } from "@/frontend/common/views/dashboard/subjects/home/components/EditSubjectDialog";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";

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
