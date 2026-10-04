import type { Control, FieldErrors, UseFormHandleSubmit, UseFormReset } from "react-hook-form";
import type {
  ClassCategoriesQuery_classCategories,
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubjectCreateInput,
  ClassSubjectsQuery_classSubjects,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  CategoryFormValues,
  EditCategoryFormValues,
} from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type { SubjectsLabels } from "@/shared/locale";

// Subjects-related translation labels carried by the ViewModel to the lifted
// dialogs so the tier files don't call useAppTranslation directly for
// form/field labels.
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

// Form-state bundle passed into each subject form dialog from the ViewModel.
// The form instance lives in the ViewModel and is handed down via props —
// the tier dialog files do not call `useForm`/`useWatch`/`useEffect`/`zodResolver`.
export interface SubjectFormStateProps {
  readonly control: Control<SubjectFormValues>;
  readonly errors: FieldErrors<SubjectFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<SubjectFormValues>;
  readonly values: SubjectFormValues;
  readonly reset: UseFormReset<SubjectFormValues>;
}

// Form-state bundle passed into each category form dialog from the ViewModel.
// Edit and create are structurally identical — see `editCategorySchema` in
// `schemas/category.schema.ts`.
export interface CategoryFormStateProps {
  readonly control: Control<CategoryFormValues>;
  readonly errors: FieldErrors<CategoryFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<CategoryFormValues>;
  readonly values: CategoryFormValues;
  readonly reset: UseFormReset<CategoryFormValues>;
}

// Type used by EditCategoryDialog tier files to keep their
// `Controller`/`Control<EditCategoryFormValues>` calls type-correct while
// still binding to the same shared form-state bundle (EditCategoryFormValues
// is structurally identical to CategoryFormValues).
type EditCategoryFormStateProps = CategoryFormStateProps & {
  readonly control: Control<EditCategoryFormValues>;
  readonly errors: FieldErrors<EditCategoryFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<EditCategoryFormValues>;
};

export interface CreateSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: ClassSubjectCreateInput) => void;
  readonly categories: readonly ClassCategoriesQuery_classCategories[];
  readonly isLoading: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  // Lifted form state + labels: the ViewModel owns the form instance and
  // hands it down as props.
  readonly form: SubjectFormStateProps;
  readonly labels: SubjectsDialogLabels;
}

export interface EditSubjectDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (id: string, input: ClassSubjectUpdateInput) => void;
  readonly subject: ClassSubjectsQuery_classSubjects | null;
  readonly categories: readonly ClassCategoriesQuery_classCategories[];
  readonly isLoading: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  // Lifted form state + labels: the ViewModel owns the form instance and
  // hands it down as props.
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
  // Lifted form state + labels: the ViewModel owns the form instance and
  // hands it down as props.
  readonly form: CategoryFormStateProps;
  readonly labels: SubjectsDialogLabels;
}

export interface EditCategoryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (id: string, input: ClassCategoryUpdateInput) => void;
  readonly category: ClassCategoriesQuery_classCategories | null;
  readonly isLoading: boolean;
  // Lifted form state + labels: the ViewModel owns the form instance and
  // hands it down as props.
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
