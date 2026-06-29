"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { classCategoriesQueryDocument } from "@/frontend/graphql/sharedDocuments/class-category.documents";
import { classSubjectsQueryDocument } from "@/frontend/graphql/sharedDocuments/class-subject.documents";
import { useSubjectManagementStore } from "@/frontend/stores/subjectManagementStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { useRouter } from "@/shared/i18n/routing";
import { SubjectDialogs } from "./components/SubjectDialogs";
import { SubjectsView } from "./SubjectsView";
import type { CategoryItem, SubjectItem } from "./types";

const SUBJECT_PERMS = [AppPermission.SubjectsCreate, AppPermission.SubjectsUpdate, AppPermission.SubjectsDelete];
const CATEGORY_PERMS = [AppPermission.CategoriesCreate, AppPermission.CategoriesUpdate, AppPermission.CategoriesDelete];

function buildActionHandlers(
  canManage: boolean,
  openCreate: () => void,
  openEdit: (id: string) => void,
  openDelete: (id: string) => void
) {
  return canManage
    ? { onAdd: openCreate, onEdit: openEdit, onDelete: openDelete }
    : { onAdd: () => {}, onEdit: () => {}, onDelete: () => {} };
}

export function SubjectsContainer() {
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const store = useSubjectManagementStore();

  const { data: categoriesData, loading: categoriesLoading } = useQuery(classCategoriesQueryDocument);
  const {
    data: subjectsData,
    loading: subjectsLoading,
    refetch: refetchSubjects,
  } = useQuery(classSubjectsQueryDocument, { variables: { categoryId: activeCategoryId } });

  const categories = useMemo<readonly CategoryItem[]>(
    () => categoriesData?.classCategories ?? [],
    [categoriesData?.classCategories]
  );

  const subjects = useMemo(
    () => (subjectsData?.classSubjects ?? []) as readonly SubjectItem[],
    [subjectsData?.classSubjects]
  );

  const selectedSubject = useMemo(
    () => subjects.find(s => s.id === store.selectedId) ?? null,
    [subjects, store.selectedId]
  );
  const selectedCategory = useMemo(
    () => categories.find(c => c.id === store.selectedId) ?? null,
    [categories, store.selectedId]
  );
  const pendingDeleteSubject = useMemo(
    () => subjects.find(s => s.id === store.pendingDeleteId) ?? null,
    [subjects, store.pendingDeleteId]
  );
  const pendingDeleteCategory = useMemo(
    () => categories.find(c => c.id === store.pendingDeleteId) ?? null,
    [categories, store.pendingDeleteId]
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

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.SubjectsList]}>
      <SubjectsView
        categories={categories}
        subjects={subjects}
        isLoading={false}
        activeCategoryId={activeCategoryId}
        onCategoryChange={setActiveCategoryId}
        onAddSubject={subjectActions.onAdd}
        onEditSubject={subjectActions.onEdit}
        onDeleteSubject={subjectActions.onDelete}
        onSubjectClick={(id: string) => router.push(`/subjects/${id}`)}
        onCreateCategory={categoryActions.onAdd}
        onEditCategory={categoryActions.onEdit}
        onDeleteCategory={categoryActions.onDelete}
        canManageSubjects={canManageSubjects}
        canManageCategories={canManageCategories}
      />

      <SubjectDialogs
        categories={categories}
        selectedSubject={selectedSubject}
        selectedCategory={selectedCategory}
        pendingDeleteSubject={pendingDeleteSubject}
        pendingDeleteCategory={pendingDeleteCategory}
        refetchSubjects={refetchSubjects}
        activeCategoryId={activeCategoryId}
        onCategoryReset={() => setActiveCategoryId(null)}
      />
    </RequirePermission>
  );
}
