import type { Control, FieldErrors, UseFormHandleSubmit, UseFormReset } from "react-hook-form";
import type {
  ClassCategoriesQuery_classCategories,
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubjectCreateInput,
  ClassSubjectsQuery_classSubjects,
  ClassSubjectsQuery_classSubjects_resources,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  CategoryFormValues,
  EditCategoryFormValues,
} from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type { SubjectsLabels } from "@/shared/locale";

export type CategoryItem = ClassCategoriesQuery_classCategories;

export type SubjectItem = ClassSubjectsQuery_classSubjects;

export type SubjectResourceItem = ClassSubjectsQuery_classSubjects_resources;

// NEW FOR PLAN v5: subjects-related translation labels carried by the
// ViewModel to the lifted dialogs so the tier files don't call useAppTranslation
// directly for form/field labels (avoids duplicating the
// `tuseAppTranslation(Translation.Dashboard.Subjects)` property walk across all four dialogs).
export interface SubjectsDialogLabels {
  readonly createSubject: string;
  readonly editSubject: string;
  readonly createCategory: string;
  readonly editCategory: string;
  readonly nameLabel: string;
  readonly slugLabel: string;
  readonly categoryLabel: string;
  readonly selectCategory: string;
  readonly descriptionLabel: string;
  readonly activeLabel: string;
  readonly avatarLabel: string;
  readonly nameRequired: string;
  readonly slugRequired: string;
  readonly categoryRequired: string;
  readonly hourlyRateLabel: string;
  readonly currencyLabel: string;
  readonly cancel: string;
  readonly saveChanges: string;
  readonly saving: string;
}

// NEW FOR PLAN v5: Form-state bundle passed into each subject form dialog
// from the ViewModel. Per specs.md §6.2 + §6.3 the form instance lives in the
// ViewModel and is handed down via props — the tier dialog files no longer
// call `useForm`/`useWatch`/`useEffect`/`zodResolver`.
export interface SubjectFormStateProps {
  readonly control: Control<SubjectFormValues>;
  readonly errors: FieldErrors<SubjectFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<SubjectFormValues>;
  readonly values: SubjectFormValues;
  readonly reset: UseFormReset<SubjectFormValues>;
}

// NEW FOR PLAN v5: Form-state bundle passed into each category form dialog
// from the ViewModel. Reuses `CategoryFormValues` (edit and create are
// structurally identical — see `editCategorySchema` in
// `schemas/category.schema.ts`).
export interface CategoryFormStateProps {
  readonly control: Control<CategoryFormValues>;
  readonly errors: FieldErrors<CategoryFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<CategoryFormValues>;
  readonly values: CategoryFormValues;
  readonly reset: UseFormReset<CategoryFormValues>;
}

// NEW FOR PLAN v5: type alias used by EditCategoryDialog tier files to keep
// their `Controller`/`Control<EditCategoryFormValues>` calls type-correct
// while still binding to the same shared form-state bundle (EditCategoryFormValues
// is structurally identical to CategoryFormValues).
export type EditCategoryFormStateProps = CategoryFormStateProps & {
  readonly control: Control<EditCategoryFormValues>;
  readonly errors: FieldErrors<EditCategoryFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<EditCategoryFormValues>;
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

export interface CreateSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: ClassSubjectCreateInput) => void;
  readonly categories: readonly CategoryItem[];
  readonly isLoading: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  // NEW FOR PLAN v5: lifted form state + labels per specs.md §6.2 + §6.3.
  // The tier dialog no longer calls `useForm`/`useWatch`/`useEffect`/`zodResolver`;
  // the ViewModel owns the form instance and hands it down as props.
  readonly form: SubjectFormStateProps;
  readonly labels: SubjectsDialogLabels;
}

export interface EditSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (id: string, input: ClassSubjectUpdateInput) => void;
  readonly subject: SubjectItem | null;
  readonly categories: readonly CategoryItem[];
  readonly isLoading: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  // NEW FOR PLAN v5: lifted form state + labels per specs.md §6.2 + §6.3.
  readonly form: SubjectFormStateProps;
  readonly labels: SubjectsDialogLabels;
}

export interface DeleteSubjectDialogProps {
  readonly labels: Pick<SubjectsLabels, "deleteSubject" | "deleteSubjectConfirm" | "cancel">;
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
  // NEW FOR PLAN v5: lifted form state + labels per specs.md §6.2 + §6.3.
  readonly form: CategoryFormStateProps;
  readonly labels: SubjectsDialogLabels;
}

export interface EditCategoryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (id: string, input: ClassCategoryUpdateInput) => void;
  readonly category: CategoryItem | null;
  readonly isLoading: boolean;
  // NEW FOR PLAN v5: lifted form state + labels per specs.md §6.2 + §6.3.
  readonly form: EditCategoryFormStateProps;
  readonly labels: SubjectsDialogLabels;
}

export interface DeleteCategoryDialogProps {
  readonly labels: Pick<SubjectsLabels, "deleteCategory" | "deleteCategoryConfirm" | "cancel">;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly categoryName: string;
  readonly isLoading: boolean;
}

export interface SubjectsContainerProps {
  readonly subjectId?: string;
}

// NEW FOR PLAN v5: SubjectDialogsProps — §4.1 Class B unified lift of the byte-identical
// SubjectDialogsMobileProps / SubjectDialogsDesktopProps pair. Used by both tier files via `import type`.
export interface SubjectDialogsProps {
  readonly categories: readonly CategoryItem[];
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
  readonly pendingDeleteSubject: SubjectItem | null;
  readonly pendingDeleteCategory: CategoryItem | null;
  readonly refetchSubjects: () => Promise<unknown>;
  readonly activeCategoryId: string | null;
  readonly onCategoryReset: () => void;
}
