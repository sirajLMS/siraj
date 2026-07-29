"use client";

import { Box } from "@mui/material";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { MobileAppDataGridLoadingOverlay, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { AssociatedStudentsCardListMobile } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsCardList.mobile";

function StudentsLoadingState() {
  return (
    <Box sx={{ minHeight: 220, position: "relative" }}>
      <MobileAppDataGridLoadingOverlay />
    </Box>
  );
}

export function AssociatedStudentsSectionMobileView({
  labels,
  rows,
  loading,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  return (
    <MobileSectionPanel title={labels.parent.sections.students} edgeToEdge>
      <Box sx={{ px: 2, py: 2.5 }}>
        {loading ? <StudentsLoadingState /> : <AssociatedStudentsCardListMobile rows={rows} labels={labels} />}
      </Box>
    </MobileSectionPanel>
  );
}
