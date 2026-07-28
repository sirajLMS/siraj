"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { classCategoriesQueryDocument, classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { useCategoryFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useCategoryFormState";
import { useSubjectFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useSubjectFormState";
import {
  buildActionHandlers,
  CATEGORY_PERMS,
  SUBJECT_PERMS,
} from "@/frontend/common/views/dashboard/subjects/home/subjectsActions";
import type {
  CategoryItem,
  CreateCategoryDialogProps,
  CreateSubjectDialogProps,
  DeleteCategoryDialogProps,
  DeleteSubjectDialogProps,
  EditCategoryDialogProps,
  EditSubjectDialogProps,
  SubjectItem,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import { useRouter } from "@/shared/i18n/navigation";
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

  readonly createSubjectDialog: CreateSubjectDialogProps;
  readonly editSubjectDialog: EditSubjectDialogProps;
  readonly deleteSubjectDialog: DeleteSubjectDialogProps;
  readonly createCategoryDialog: CreateCategoryDialogProps;
  readonly editCategoryDialog: EditCategoryDialogProps;
  readonly deleteCategoryDialog: DeleteCategoryDialogProps;
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
}

export interface UseSubjectsViewModelProps {
  readonly subjectId?: string;
}

interface SubjectsDataResult {
  readonly categories: readonly CategoryItem[];
  readonly subjects: readonly SubjectItem[];
  readonly filteredSubjects: readonly SubjectItem[];
  readonly isLoading: boolean;
  readonly refetchSubjects: () => Promise<unknown>;
}

interface SubjectPermissionsResult {
  readonly canManageSubjects: boolean;
  readonly canManageCategories: boolean;
}

interface SelectedEntitiesResult {
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
  readonly pendingDeleteSubject: SubjectItem | null;
  readonly pendingDeleteCategory: CategoryItem | null;
}

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
      avatarLabel: t.avatarLabel,
      nameRequired: t.nameRequired,
      slugRequired: t.slugRequired,
      categoryRequired: t.categoryRequired,
      hourlyRateLabel: t.hourlyRateLabel,
      currencyLabel: t.currencyLabel,
      cancel: t.cancel,
      saveChanges: t.saveChanges,
    }),
    [t]
  );
}

function useSubjectsData(activeCategoryId: string | null): SubjectsDataResult {
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useQuery(classCategoriesQueryDocument, {
    errorPolicy: "all",
  });
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useQuery(classSubjectsQueryDocument, {
    variables: { categoryId: activeCategoryId },
    errorPolicy: "all",
  });

  if (categoriesError) {
    logger.error("Error fetching class categories:", categoriesError);
  }
  if (subjectsError) {
    logger.error("Error fetching class subjects:", subjectsError);
  }

  const categories = useMemo<readonly CategoryItem[]>(
    () => categoriesData?.classCategories ?? [],
    [categoriesData?.classCategories]
  );

  const subjects = useMemo(
    () => (subjectsData?.classSubjects ?? []) as unknown as readonly SubjectItem[],
    [subjectsData?.classSubjects]
  );

  const filteredSubjects = useMemo<readonly SubjectItem[]>(
    () => (activeCategoryId ? subjects.filter(s => s.category?.id === activeCategoryId) : subjects),
    [subjects, activeCategoryId]
  );

  const isLoading = categoriesLoading || subjectsLoading;

  return { categories, subjects, filteredSubjects, isLoading, refetchSubjects };
}

function useSubjectPermissions(): SubjectPermissionsResult {
  const permissions = useUserStore(state => state.permissions);
  return {
    canManageSubjects: SUBJECT_PERMS.some(p => permissions.includes(p)),
    canManageCategories: CATEGORY_PERMS.some(p => permissions.includes(p)),
  };
}

function useSelectedEntities(
  subjects: readonly SubjectItem[],
  categories: readonly CategoryItem[]
): SelectedEntitiesResult {
  const store = useSubjectManagementStore();
  const selectedSubject = useMemo<SubjectItem | null>(
    () => (store.dialogTarget === "subject" ? (subjects.find(s => s.id === store.selectedId) ?? null) : null),
    [subjects, store.dialogTarget, store.selectedId]
  );
  const selectedCategory = useMemo<CategoryItem | null>(
    () => (store.dialogTarget === "category" ? (categories.find(c => c.id === store.selectedId) ?? null) : null),
    [categories, store.dialogTarget, store.selectedId]
  );
  const pendingDeleteSubject = useMemo<SubjectItem | null>(
    () => (store.dialogTarget === "subject" ? (subjects.find(s => s.id === store.pendingDeleteId) ?? null) : null),
    [subjects, store.dialogTarget, store.pendingDeleteId]
  );
  const pendingDeleteCategory = useMemo<CategoryItem | null>(
    () => (store.dialogTarget === "category" ? (categories.find(c => c.id === store.pendingDeleteId) ?? null) : null),
    [categories, store.dialogTarget, store.pendingDeleteId]
  );
  return { selectedSubject, selectedCategory, pendingDeleteSubject, pendingDeleteCategory };
}

