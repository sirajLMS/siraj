"use client";

import { AddOutlined } from "@mui/icons-material";
import { SubjectCategoryTabsShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectCategoryTabsShared";
import { SubjectDialogsShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogsShared";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { CategoriesSectionMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/categoriesSection.mobile";
import { CreateCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/createCategoryDialog.mobile";
import { CreateSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/createSubjectDialog.mobile";
import { DeleteCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/deleteCategoryDialog.mobile";
import { DeleteSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/deleteSubjectDialog.mobile";
import { EditCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/editCategoryDialog.mobile";
import { EditSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/editSubjectDialog.mobile";
import { SubjectCardMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/subjectCard.mobile";

export function SubjectsViewMobile({
  labels,
  categories,
  filteredSubjects,
  isLoading,
  activeCategoryId,
  categoriesSectionOpen,
  onToggleCategoriesSection,
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
    <CategoriesSectionMobile
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
    <MobilePageContainer>
      <MobilePageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          canManageSubjects || canManageCategories ? (
            <>
              {canManageSubjects ? (
                <MobilePrimaryPageAction onClick={onAddSubject} startIcon={<AddOutlined />}>
                  {t.addSubject}
                </MobilePrimaryPageAction>
              ) : null}
              {canManageCategories ? (
                <MobilePrimaryPageAction variant="outlined" onClick={onToggleCategoriesSection}>
                  {categoriesSectionOpen ? t.hideCategories : t.manageCategories}
                </MobilePrimaryPageAction>
              ) : null}
            </>
          ) : undefined
        }
      />

      {categoriesSectionOpen && canManageCategories ? categoriesSection : null}

      <SubjectCategoryTabsShared
        labels={labels}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onCategoryChange={onCategoryChange}
      />

      <MobileCardList
        rows={filteredSubjects}
        loading={isLoading}
        emptyMessage={t.noSubjects}
        getKey={subject => subject.id ?? ""}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={subject => (
          <SubjectCardMobile
            labels={labels}
            subject={subject}
            onEdit={() => onEditSubject(subject.id ?? "")}
            onDelete={() => onDeleteSubject(subject.id ?? "")}
            onClick={() => onSubjectClick(subject.id ?? "")}
            canManage={canManageSubjects}
          />
        )}
      />

      <SubjectDialogsShared
        createSubjectDialog={createSubjectDialog}
        editSubjectDialog={editSubjectDialog}
        deleteSubjectDialog={deleteSubjectDialog}
        createCategoryDialog={createCategoryDialog}
        editCategoryDialog={editCategoryDialog}
        deleteCategoryDialog={deleteCategoryDialog}
        CreateSubjectDialog={CreateSubjectDialogMobile}
        EditSubjectDialog={EditSubjectDialogMobile}
        DeleteSubjectDialog={DeleteSubjectDialogMobile}
        CreateCategoryDialog={CreateCategoryDialogMobile}
        EditCategoryDialog={EditCategoryDialogMobile}
        DeleteCategoryDialog={DeleteCategoryDialogMobile}
      />
    </MobilePageContainer>
  );
}
