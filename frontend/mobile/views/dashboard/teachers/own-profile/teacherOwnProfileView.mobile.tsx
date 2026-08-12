"use client";

import { Paper, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { TeacherOwnProfileShared } from "@/frontend/common/views/dashboard/teachers/own-profile/__shared__/teacherOwnProfileShared";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

function MobileProfileLayout({ children }: { readonly children: ReactNode }) {
  return <Stack spacing={3}>{children}</Stack>;
}

function MobileProfileSection({ children }: { readonly children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {children}
    </Paper>
  );
}

export function TeacherOwnProfileMobileView({ ...vm }: Readonly<TeacherOwnProfileViewModel>) {
  return (
    <TeacherOwnProfileShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        ProfileLayout: MobileProfileLayout,
        ProfileSection: MobileProfileSection,
      }}
    />
  );
}

export default TeacherOwnProfileMobileView;
