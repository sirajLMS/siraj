"use client";

import { Box, Grid, Stack } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentParentAssignmentProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentParentAssignmentProfileSection";
import { StudentProfileEditBody } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileEditBody";
import { StudentProfileUserDetailsSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileUserDetailsSection";
import { StudentUserProfileTabContent } from "@/frontend/common/views/dashboard/student/profile/sections/StudentUserProfileTabContent";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

function StudentOwnProfileView({
  profile,
  labels,
  formattedDateOfBirth,
}: Readonly<{
  profile: NonNullable<StudentProfileViewModel["profile"]>;
  labels: StudentProfileViewModel["labels"];
  formattedDateOfBirth: string;
}>) {
  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const baseLabels = useAppTranslation(Translation.Profile.Base);
  const notSetLabel = baseLabels.notSet;

  const sectionBase = {
    profile,
    labels,
    notSetLabel,
    timezoneLabel: parentLabels.fields.timezone,
    enforceFieldAccess: false,
  };

  const teacherLabels = useAppTranslation(Translation.Profile.Teacher);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          <StudentProfileUserDetailsSection
            profile={profile}
            scope={ProfileScope.Own}
            sectionTitle={parentLabels.sections.contact}
            phoneLabel={labels.phone}
            timezoneLabel={parentLabels.fields.timezone}
            currencyLabel={teacherLabels.fields.displayCurrency}
            baseLabels={{ notSet: notSetLabel, fieldAccess: baseLabels.fieldAccess, actions: baseLabels.actions }}
          />
          <StudentExtensionProfileSection
            {...sectionBase}
            sectionTitle={labels.personalInfo}
            formattedDateOfBirth={formattedDateOfBirth}
          />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <StudentParentAssignmentProfileSection {...sectionBase} sectionTitle={labels.parentInfo} />
      </Grid>
    </Grid>
  );
}

export function StudentProfileDesktopView({
  profile,
  labels,
  loading,
  saving,
  draft,
  formattedDateOfBirth,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  scope,
  mode,
  activeTab,
  isOtherScope,
  onDraftChange,
  onSave,
  onSnackbarClose,
  onUploadAvatar,
}: Readonly<StudentProfileViewModel>) {
  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const baseLabels = useAppTranslation(Translation.Profile.Base);
  const teacherLabels = useAppTranslation(Translation.Profile.Teacher);

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading || !profile) {
    return <Box sx={{ p: 3 }}>{labels.loadingMessage}</Box>;
  }

  if (isOtherScope) {
    return (
      <StudentUserProfileTabContent
        profile={profile}
        scope={ProfileScope.Other}
        labels={labels}
        parentLabels={parentLabels}
        teacherLabels={teacherLabels}
        baseLabels={baseLabels}
        formattedDateOfBirth={formattedDateOfBirth}
      />
    );
  }

  if (mode === ProfileMode.Edit) {
    return (
      <StudentProfileEditBody
        profile={profile}
        labels={labels}
        draft={draft}
        saving={saving}
        snackbarOpen={snackbarOpen}
        snackbarMessage={snackbarMessage}
        snackbarSeverity={snackbarSeverity}
        onDraftChange={onDraftChange}
        onSave={onSave}
        onSnackbarClose={onSnackbarClose}
        onUploadAvatar={onUploadAvatar}
      />
    );
  }

  return <StudentOwnProfileView profile={profile} labels={labels} formattedDateOfBirth={formattedDateOfBirth} />;
}
