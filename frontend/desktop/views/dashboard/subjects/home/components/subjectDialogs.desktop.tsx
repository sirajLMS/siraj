"use client";

import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import { CreateCategoryDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/createCategoryDialog.desktop";
import { CreateSubjectDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/createSubjectDialog.desktop";
import { DeleteCategoryDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/deleteCategoryDialog.desktop";
import { DeleteSubjectDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/deleteSubjectDialog.desktop";
import { EditCategoryDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/editCategoryDialog.desktop";
import { EditSubjectDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/editSubjectDialog.desktop";

interface SubjectDialogsDesktopProps {
  readonly categories: readonly CategoryItem[];
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
  readonly pendingDeleteSubject: SubjectItem | null;
  readonly pendingDeleteCategory: CategoryItem | null;
  readonly refetchSubjects: () => Promise<unknown>;
  readonly activeCategoryId: string | null;
  readonly onCategoryReset: () => void;
}

/**
 * SubjectDialogsDesktop — composes the desktop-tier create/edit/delete dialogs
 * for both subjects and categories. Stays in `SubjectsContainer.tsx` (common)
 * as a tier-neutral orchestrator's child.
 */
export function SubjectDialogsDesktop({
  categories,
  selectedSubject,
  selectedCategory,
  pendingDeleteSubject,
  pendingDeleteCategory,
  refetchSubjects,
  activeCategoryId,
  onCategoryReset,
}: Readonly<SubjectDialogsDesktopProps>) {
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
      <CreateSubjectDialogDesktop
        open={store.isCreateDialogOpen && isSubject}
        onClose={store.closeCreateDialog}
        onSubmit={mutations.handleCreateSubject}
        categories={categories}
        isLoading={mutations.isCreatingSubject}
      />

      <EditSubjectDialogDesktop
        open={store.isEditDialogOpen && isSubject}
        onClose={store.closeEditDialog}
        onSubmit={mutations.handleUpdateSubject}
        subject={selectedSubject}
        categories={categories}
        isLoading={mutations.isUpdatingSubject}
      />

      <DeleteSubjectDialogDesktop
        open={store.isDeleteDialogOpen && isSubject}
        onClose={store.closeDeleteDialog}
        onConfirm={mutations.handleDeleteSubject}
        subjectName={pendingDeleteSubject?.name ?? ""}
        isLoading={mutations.isDeletingSubject}
      />

      <CreateCategoryDialogDesktop
        open={store.isCreateDialogOpen && isCategory}
        onClose={store.closeCreateDialog}
        onSubmit={mutations.handleCreateCategory}
        isLoading={mutations.isCreatingCategory}
      />

      <EditCategoryDialogDesktop
        open={store.isEditDialogOpen && isCategory}
        onClose={store.closeEditDialog}
        onSubmit={mutations.handleUpdateCategory}
        category={selectedCategory}
        isLoading={mutations.isUpdatingCategory}
      />

      <DeleteCategoryDialogDesktop
        open={store.isDeleteDialogOpen && isCategory}
        onClose={store.closeDeleteDialog}
        onConfirm={mutations.handleDeleteCategory}
        categoryName={pendingDeleteCategory?.name ?? ""}
        isLoading={mutations.isDeletingCategory}
      />
    </>
  );
}
