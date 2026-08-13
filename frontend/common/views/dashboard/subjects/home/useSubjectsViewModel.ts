"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { classCategoriesQueryDocument, classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { buildCategoryManagementDialogs } from "@/frontend/common/views/dashboard/subjects/home/categoryManagementDialogBuilders";
import { useCategoryFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useCategoryFormState";
import { useSubjectFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useSubjectFormState";
import { buildSubjectManagementDialogs } from "@/frontend/common/views/dashboard/subjects/home/subjectManagementDialogBuilders";
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
  SubjectsViewProps,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import { useRouter } from "@/shared/i18n/navigation";
import { type SubjectsLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface SubjectsViewModel extends SubjectsViewProps {
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
  const t = useAppTranslation(Translation.Dashboard.Subjects);
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
      saving: t.saving,
    }),
    [t]
  );
}

function isSubjectItem(value: unknown): value is SubjectItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string"
  );
}

function isSubjectItemList(value: unknown): value is readonly SubjectItem[] {
  return Array.isArray(value) && value.every(isSubjectItem);
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

  const subjects = useMemo<readonly SubjectItem[]>(
    () => (isSubjectItemList(subjectsData?.classSubjects) ? subjectsData.classSubjects : []),
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

type SubjectFormState = ReturnType<typeof useSubjectFormState>;
type CategoryFormState = ReturnType<typeof useCategoryFormState>;

interface SubjectsFormAndActionsStore {
  readonly createSubjectDialogOpen: boolean;
  readonly editSubjectDialogOpen: boolean;
  readonly createCategoryDialogOpen: boolean;
  readonly editCategoryDialogOpen: boolean;
  readonly openCreateDialog: (target: "subject" | "category") => void;
  readonly openEditDialog: (id: string, target: "subject" | "category") => void;
  readonly openDeleteDialog: (id: string, target: "subject" | "category") => void;
}

interface SubjectsFormAndActionsResult {
  readonly createSubjectForm: SubjectFormState;
  readonly editSubjectForm: SubjectFormState;
  readonly createCategoryForm: CategoryFormState;
  readonly editCategoryForm: CategoryFormState;
  readonly subjectActions: ReturnType<typeof buildActionHandlers>;
  readonly categoryActions: ReturnType<typeof buildActionHandlers>;
}

function useSubjectsFormsAndActions(
  store: SubjectsFormAndActionsStore,
  selectedSubject: SubjectItem | null,
  selectedCategory: CategoryItem | null,
  canManageSubjects: boolean,
  canManageCategories: boolean
): SubjectsFormAndActionsResult {
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

  return {
    createSubjectForm,
    editSubjectForm,
    createCategoryForm,
    editCategoryForm,
    subjectActions,
    categoryActions,
  };
}

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

function buildSubjectsViewModelResult(params: SubjectsViewModelResultParams): SubjectsViewModel {
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

export function useSubjectsViewModel(_props: Readonly<UseSubjectsViewModelProps>): SubjectsViewModel {
  const router = useRouter();
  const labels = useAppTranslation(Translation.Dashboard.Subjects);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const store = useSubjectManagementStore();

  const { categories, subjects, filteredSubjects, isLoading, refetchSubjects } = useSubjectsData(activeCategoryId);
  const { canManageSubjects, canManageCategories } = useSubjectPermissions();
  const { selectedSubject, selectedCategory, pendingDeleteSubject, pendingDeleteCategory } = useSelectedEntities(
    subjects,
    categories
  );
  const dialogLabels = useSubjectsDialogLabels();
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: "subjects" });

  const mutations = useSubjectMutations({
    refetchSubjects,
    activeCategoryId,
    onCategoryReset: () => setActiveCategoryId(null),
  });

  const { createSubjectForm, editSubjectForm, createCategoryForm, editCategoryForm, subjectActions, categoryActions } =
    useSubjectsFormsAndActions(store, selectedSubject, selectedCategory, canManageSubjects, canManageCategories);

  const subjectDialogs = buildSubjectManagementDialogs({
    store,
    mutations,
    categories,
    selectedSubject,
    pendingDeleteSubject,
    onUploadAvatar,
    createSubjectForm,
    editSubjectForm,
    labels: dialogLabels,
    shellLabels: labels,
  });

  const categoryDialogs = buildCategoryManagementDialogs({
    store,
    mutations,
    selectedCategory,
    pendingDeleteCategory,
    createCategoryForm,
    editCategoryForm,
    labels: dialogLabels,
    shellLabels: labels,
  });

  const { createSubjectDialog, editSubjectDialog, deleteSubjectDialog } = subjectDialogs;

  const { createCategoryDialog, editCategoryDialog, deleteCategoryDialog } = categoryDialogs;

  return buildSubjectsViewModelResult({
    labels,
    categories,
    subjects,
    filteredSubjects,
    isLoading,
    activeCategoryId,
    categoriesSectionOpen: store.categoriesSectionOpen,
    onToggleCategoriesSection: store.toggleCategoriesSection,
    onCategoryChange: setActiveCategoryId,
    subjectActions,
    categoryActions,
    onSubjectClick: (id: string) => router.push(`/subjects/${id}`),
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
  });
}
