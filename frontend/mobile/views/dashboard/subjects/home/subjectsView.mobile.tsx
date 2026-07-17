"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Button, Grid, Tab, Tabs, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { CategoriesSectionMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/categoriesSection.mobile";
import { SubjectCardMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/subjectCard.mobile";
import { useAppTranslation } from "@/shared/locale";

export function SubjectsViewMobile({
  categories,
  subjects,
  isLoading,
  activeCategoryId,
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
  const categoriesSectionOpen = useSubjectManagementStore(state => state.categoriesSectionOpen);
  const toggleCategoriesSection = useSubjectManagementStore(state => state.toggleCategoriesSection);

  const filteredSubjects = activeCategoryId ? subjects.filter(s => s.category?.id === activeCategoryId) : subjects;

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
            <PrimaryPageAction onClick={onAddSubject} startIcon={<AddOutlined />}>
              {t.addSubject}
            </PrimaryPageAction>
          ) : undefined
        }
      />

      {canManageCategories && (
        <Button variant="outlined" onClick={toggleCategoriesSection} sx={{ alignSelf: "flex-start" }}>
          {categoriesSectionOpen ? t.hideCategories : t.manageCategories}
        </Button>
      )}

      {categoriesSectionOpen && canManageCategories && categoriesSection}

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
              <Grid key={subject.id} size={{ xs: 12, sm: 6 }}>
                <SubjectCardMobile
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
    </MobilePageContainer>
  );
}
