"use client";

import { Box } from "@mui/material";
import { AppDataGridLoadingOverlay, SectionPanel } from "@/frontend/common/components/ui";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AssociatedStudentsCardListMobile } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsCardList.mobile";
import { useAppTranslation } from "@/shared/locale";

function StudentsLoadingState() {
  return (
    <Box sx={{ minHeight: 220, position: "relative" }}>
      <AppDataGridLoadingOverlay />
    </Box>
  );
}

export function AssociatedStudentsSectionMobileView({
  rows,
  loading,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  const t = useAppTranslation().profileTranslations.parent;
  return (
    <SectionPanel title={t.sections.students} edgeToEdge>
      <Box sx={{ px: 2, py: 2.5 }}>
        {loading ? <StudentsLoadingState /> : <AssociatedStudentsCardListMobile rows={rows} />}
      </Box>
    </SectionPanel>
  );
}
