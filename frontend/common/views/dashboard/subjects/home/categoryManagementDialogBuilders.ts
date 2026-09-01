import type { useCategoryFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useCategoryFormState";
import type {
  CategoryFormStateProps,
  CategoryItem,
  CreateCategoryDialogProps,
  DeleteCategoryDialogProps,
  EditCategoryDialogProps,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import type { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import type { SubjectsLabels } from "@/shared/locale";

type CategoryFormState = ReturnType<typeof useCategoryFormState>;
type SubjectMutations = ReturnType<typeof useSubjectMutations>;

interface CategoryManagementStoreForDialogs {
  readonly createCategoryDialogOpen: boolean;
  readonly editCategoryDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly dialogTarget: "subject" | "category" | null;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
}

export interface BuildCategoryManagementDialogsParams {
  readonly store: CategoryManagementStoreForDialogs;
  readonly mutations: SubjectMutations;
  readonly selectedCategory: CategoryItem | null;
  readonly pendingDeleteCategory: CategoryItem | null;
  readonly createCategoryForm: CategoryFormState;
  readonly editCategoryForm: CategoryFormState;
  readonly labels: SubjectsDialogLabels;
  readonly shellLabels: SubjectsLabels;
}

export interface CategoryManagementDialogsResult {
  readonly createCategoryDialog: CreateCategoryDialogProps;
  readonly editCategoryDialog: EditCategoryDialogProps;
  readonly deleteCategoryDialog: DeleteCategoryDialogProps;
}

function toCategoryDialogFormBindings(form: CategoryFormState): CategoryFormStateProps {
  return {
    control: form.control,
    errors: form.errors,
    handleSubmit: form.handleSubmit,
    values: form.values,
    reset: form.reset,
  };
}

export function buildCategoryManagementDialogs(
  params: BuildCategoryManagementDialogsParams
): CategoryManagementDialogsResult {
  const {
    store,
    mutations,
    selectedCategory,
    pendingDeleteCategory,
    createCategoryForm,
    editCategoryForm,
    labels,
    shellLabels,
  } = params;

  return {
    createCategoryDialog: {
      open: store.createCategoryDialogOpen,
      onClose: store.closeCreateDialog,
      onSubmit: mutations.handleCreateCategory,
      isLoading: mutations.isCreatingCategory,
      form: toCategoryDialogFormBindings(createCategoryForm),
      labels,
    },
    editCategoryDialog: {
      open: store.editCategoryDialogOpen,
      onClose: store.closeEditDialog,
      onSubmit: mutations.handleUpdateCategory,
      category: selectedCategory,
      isLoading: mutations.isUpdatingCategory,
      form: toCategoryDialogFormBindings(editCategoryForm),
      labels,
    },
    deleteCategoryDialog: {
      labels: {
        deleteCategory: shellLabels.deleteCategory,
        deleteCategoryConfirm: shellLabels.deleteCategoryConfirm,
        cancel: shellLabels.cancel,
      },
      open: store.isDeleteDialogOpen && store.dialogTarget === "category",
      onClose: store.closeDeleteDialog,
      onConfirm: mutations.handleDeleteCategory,
      categoryName: pendingDeleteCategory?.name ?? "",
      isLoading: mutations.isDeletingCategory,
    },
  };
}
