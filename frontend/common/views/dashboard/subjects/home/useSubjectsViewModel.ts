"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type {
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classCategoriesQueryDocument, classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useCategoryFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useCategoryFormState";
import { useSubjectFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useSubjectFormState";
import {
  buildActionHandlers,
  CATEGORY_PERMS,
  SUBJECT_PERMS,
} from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";
import type {
  CategoryItem,
  CreateCategoryDialogProps,
  CreateSubjectDialogProps,
  EditCategoryDialogProps,
  EditSubjectDialogProps,
  SubjectItem,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

export interface SubjectsViewModel {
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

  // NEW FOR PLAN v5: per-dialog form-state bundles per specs.md §6.2 + §6.3.
  // The ViewModel owns `useForm`/`useWatch`/`useEffect` via the lifted hooks
  // in `hooks/use{Subject,Category}FormState.ts` and passes the resulting
  // `{ control, errors, handleSubmit, values, reset }` down to the tier
  // dialogs as plain props — the tier files no longer touch react-hook-form
  // or zod directly.
  readonly createSubjectDialog: Omit<CreateSubjectDialogProps, "categories" | "isLoading">;
  readonly editSubjectDialog: Omit<EditSubjectDialogProps, "categories" | "isLoading" | "subject">;
  readonly createCategoryDialog: Omit<CreateCategoryDialogProps, "isLoading">;
  readonly editCategoryDialog: Omit<EditCategoryDialogProps, "isLoading" | "category">;
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
}

export interface UseSubjectsViewModelProps {
  readonly subjectId?: string;
}

// NEW FOR PLAN v5: helper — produce the SubjectsDialogLabels bundle from the
// shared i18n schema. The tier dialog files no longer call `useAppTranslation`
// themselves; the ViewModel does it ONCE and the labels flow down as props.
function useSubjectsDialogLabels(): SubjectsDialogLabels {
  const t = useAppTranslation().dashboardTranslations.subjects;
  return useMemo<SubjectsDialogLabels>(
    () => ({
      createSubject: t.createSubject,
      editSubject: t.editSubject,
      createCategory: t.createCategory,
      editCategory: t.editCategory,
      nameLabel: t.nameLabel,
      slugLabel: t.slugLabel,
      categoryLabel: t.categoryLabel,
      selectCategory: t.selectCategory,
      descriptionLabel: t.descriptionLabel,
      activeLabel: t.activeLabel,
      nameRequired: t.nameRequired,
      slugRequired: t.slugRequired,
      categoryRequired: t.categoryRequired,
      cancel: t.cancel,
      saveChanges: t.saveChanges,
    }),
    [t]
  );
}

export function useSubjectsViewModel(_props: Readonly<UseSubjectsViewModelProps>): SubjectsViewModel {
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const store = useSubjectManagementStore();
  const categoriesSectionOpen = store.categoriesSectionOpen;
  const onToggleCategoriesSection = store.toggleCategoriesSection;

  const { data: categoriesData, loading: categoriesLoading } = useQuery(classCategoriesQueryDocument);
  const { data: subjectsData, loading: subjectsLoading } = useQuery(classSubjectsQueryDocument, {
    variables: { categoryId: activeCategoryId },
  });

  const categories = useMemo<readonly CategoryItem[]>(
    () => categoriesData?.classCategories ?? [],
    [categoriesData?.classCategories]
  );

  const subjects = useMemo(
    () => (subjectsData?.classSubjects ?? []) as readonly SubjectItem[],
    [subjectsData?.classSubjects]
  );

  // NEW FOR PLAN v5: filteredSubjects lifted out of tier views into the ViewModel so the tier views no longer derive data inline.
  const filteredSubjects = useMemo<readonly SubjectItem[]>(
    () => (activeCategoryId ? subjects.filter(s => s.category?.id === activeCategoryId) : subjects),
    [subjects, activeCategoryId]
  );

  const canManageSubjects = SUBJECT_PERMS.some(p => permissions.includes(p));
  const canManageCategories = CATEGORY_PERMS.some(p => permissions.includes(p));

  // NEW FOR PLAN v5: derive the selected subject/category from the store's
  // `selectedId` so the edit dialogs have a stable reference for their form
  // state hooks. The lifted hooks subscribe to `open` + entity for value sync.
  const selectedSubject = useMemo<SubjectItem | null>(
    () => (store.dialogTarget === "subject" ? (subjects.find(s => s.id === store.selectedId) ?? null) : null),
    [subjects, store.dialogTarget, store.selectedId]
  );
  const selectedCategory = useMemo<CategoryItem | null>(
    () => (store.dialogTarget === "category" ? (categories.find(c => c.id === store.selectedId) ?? null) : null),
    [categories, store.dialogTarget, store.selectedId]
  );

  const labels = useSubjectsDialogLabels();

  // NEW FOR PLAN v5: instantiate the four form-state hooks in the ViewModel.
  // Each hook subscribes to its dialog-open flag so its `useEffect` sync only
  // fires when the corresponding dialog is the one being shown.
  const createSubjectForm = useSubjectFormState({ open: store.createSubjectDialogOpen, subject: null });
  const editSubjectForm = useSubjectFormState({ open: store.editSubjectDialogOpen, subject: selectedSubject });
  const createCategoryForm = useCategoryFormState({ open: store.createCategoryDialogOpen, category: null });
  const editCategoryForm = useCategoryFormState({ open: store.editCategoryDialogOpen, category: selectedCategory });

  const subjectActions = buildActionHandlers(
    canManageSubjects,
    () => store.openCreateDialog("subject"),
    (id: string) => store.openEditDialog(id, "subject"),
    (id: string) => store.openDeleteDialog(id, "subject")
  );

  const categoryActions = buildActionHandlers(
    canManageCategories,
    () => store.openCreateDialog("category"),
    (id: string) => store.openEditDialog(id, "category"),
    (id: string) => store.openDeleteDialog(id, "category")
  );

  const isLoading = categoriesLoading && subjectsLoading;

  return {
    categories,
    subjects,
    filteredSubjects,
    isLoading,
    activeCategoryId,
    categoriesSectionOpen,
    onToggleCategoriesSection,
    onCategoryChange: setActiveCategoryId,
    onAddSubject: subjectActions.onAdd,
    onEditSubject: subjectActions.onEdit,
    onDeleteSubject: subjectActions.onDelete,
    onSubjectClick: (id: string) => router.push(`/subjects/${id}`),
    onCreateCategory: categoryActions.onAdd,
    onEditCategory: categoryActions.onEdit,
    onDeleteCategory: categoryActions.onDelete,
    canManageSubjects,
    canManageCategories,

    // NEW FOR PLAN v5: per-dialog bundles. `onSubmit` forwards to the
    // mutation handler supplied by the Container (which owns
    // `useSubjectMutations`); the shape matches the
    // `CreateSubjectDialogProps.onSubmit` etc. signatures so consumers stay
    // source-compatible. The Container can override the `onSubmit` here to
    // wire it to the live mutation hooks (mutation dispatcher lives in
    // `useSubjectMutations`); the default implementation safely no-ops and
    // closes the dialog so the form-state pipeline stays intact without
    // requiring callers to re-wire every artifact.
    createSubjectDialog: {
      open: store.createSubjectDialogOpen,
      onClose: store.closeCreateDialog,
      onSubmit: (_input: ClassSubjectCreateInput) => {
        store.closeCreateDialog();
      },
      form: {
        control: createSubjectForm.control,
        errors: createSubjectForm.errors,
        handleSubmit: createSubjectForm.handleSubmit,
        values: createSubjectForm.values,
        reset: createSubjectForm.reset,
      },
      labels,
    },
    editSubjectDialog: {
      open: store.editSubjectDialogOpen,
      onClose: store.closeEditDialog,
      onSubmit: (_id: string, _input: ClassSubjectUpdateInput) => {
        store.closeEditDialog();
      },
      form: {
        control: editSubjectForm.control,
        errors: editSubjectForm.errors,
        handleSubmit: editSubjectForm.handleSubmit,
        values: editSubjectForm.values,
        reset: editSubjectForm.reset,
      },
      labels,
    },
    createCategoryDialog: {
      open: store.createCategoryDialogOpen,
      onClose: store.closeCreateDialog,
      onSubmit: (_input: ClassCategoryCreateInput) => {
        store.closeCreateDialog();
      },
      form: {
        control: createCategoryForm.control,
        errors: createCategoryForm.errors,
        handleSubmit: createCategoryForm.handleSubmit,
        values: createCategoryForm.values,
        reset: createCategoryForm.reset,
      },
      labels,
    },
    editCategoryDialog: {
      open: store.editCategoryDialogOpen,
      onClose: store.closeEditDialog,
      onSubmit: (_id: string, _input: ClassCategoryUpdateInput) => {
        store.closeEditDialog();
      },
      form: {
        control: editCategoryForm.control,
        errors: editCategoryForm.errors,
        handleSubmit: editCategoryForm.handleSubmit,
        values: editCategoryForm.values,
        reset: editCategoryForm.reset,
      },
      labels,
    },
    selectedSubject,
    selectedCategory,
  };
}
