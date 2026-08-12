"use client";

import { Box, Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import {
  type StudentOwnProfileSections,
  type StudentProfileSharedOptions,
  StudentProfileSharedView,
} from "@/frontend/common/views/dashboard/student/profile/__shared__/studentProfileShared";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";

function renderDesktopOwnView(sections: StudentOwnProfileSections): ReactNode {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          {sections.userDetails}
          {sections.extension}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        {sections.parentAssignment}
        {sections.adminOnly}
      </Grid>
    </Grid>
  );
}

function renderDesktopLoading(message: string): ReactNode {
  return <Box sx={{ p: 3 }}>{message}</Box>;
}

const DESKTOP_OPTIONS: StudentProfileSharedOptions = {
  renderOwnView: renderDesktopOwnView,
  renderLoading: renderDesktopLoading,
};

export function StudentProfileDesktopView(props: Readonly<StudentProfileViewModel>) {
  return <StudentProfileSharedView viewModel={props} options={DESKTOP_OPTIONS} />;
}
