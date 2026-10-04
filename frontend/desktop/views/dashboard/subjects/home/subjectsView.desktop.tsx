"use client";

import { AddOutlined } from "@mui/icons-material";
import { SubjectCategoryTabsShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectCategoryTabsShared";
import { SubjectDialogsShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogsShared";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { DesktopPageContainer, DesktopPageHeader, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { CategoriesSectionDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/categoriesSection.desktop";
import { CreateCategoryDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/createCategoryDialog.desktop";
import { CreateSubjectDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/createSubjectDialog.desktop";
import { DeleteCategoryDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/deleteCategoryDialog.desktop";
import { DeleteSubjectDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/deleteSubjectDialog.desktop";
import { EditCategoryDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/editCategoryDialog.desktop";
import { EditSubjectDialogDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/editSubjectDialog.desktop";
import { SubjectsGridArea } from "@/frontend/desktop/views/dashboard/subjects/home/subjectsView.desktop.parts";

export function SubjectsViewDesktop({
  labels,
  categories,
  filteredSubjects,
  isLoading,
  activeCategoryId,
  categoriesSectionOpen: _categoriesSectionOpen,
  onToggleCategoriesSection: _onToggleCategoriesSection,
  onCategoryChange,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onSubjectClick,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  canManageSubjects,
  canManageCategories,
  createSubjectDialog,
  editSubjectDialog,
  deleteSubjectDialog,
  createCategoryDialog,
  editCategoryDialog,
  deleteCategoryDialog,
}: Readonly<SubjectsViewProps>) {
  const t = labels;

  const categoriesSection = (
    <CategoriesSectionDesktop
      labels={labels}
      categories={categories}
      activeCategoryId={activeCategoryId}
      onCategoryChange={onCategoryChange}
      onCreateCategory={onCreateCategory}
      onEditCategory={onEditCategory}
      onDeleteCategory={onDeleteCategory}
      canManage={canManageCategories}
    />
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          canManageSubjects ? (
            <DesktopPrimaryPageAction onClick={onAddSubject} startIcon={<AddOutlined />}>
              {t.addSubject}
            </DesktopPrimaryPageAction>
          ) : undefined
        }
      />

      {canManageCategories && categoriesSection}

      <SubjectCategoryTabsShared
        labels={labels}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onCategoryChange={onCategoryChange}
      />

      <SubjectsGridArea
        labels={labels}
        filteredSubjects={filteredSubjects}
        isLoading={isLoading}
        onEditSubject={onEditSubject}
        onDeleteSubject={onDeleteSubject}
        onSubjectClick={onSubjectClick}
        canManageSubjects={canManageSubjects}
      />

      <SubjectDialogsShared
        createSubjectDialog={createSubjectDialog}
        editSubjectDialog={editSubjectDialog}
        deleteSubjectDialog={deleteSubjectDialog}
        createCategoryDialog={createCategoryDialog}
        editCategoryDialog={editCategoryDialog}
        deleteCategoryDialog={deleteCategoryDialog}
        CreateSubjectDialog={CreateSubjectDialogDesktop}
        EditSubjectDialog={EditSubjectDialogDesktop}
        DeleteSubjectDialog={DeleteSubjectDialogDesktop}
        CreateCategoryDialog={CreateCategoryDialogDesktop}
        EditCategoryDialog={EditCategoryDialogDesktop}
        DeleteCategoryDialog={DeleteCategoryDialogDesktop}
      />
    </DesktopPageContainer>
  );
}
