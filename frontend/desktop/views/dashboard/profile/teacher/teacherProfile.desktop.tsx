"use client";

import { Box, Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import {
  TeacherProfileShared,
  type TeacherProfileSharedSections,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileShared";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";

function renderDesktopView(sections: TeacherProfileSharedSections): ReactNode {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>{sections.userDetails}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={3}>
          {sections.compensation}
          {sections.extension}
          {sections.adminOnly}
          {sections.stats}
        </Stack>
      </Grid>
    </Grid>
  );
}

export function TeacherProfileDesktopView(props: Readonly<TeacherProfileViewModel>) {
  return (
    <Box data-testid="teacher-profile-view">
      <TeacherProfileShared vm={props} options={{ renderView: renderDesktopView }} />
    </Box>
  );
}
