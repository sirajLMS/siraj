"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
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
import { SubjectCardDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/subjectCard.desktop";

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

      {(() => {
        if (isLoading) {
          return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
                {t.loading}
              </Typography>
            </Box>
          );
        }
        if (filteredSubjects.length === 0) {
          return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
                {t.noSubjects}
              </Typography>
            </Box>
          );
        }
        return (
          <Grid container spacing={2}>
            {filteredSubjects.map(subject => (
              <Grid key={subject.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <SubjectCardDesktop
                  labels={labels}
                  subject={subject}
                  onEdit={() => onEditSubject(subject.id ?? "")}
                  onDelete={() => onDeleteSubject(subject.id ?? "")}
                  onClick={() => onSubjectClick(subject.id ?? "")}
                  canManage={canManageSubjects}
                />
              </Grid>
            ))}
          </Grid>
        );
      })()}

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
