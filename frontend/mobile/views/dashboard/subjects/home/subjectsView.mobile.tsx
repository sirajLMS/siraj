"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Button, Tab, Tabs } from "@mui/material";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { CategoriesSectionMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/categoriesSection.mobile";
import { SubjectCardMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/subjectCard.mobile";
import { useAppTranslation } from "@/shared/locale";

export function SubjectsViewMobile({
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
}: Readonly<SubjectsViewProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;

  const categoriesSection = (
    <CategoriesSectionMobile
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
          canManageSubjects ? (
            <MobilePrimaryPageAction onClick={onAddSubject} startIcon={<AddOutlined />}>
              {t.addSubject}
            </MobilePrimaryPageAction>
          ) : undefined
        }
      />

      {canManageCategories ? (
        <Button variant="outlined" onClick={onToggleCategoriesSection} sx={{ alignSelf: "flex-start" }}>
          {categoriesSectionOpen ? t.hideCategories : t.manageCategories}
        </Button>
      ) : null}

      {categoriesSectionOpen && canManageCategories ? categoriesSection : null}

      <Box sx={{ borderBottom: 1, borderColor: theme => theme.palette.outlineVariant }}>
        <Tabs
          value={activeCategoryId ?? false}
          onChange={(_e, val: string | false) => onCategoryChange(val === false ? null : val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t.allCategories} value={false} />
          {categories.map(cat => (
            <Tab key={cat.id} label={cat.name ?? ""} value={cat.id ?? ""} />
          ))}
        </Tabs>
      </Box>

      <MobileCardList
        rows={filteredSubjects}
        loading={isLoading}
        emptyMessage={t.noSubjects}
        getKey={subject => subject.id ?? ""}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={subject => (
          <SubjectCardMobile
            subject={subject}
            onEdit={() => onEditSubject(subject.id ?? "")}
            onDelete={() => onDeleteSubject(subject.id ?? "")}
            onClick={() => onSubjectClick(subject.id ?? "")}
            canManage={canManageSubjects}
          />
        )}
      />
    </MobilePageContainer>
  );
}
