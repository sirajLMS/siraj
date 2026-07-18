import type {
  ClassCategory,
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubject,
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export type CategoryItem = NonNullable<ClassCategory>;

export type SubjectItem = NonNullable<ClassSubject> & {
  readonly resources: readonly SubjectResourceItem[];
  readonly category: CategoryItem | null;
};

export type SubjectResourceItem = NonNullable<ClassSubject["resources"]>[number];

export interface SubjectsViewProps {
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
}

export interface SubjectCardProps {
  readonly subject: SubjectItem;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onClick: () => void;
  readonly canManage: boolean;
}

export interface CategoriesSectionProps {
  readonly categories: readonly CategoryItem[];
  readonly activeCategoryId: string | null;
  readonly onCategoryChange: (categoryId: string | null) => void;
  readonly onCreateCategory: () => void;
  readonly onEditCategory: (id: string) => void;
  readonly onDeleteCategory: (id: string) => void;
  readonly canManage: boolean;
}

export interface CreateSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: ClassSubjectCreateInput) => void;
  readonly categories: readonly CategoryItem[];
  readonly isLoading: boolean;
}

export interface EditSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (id: string, input: ClassSubjectUpdateInput) => void;
  readonly subject: SubjectItem | null;
  readonly categories: readonly CategoryItem[];
  readonly isLoading: boolean;
}

export interface DeleteSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly subjectName: string;
  readonly isLoading: boolean;
}

export interface CreateCategoryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: ClassCategoryCreateInput) => void;
  readonly isLoading: boolean;
}

export interface EditCategoryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (id: string, input: ClassCategoryUpdateInput) => void;
  readonly category: CategoryItem | null;
  readonly isLoading: boolean;
}

export interface DeleteCategoryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly categoryName: string;
  readonly isLoading: boolean;
}

export interface SubjectsContainerProps {
  readonly subjectId?: string;
}
