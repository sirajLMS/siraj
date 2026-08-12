"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { TeacherProfileSharedSections } from "@/frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileShared";
import { TeacherProfileShared } from "@/frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileShared";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { MobileContentStack } from "@/frontend/mobile/components/ui";

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
      <TeacherProfileShared vm={props} options={{ renderView: renderMobileView }} />
    </Box>
  );
}
