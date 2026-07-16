"use client";

import { Box, Typography } from "@mui/material";
import { AppDataGridLoadingOverlay, SectionPanel } from "@/frontend/common/components/ui";
import { AssociatedStudentsCardList } from "@/frontend/common/views/dashboard/profile/parent/sections/AssociatedStudentsCardList";
import { AssociatedStudentsDataGrid } from "@/frontend/common/views/dashboard/profile/parent/sections/AssociatedStudentsDataGrid";
import type { AssociatedStudents } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { useAppTranslation } from "@/shared/locale/client";

type AssociatedStudentsSectionProps = {
  readonly associatedStudents: AssociatedStudents;
  readonly loading?: boolean;
};

function StudentsLoadingState() {
  return (
    <Box sx={{ minHeight: 220, position: "relative" }}>
      <AppDataGridLoadingOverlay />
    </Box>
  );
}

export function AssociatedStudentsSection({ associatedStudents, loading = false }: AssociatedStudentsSectionProps) {
  const t = useAppTranslation().profileTranslations.parent;
  const rows = associatedStudents?.rows ?? [];

  if (loading && !associatedStudents) {
    return (
      <SectionPanel title={t.sections.students}>
        <StudentsLoadingState />
      </SectionPanel>
    );
  }

  if (rows.length === 0) {
    return (
      <SectionPanel title={t.sections.students}>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {t.students.empty}
        </Typography>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t.sections.students} edgeToEdge>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <AssociatedStudentsDataGrid rows={rows} loading={loading} emptyMessage={t.students.empty} />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" }, px: { xs: 2, md: 3 }, py: 2.5 }}>
        {loading ? <StudentsLoadingState /> : <AssociatedStudentsCardList rows={rows} />}
      </Box>
    </SectionPanel>
  );
}