export function useSubjectsViewModel(_props: Readonly<UseSubjectsViewModelProps>): SubjectsViewModel {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const store = useSubjectManagementStore();

  const { categories, subjects, filteredSubjects, isLoading, refetchSubjects } = useSubjectsData(activeCategoryId);
  const { canManageSubjects, canManageCategories } = useSubjectPermissions();
  const { selectedSubject, selectedCategory, pendingDeleteSubject, pendingDeleteCategory } = useSelectedEntities(
    subjects,
    categories
  );
  const labels = useSubjectsDialogLabels();
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: "subjects" });

  const mutations = useSubjectMutations({
    refetchSubjects,
    activeCategoryId,
    onCategoryReset: () => setActiveCategoryId(null),
  });

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

  const createSubjectDialog: CreateSubjectDialogProps = {
    open: store.createSubjectDialogOpen,
    onClose: store.closeCreateDialog,
    onSubmit: mutations.handleCreateSubject,
    categories,
    isLoading: mutations.isCreatingSubject,
    onUploadAvatar,
    form: {
      control: createSubjectForm.control,
      errors: createSubjectForm.errors,
      handleSubmit: createSubjectForm.handleSubmit,
      values: createSubjectForm.values,
      reset: createSubjectForm.reset,
    },
    labels,
  };

  const editSubjectDialog: EditSubjectDialogProps = {
    open: store.editSubjectDialogOpen,
    onClose: store.closeEditDialog,
    onSubmit: mutations.handleUpdateSubject,
    subject: selectedSubject,
    categories,
    isLoading: mutations.isUpdatingSubject,
    onUploadAvatar,
    form: {
      control: editSubjectForm.control,
      errors: editSubjectForm.errors,
      handleSubmit: editSubjectForm.handleSubmit,
      values: editSubjectForm.values,
      reset: editSubjectForm.reset,
    },
    labels,
  };

  const deleteSubjectDialog: DeleteSubjectDialogProps = {
    open: store.isDeleteDialogOpen && store.dialogTarget === "subject",
    onClose: store.closeDeleteDialog,
    onConfirm: mutations.handleDeleteSubject,
    subjectName: pendingDeleteSubject?.name ?? "",
    isLoading: mutations.isDeletingSubject,
  };

  const createCategoryDialog: CreateCategoryDialogProps = {
    open: store.createCategoryDialogOpen,
    onClose: store.closeCreateDialog,
    onSubmit: mutations.handleCreateCategory,
    isLoading: mutations.isCreatingCategory,
    form: {
      control: createCategoryForm.control,
      errors: createCategoryForm.errors,
      handleSubmit: createCategoryForm.handleSubmit,
      values: createCategoryForm.values,
      reset: createCategoryForm.reset,
    },
    labels,
  };

  const editCategoryDialog: EditCategoryDialogProps = {
    open: store.editCategoryDialogOpen,
    onClose: store.closeEditDialog,
    onSubmit: mutations.handleUpdateCategory,
    category: selectedCategory,
    isLoading: mutations.isUpdatingCategory,
    form: {
      control: editCategoryForm.control,
      errors: editCategoryForm.errors,
      handleSubmit: editCategoryForm.handleSubmit,
      values: editCategoryForm.values,
      reset: editCategoryForm.reset,
    },
    labels,
  };

  const deleteCategoryDialog: DeleteCategoryDialogProps = {
    open: store.isDeleteDialogOpen && store.dialogTarget === "category",
    onClose: store.closeDeleteDialog,
    onConfirm: mutations.handleDeleteCategory,
    categoryName: pendingDeleteCategory?.name ?? "",
    isLoading: mutations.isDeletingCategory,
  };

  return {
    categories,
    subjects,
    filteredSubjects,
    isLoading,
    activeCategoryId,
    categoriesSectionOpen: store.categoriesSectionOpen,
    onToggleCategoriesSection: store.toggleCategoriesSection,
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
    createSubjectDialog,
    editSubjectDialog,
    deleteSubjectDialog,
    createCategoryDialog,
    editCategoryDialog,
    deleteCategoryDialog,
    selectedSubject,
    selectedCategory,
  };
}
