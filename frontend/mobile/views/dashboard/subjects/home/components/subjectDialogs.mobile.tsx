"use client";

import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import { CreateCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/createCategoryDialog.mobile";
import { CreateSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/createSubjectDialog.mobile";
import { DeleteCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/deleteCategoryDialog.mobile";
import { DeleteSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/deleteSubjectDialog.mobile";
import { EditCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/editCategoryDialog.mobile";
import { EditSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/editSubjectDialog.mobile";

interface SubjectDialogsMobileProps {
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
 * SubjectDialogsMobile — composes the mobile-tier create/edit/delete dialogs
 * for both subjects and categories. Stays in `SubjectsContainer.tsx` (common)
 * as a tier-neutral orchestrator's child.
 */
export function SubjectDialogsMobile({
  categories,
  selectedSubject,
  selectedCategory,
  pendingDeleteSubject,
  pendingDeleteCategory,
  refetchSubjects,
  activeCategoryId,
  onCategoryReset,
}: Readonly<SubjectDialogsMobileProps>) {
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
      <CreateSubjectDialogMobile
        open={store.isCreateDialogOpen && isSubject}
        onClose={store.closeCreateDialog}
        onSubmit={mutations.handleCreateSubject}
        categories={categories}
        isLoading={mutations.isCreatingSubject}
      />

      <EditSubjectDialogMobile
        open={store.isEditDialogOpen && isSubject}
        onClose={store.closeEditDialog}
        onSubmit={mutations.handleUpdateSubject}
        subject={selectedSubject}
        categories={categories}
        isLoading={mutations.isUpdatingSubject}
      />

      <DeleteSubjectDialogMobile
        open={store.isDeleteDialogOpen && isSubject}
        onClose={store.closeDeleteDialog}
        onConfirm={mutations.handleDeleteSubject}
        subjectName={pendingDeleteSubject?.name ?? ""}
        isLoading={mutations.isDeletingSubject}
      />

      <CreateCategoryDialogMobile
        open={store.isCreateDialogOpen && isCategory}
        onClose={store.closeCreateDialog}
        onSubmit={mutations.handleCreateCategory}
        isLoading={mutations.isCreatingCategory}
      />

      <EditCategoryDialogMobile
        open={store.isEditDialogOpen && isCategory}
        onClose={store.closeEditDialog}
        onSubmit={mutations.handleUpdateCategory}
        category={selectedCategory}
        isLoading={mutations.isUpdatingCategory}
      />

      <DeleteCategoryDialogMobile
        open={store.isDeleteDialogOpen && isCategory}
        onClose={store.closeDeleteDialog}
        onConfirm={mutations.handleDeleteCategory}
        categoryName={pendingDeleteCategory?.name ?? ""}
        isLoading={mutations.isDeletingCategory}
      />
    </>
  );
}
