import type { buildActionHandlers } from "@/frontend/common/views/dashboard/subjects/home/subjectsActions";
import type {
  CategoryItem,
  CreateCategoryDialogProps,
  CreateSubjectDialogProps,
  DeleteCategoryDialogProps,
  DeleteSubjectDialogProps,
  EditCategoryDialogProps,
  EditSubjectDialogProps,
  SubjectItem,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import type { SubjectsViewModel } from "@/frontend/common/views/dashboard/subjects/home/useSubjectsViewModel";
import type { SubjectsLabels } from "@/shared/locale";

interface SubjectsViewModelResultParams {
  readonly labels: SubjectsLabels;
  readonly categories: readonly CategoryItem[];
  readonly subjects: readonly SubjectItem[];
  readonly filteredSubjects: readonly SubjectItem[];
  readonly isLoading: boolean;
  readonly activeCategoryId: string | null;
  readonly categoriesSectionOpen: boolean;
  readonly onToggleCategoriesSection: () => void;
  readonly onCategoryChange: (categoryId: string | null) => void;
  readonly subjectActions: ReturnType<typeof buildActionHandlers>;
  readonly categoryActions: ReturnType<typeof buildActionHandlers>;
  readonly onSubjectClick: (id: string) => void;
  readonly canManageSubjects: boolean;
  readonly canManageCategories: boolean;
  readonly createSubjectDialog: CreateSubjectDialogProps;
  readonly editSubjectDialog: EditSubjectDialogProps;
  readonly deleteSubjectDialog: DeleteSubjectDialogProps;
  readonly createCategoryDialog: CreateCategoryDialogProps;
  readonly editCategoryDialog: EditCategoryDialogProps;
  readonly deleteCategoryDialog: DeleteCategoryDialogProps;
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
}

export function buildSubjectsViewModelResult(params: SubjectsViewModelResultParams): SubjectsViewModel {
  return {
    labels: params.labels,
    categories: params.categories,
    subjects: params.subjects,
    filteredSubjects: params.filteredSubjects,
    isLoading: params.isLoading,
    activeCategoryId: params.activeCategoryId,
    categoriesSectionOpen: params.categoriesSectionOpen,
    onToggleCategoriesSection: params.onToggleCategoriesSection,
    onCategoryChange: params.onCategoryChange,
    onAddSubject: params.subjectActions.onAdd,
    onEditSubject: params.subjectActions.onEdit,
    onDeleteSubject: params.subjectActions.onDelete,
    onSubjectClick: params.onSubjectClick,
    onCreateCategory: params.categoryActions.onAdd,
    onEditCategory: params.categoryActions.onEdit,
    onDeleteCategory: params.categoryActions.onDelete,
    canManageSubjects: params.canManageSubjects,
    canManageCategories: params.canManageCategories,
    createSubjectDialog: params.createSubjectDialog,
    editSubjectDialog: params.editSubjectDialog,
    deleteSubjectDialog: params.deleteSubjectDialog,
    createCategoryDialog: params.createCategoryDialog,
    editCategoryDialog: params.editCategoryDialog,
    deleteCategoryDialog: params.deleteCategoryDialog,
    selectedSubject: params.selectedSubject,
    selectedCategory: params.selectedCategory,
  };
}
