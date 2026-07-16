"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import { CategoriesSection } from "@/frontend/common/views/dashboard/subjects/home/components/CategoriesSection";
import { SubjectCard } from "@/frontend/common/views/dashboard/subjects/home/components/SubjectCard";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale";

export function SubjectsViewDesktop({
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

  const filteredSubjects = activeCategoryId ? subjects.filter(s => s.category?.id === activeCategoryId) : subjects;

  const categoriesSection = (
    <CategoriesSection
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
    <PageContainer>
      <PageHeader
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

      {canManageCategories && categoriesSection}

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
              <Grid key={subject.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <SubjectCard
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
    </PageContainer>
  );
}
