"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { classCategoriesQueryDocument, classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildActionHandlers,
  CATEGORY_PERMS,
  SUBJECT_PERMS,
} from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useRouter } from "@/shared/i18n/routing";

export interface SubjectsViewModel {
  readonly categories: readonly CategoryItem[];
  readonly subjects: readonly SubjectItem[];
  readonly isLoading: boolean;
  readonly activeCategoryId: string | null;
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

export interface UseSubjectsViewModelProps {
  readonly subjectId?: string;
}

export function useSubjectsViewModel(_props: Readonly<UseSubjectsViewModelProps>): SubjectsViewModel {
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const store = useSubjectManagementStore();

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

  const canManageSubjects = SUBJECT_PERMS.some(p => permissions.includes(p));
  const canManageCategories = CATEGORY_PERMS.some(p => permissions.includes(p));

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
    isLoading,
    activeCategoryId,
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
  };
}
