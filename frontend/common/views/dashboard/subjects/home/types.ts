import type {
  ClassCategoriesQuery_classCategories,
  ClassSubjectsQuery_classSubjects,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  CategoryFormStateProps,
  CreateCategoryDialogProps,
  CreateSubjectDialogProps,
  DeleteCategoryDialogProps,
  DeleteSubjectDialogProps,
  EditCategoryDialogProps,
  EditSubjectDialogProps,
  SubjectFormStateProps,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/subjectsDialogs.types";
import type { SubjectsLabels } from "@/shared/locale";

export type CategoryItem = ClassCategoriesQuery_classCategories;

export type SubjectItem = ClassSubjectsQuery_classSubjects;

export type {
  CategoryFormStateProps,
  CreateCategoryDialogProps,
  CreateSubjectDialogProps,
  DeleteCategoryDialogProps,
  DeleteSubjectDialogProps,
  EditCategoryDialogProps,
  EditSubjectDialogProps,
  SubjectFormStateProps,
  SubjectsDialogLabels,
};

export interface SubjectsViewProps {
  readonly labels: SubjectsLabels;
  readonly categories: readonly CategoryItem[];
  readonly subjects: readonly SubjectItem[];
  readonly filteredSubjects: readonly SubjectItem[];
  readonly isLoading: boolean;
  readonly activeCategoryId: string | null;
  readonly categoriesSectionOpen: boolean;
  readonly onToggleCategoriesSection: () => void;
  readonly onCategoryChange: (categoryId: string | null) => void;
  readonly onAddSubject: () => void;
  readonly onEditSubject: (id: string) => void;
  readonly onDeleteSubject: (id: string) => void;
  readonly onSubjectClick: (id: string) => void;
  readonly onCreateCategory: () => void;
  readonly onEditCategory: (id: string) => void;
  readonly onDeleteCategory: (id: string) => void;
  readonly canManageSubjects: boolean;
  readonly canManageCategories: boolean;
  readonly createSubjectDialog: CreateSubjectDialogProps;
  readonly editSubjectDialog: EditSubjectDialogProps;
  readonly deleteSubjectDialog: DeleteSubjectDialogProps;
  readonly createCategoryDialog: CreateCategoryDialogProps;
  readonly editCategoryDialog: EditCategoryDialogProps;
  readonly deleteCategoryDialog: DeleteCategoryDialogProps;
}

export interface SubjectCardProps {
  readonly labels: SubjectsLabels;
  readonly subject: SubjectItem;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onClick: () => void;
  readonly canManage: boolean;
}

export interface CategoriesSectionProps {
  readonly labels: SubjectsLabels;
  readonly categories: readonly CategoryItem[];
  readonly activeCategoryId: string | null;
  readonly onCategoryChange: (categoryId: string | null) => void;
  readonly onCreateCategory: () => void;
  readonly onEditCategory: (id: string) => void;
  readonly onDeleteCategory: (id: string) => void;
  readonly canManage: boolean;
}
