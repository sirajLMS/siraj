"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  TeacherProfileShared,
  type TeacherProfileSharedSections,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileShared";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { MobileContentStack, MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

function renderStats(metrics: readonly MetricItem[]): ReactNode {
  return <MobileMetricCardGrid metrics={metrics} />;
}

function renderMobileView(sections: TeacherProfileSharedSections): ReactNode {
  return (
    <MobileContentStack>
      {sections.userDetails}
      {sections.compensation}
      {sections.extension}
      {sections.adminOnly}
      {sections.stats}
    </MobileContentStack>
  );
}

export function TeacherProfileMobileView(props: Readonly<TeacherProfileViewModel>) {
  return (
    <Box data-testid="teacher-profile-view">
      <TeacherProfileShared vm={props} options={{ renderView: renderMobileView, renderStats }} />
    </Box>
  );
}
