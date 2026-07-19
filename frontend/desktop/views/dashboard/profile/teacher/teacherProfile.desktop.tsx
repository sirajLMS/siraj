"use client";

import { Box, Grid, Stack } from "@mui/material";
import { ProfileMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import { StatsSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/StatsSection";
import {
  hasTeacherCompensationData,
  hasTeacherIdentityData,
  hasTeacherStatsData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates";
import { isTeacherAdminData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherNonProfileTabContent } from "@/frontend/common/views/dashboard/profile/teacher/TeacherNonProfileTabContent";
import { TeacherProfileEditBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";

export function TeacherProfileDesktopView({
  teacherData,
  avatarUrl,
  displayCurrency,
  isAdminScope,
  mode,
  scope,
  targetUserId,
  activeTab,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
}: Readonly<TeacherProfileViewModel>) {
  if (activeTab !== "profile") {
    return <TeacherNonProfileTabContent activeTab={activeTab} scope={scope} targetUserId={targetUserId} />;
  }

  if (!teacherData) {
    return null;
  }

  if (mode === ProfileMode.Edit) {
    return (
      <TeacherProfileEditBody
        teacherData={teacherData}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        scope={scope}
        targetUserId={targetUserId}
        isSaving={isSaving}
        onSubmitOwn={onSubmitOwn}
        onSubmitAdmin={onSubmitAdmin}
      />
    );
  }

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  const showCompensation = hasTeacherCompensationData(teacherData);
  const showAdminOnly = isAdminScope && adminData != null && hasTeacherIdentityData(adminData);
  const showStats = hasTeacherStatsData(teacherData);

  return (
    <Box data-testid="teacher-profile-view">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ContactSection mode="view" scope={scope} teacherData={teacherData} isAdminScope={isAdminScope} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            {showCompensation ? (
              <CompensationSection mode="view" teacherData={teacherData} subjectUserId={targetUserId} />
            ) : null}
            {showAdminOnly && adminData ? <AdminOnlySection mode="view" adminData={adminData} /> : null}
            {showStats ? <StatsSection teacherData={teacherData} isAdminScope={isAdminScope} /> : null}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
