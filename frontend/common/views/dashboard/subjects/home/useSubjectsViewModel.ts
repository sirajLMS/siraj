"use client";

import { useState } from "react";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { buildCategoryManagementDialogs } from "@/frontend/common/views/dashboard/subjects/home/categoryManagementDialogBuilders";
import { buildSubjectManagementDialogs } from "@/frontend/common/views/dashboard/subjects/home/subjectManagementDialogBuilders";
import { buildSubjectsViewModelResult } from "@/frontend/common/views/dashboard/subjects/home/subjectsViewModel.helpers";
import type {
  CategoryItem,
  SubjectItem,
  SubjectsViewProps,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import { useSubjectsData } from "@/frontend/common/views/dashboard/subjects/home/useSubjectsData.hooks";
import { useSubjectsFormsAndActions } from "@/frontend/common/views/dashboard/subjects/home/useSubjectsFormsAndActions.hooks";
import {
  useSelectedEntities,
  useSubjectPermissions,
  useSubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/useSubjectsViewModel.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface SubjectsViewModel extends SubjectsViewProps {
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
}

export interface UseSubjectsViewModelProps {
  readonly subjectId?: string;
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
