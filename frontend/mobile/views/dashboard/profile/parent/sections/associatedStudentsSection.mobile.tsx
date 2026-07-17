"use client";

import { Box } from "@mui/material";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { MobileAppDataGridLoadingOverlay, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { AssociatedStudentsCardListMobile } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsCardList.mobile";
import { useAppTranslation } from "@/shared/locale";

function StudentsLoadingState() {
  return (
    <Box sx={{ minHeight: 220, position: "relative" }}>
      <MobileAppDataGridLoadingOverlay />
    </Box>
  );
}

export function AssociatedStudentsSectionMobileView({
  rows,
  loading,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  const t = useAppTranslation().profileTranslations.parent;
  return (
    <MobileSectionPanel title={t.sections.students} edgeToEdge>
      <Box sx={{ px: 2, py: 2.5 }}>
        {loading ? <StudentsLoadingState /> : <AssociatedStudentsCardListMobile rows={rows} />}
      </Box>
    </MobileSectionPanel>
  );
}
