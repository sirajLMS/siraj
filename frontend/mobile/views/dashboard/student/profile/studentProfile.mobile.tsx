"use client";

import {
  AssignmentOutlined,
  CalendarTodayOutlined,
  PersonOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { Stack } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentParentAssignmentProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentParentAssignmentProfileSection";
import { StudentProfileEditBody } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileEditBody";
import { StudentProfileUserDetailsSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileUserDetailsSection";
import { StudentUserProfileTabContent } from "@/frontend/common/views/dashboard/student/profile/sections/StudentUserProfileTabContent";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { MobileMetricCardGrid, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { Translation, useAppTranslation } from "@/shared/locale";

function AcademicMetricsGrid({
  title,
  profile,
  labels,
}: Readonly<{
  title: string;
  profile: NonNullable<StudentProfileViewModel["profile"]>;
  labels: StudentProfileViewModel["labels"];
}>): React.ReactNode {
  const academicMetrics: readonly MetricItem[] = [
    {
      key: "teacher",
      label: labels.teacher,
      count: profile.teacherName ?? "—",
      icon: SchoolOutlined,
      labelKey: "teacher",
    },
    {
      key: "hoursPerWeek",
      label: labels.hoursPerWeek,
      count: profile.hoursPerWeek ?? 0,
      icon: CalendarTodayOutlined,
      labelKey: "hoursPerWeek",
    },
    {
      key: "classesRemaining",
      label: labels.classesRemaining,
      count: profile.classesRemaining ?? 0,
      icon: PersonOutlined,
      labelKey: "classesRemaining",
    },
    {
      key: "classesTotal",
      label: labels.classesTotal,
      count: profile.classesTotal ?? 0,
      icon: AssignmentOutlined,
      labelKey: "classesTotal",
    },
  ];

  return (
    <MobileSectionPanel title={title} contentInset={false}>
      <MobileMetricCardGrid metrics={academicMetrics} />
    </MobileSectionPanel>
  );
}

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
  const teacherLabels = useAppTranslation(Translation.Profile.Teacher);

  const sectionBase = {
    profile,
    labels,
    notSetLabel: baseLabels.notSet,
    timezoneLabel: parentLabels.fields.timezone,
    enforceFieldAccess: false,
  };

  return (
    <Stack spacing={3}>
      <StudentProfileUserDetailsSection
        profile={profile}
        scope={ProfileScope.Own}
        sectionTitle={parentLabels.sections.contact}
        phoneLabel={labels.phone}
        timezoneLabel={parentLabels.fields.timezone}
        currencyLabel={teacherLabels.fields.displayCurrency}
        baseLabels={{ notSet: baseLabels.notSet, fieldAccess: baseLabels.fieldAccess }}
      />
      <StudentExtensionProfileSection
        {...sectionBase}
        sectionTitle={labels.personalInfo}
        formattedDateOfBirth={formattedDateOfBirth}
      />
      {profile.parentName ? (
        <StudentParentAssignmentProfileSection {...sectionBase} sectionTitle={labels.parentInfo} />
      ) : null}
      <AcademicMetricsGrid title={labels.academicInfo} profile={profile} labels={labels} />
    </Stack>
  );
}

export function StudentProfileMobileView({
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
    return <Stack sx={{ p: 3 }}>{labels.loadingMessage}</Stack>;
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

  return (
    <StudentOwnProfileView profile={profile} labels={labels} formattedDateOfBirth={formattedDateOfBirth} />
  );
}
