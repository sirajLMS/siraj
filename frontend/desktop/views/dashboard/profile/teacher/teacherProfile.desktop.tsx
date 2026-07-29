"use client";

import { Box, Grid, Stack } from "@mui/material";
import { ProfileMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { StatsSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/StatsSection";
import {
  toTeacherPersonalFieldLabels,
  toTeacherSectionLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import {
  hasTeacherAdminOnlyData,
  hasTeacherCompensationData,
  hasTeacherPersonalData,
  hasTeacherStatsData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates";
import { isTeacherAdminData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherNonProfileTabContent } from "@/frontend/common/views/dashboard/profile/teacher/TeacherNonProfileTabContent";
import { TeacherProfileEditBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";

export function TeacherProfileDesktopView({
  labels,
  teacherData,
  avatarUrl,
  displayCurrency,
  profilePhone,
  profileTimezone,
  isAdminScope,
  mode,
  scope,
  targetUserId,
  activeTab,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
}: Readonly<TeacherProfileViewModel>) {
  const sectionLabels = toTeacherSectionLabels(labels);
  const personalFieldLabels = toTeacherPersonalFieldLabels(labels);

  if (activeTab !== "profile") {
    return <TeacherNonProfileTabContent activeTab={activeTab} scope={scope} targetUserId={targetUserId} />;
  }

  if (!teacherData) {
    return null;
  }

  if (mode === ProfileMode.Edit) {
    return (
      <TeacherProfileEditBody
        labels={labels}
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
  const showExtension = hasTeacherPersonalData(teacherData);
  const showAdminOnly = isAdminScope && adminData != null && hasTeacherAdminOnlyData(adminData);
  const showStats = hasTeacherStatsData(teacherData);

  return (
    <Box data-testid="teacher-profile-view">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <UserDetailsProfileSection
            scope={scope}
            sectionTitle={labels.teacher.sections.contact}
            phoneLabel={labels.teacher.fields.phone}
            timezoneLabel={labels.teacher.fields.timezone}
            currencyLabel={labels.teacher.fields.displayCurrency}
            phone={profilePhone ?? teacherData.phone}
            timezone={profileTimezone ?? teacherData.timezone}
            displayCurrency={displayCurrency}
            baseLabels={sectionLabels.baseLabels}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            {showCompensation ? (
              <CompensationSection labels={labels} mode="view" teacherData={teacherData} subjectUserId={targetUserId} />
            ) : null}
            {showExtension ? (
              <TeacherExtensionProfileSection
                mode="view"
                scope={scope}
                labels={{
                  teacher: labels.teacher,
                  personalFieldLabels,
                  baseLabels: sectionLabels.baseLabels,
                }}
                sectionTitle={labels.teacher.sections.identity}
                nationality={teacherData.nationality}
                address={adminData?.address ?? teacherData.address}
                dateOfBirth={adminData?.dateOfBirth ?? teacherData.dateOfBirth}
                gender={adminData?.gender ?? teacherData.gender}
                qualifications={adminData?.qualifications ?? teacherData.qualifications}
              />
            ) : null}
            {showAdminOnly && adminData ? (
              <AdminOnlySection labels={sectionLabels} mode="view" adminData={adminData} />
            ) : null}
            {showStats ? <StatsSection labels={labels} teacherData={teacherData} isAdminScope={isAdminScope} /> : null}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
