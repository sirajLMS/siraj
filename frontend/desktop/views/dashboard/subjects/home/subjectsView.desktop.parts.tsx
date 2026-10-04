"use client";

import { Box, Grid, Typography } from "@mui/material";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { SubjectCardDesktop } from "@/frontend/desktop/views/dashboard/subjects/home/components/subjectCard.desktop";

type SubjectsGridAreaProps = Pick<
  SubjectsViewProps,
  | "labels"
  | "filteredSubjects"
  | "isLoading"
  | "onEditSubject"
  | "onDeleteSubject"
  | "onSubjectClick"
  | "canManageSubjects"
>;

export function SubjectsGridArea({
  labels,
  filteredSubjects,
  isLoading,
  onEditSubject,
  onDeleteSubject,
  onSubjectClick,
  canManageSubjects,
}: Readonly<SubjectsGridAreaProps>) {
  const t = labels;

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
}
