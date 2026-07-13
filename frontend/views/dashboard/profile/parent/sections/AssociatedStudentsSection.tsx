"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AppDataGridLoadingOverlay, SectionPanel } from "@/frontend/common/components/ui";
import { AssociatedStudentsCardList } from "@/frontend/views/dashboard/profile/parent/sections/AssociatedStudentsCardList";
import { AssociatedStudentsDataGrid } from "@/frontend/views/dashboard/profile/parent/sections/AssociatedStudentsDataGrid";
import type { AssociatedStudents } from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";

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
  const t = useTranslations("profile.parent");
  const rows = associatedStudents?.rows ?? [];

  if (loading && !associatedStudents) {
    return (
      <SectionPanel title={t("sections.students")}>
        <StudentsLoadingState />
      </SectionPanel>
    );
  }

  if (rows.length === 0) {
    return (
      <SectionPanel title={t("sections.students")}>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {t("students.empty")}
        </Typography>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.students")} edgeToEdge>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <AssociatedStudentsDataGrid rows={rows} loading={loading} emptyMessage={t("students.empty")} />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" }, px: { xs: 2, md: 3 }, py: 2.5 }}>
        {loading ? <StudentsLoadingState /> : <AssociatedStudentsCardList rows={rows} />}
      </Box>
    </SectionPanel>
  );
}
