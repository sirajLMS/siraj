"use client";

import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import {
  type StudentOwnProfileSections,
  type StudentProfileSharedOptions,
  StudentProfileSharedView,
} from "@/frontend/common/views/dashboard/student/profile/__shared__/studentProfileShared";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";

function renderMobileOwnView(sections: StudentOwnProfileSections): ReactNode {
  return (
    <Stack spacing={3}>
      {sections.userDetails}
      {sections.extension}
      {sections.hasParentName ? sections.parentAssignment : null}
      {sections.adminOnly}
    </Stack>
  );
}

function renderMobileLoading(message: string): ReactNode {
  return <Stack sx={{ p: 3 }}>{message}</Stack>;
}

const MOBILE_OPTIONS: StudentProfileSharedOptions = {
  renderOwnView: renderMobileOwnView,
  renderLoading: renderMobileLoading,
};

export function StudentProfileMobileView(props: Readonly<StudentProfileViewModel>) {
  return <StudentProfileSharedView viewModel={props} options={MOBILE_OPTIONS} />;
}
