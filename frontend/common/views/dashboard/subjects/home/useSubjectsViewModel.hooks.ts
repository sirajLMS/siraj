"use client";

import { useMemo } from "react";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { CATEGORY_PERMS, SUBJECT_PERMS } from "@/frontend/common/views/dashboard/subjects/home/subjectsActions";
import type {
  CategoryItem,
  SubjectItem,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import { Translation, useAppTranslation } from "@/shared/locale";

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

export function useSubjectsDialogLabels(): SubjectsDialogLabels {
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

export function useSubjectPermissions(): SubjectPermissionsResult {
  const permissions = useUserStore(state => state.permissions);
  return {
    canManageSubjects: SUBJECT_PERMS.some(p => permissions.includes(p)),
    canManageCategories: CATEGORY_PERMS.some(p => permissions.includes(p)),
  };
}

export function useSelectedEntities(
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
