import type { ReactNode } from "react";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/student/profile/sections/AdminOnlySection";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentParentAssignmentProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentParentAssignmentProfileSection";
import { StudentProfileEditBody } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileEditBody";
import { StudentProfileUserDetailsSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileUserDetailsSection";
import { StudentUserProfileTabContent } from "@/frontend/common/views/dashboard/student/profile/sections/StudentUserProfileTabContent";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

type StudentProfile = NonNullable<StudentProfileViewModel["profile"]>;
type StudentLabels = StudentProfileViewModel["labels"];

export interface StudentOwnProfileSections {
  userDetails: ReactNode;
  extension: ReactNode;
  parentAssignment: ReactNode;
  adminOnly: ReactNode;
  hasParentName: boolean;
}

export interface StudentProfileSharedOptions {
  /** Render the own-profile sections in a layout-specific container (Grid for desktop, Stack for mobile). */
  renderOwnView: (sections: StudentOwnProfileSections) => ReactNode;
  /** Loading element wrapper (Box for desktop, Stack for mobile). */
  renderLoading: (message: string) => ReactNode;
}

export function StudentOwnProfileShared({
  profile,
  labels,
  formattedDateOfBirth,
  options,
}: Readonly<{
  profile: StudentProfile;
  labels: StudentLabels;
  formattedDateOfBirth: string;
  options: Readonly<StudentProfileSharedOptions>;
}>) {
  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const baseLabels = useAppTranslation(Translation.Profile.Base);
  const teacherLabels = useAppTranslation(Translation.Profile.Teacher);
  const notSetLabel = baseLabels.notSet;

  const sectionBase = {
    profile,
    labels,
    notSetLabel,
    timezoneLabel: parentLabels.fields.timezone,
    enforceFieldAccess: false,
  };

  const adminOnlyLabels = {
    baseLabels: {
      notSet: baseLabels.notSet,
      fieldAccess: baseLabels.fieldAccess,
      actions: baseLabels.actions,
    },
  };

  return options.renderOwnView({
    userDetails: (
      <StudentProfileUserDetailsSection
        profile={profile}
        scope={ProfileScope.Own}
        sectionTitle={parentLabels.sections.contact}
        phoneLabel={labels.phone}
        timezoneLabel={parentLabels.fields.timezone}
        currencyLabel={teacherLabels.fields.displayCurrency}
        baseLabels={{ notSet: notSetLabel, fieldAccess: baseLabels.fieldAccess, actions: baseLabels.actions }}
      />
    ),
    extension: (
      <StudentExtensionProfileSection
        {...sectionBase}
        sectionTitle={labels.personalInfo}
        formattedDateOfBirth={formattedDateOfBirth}
      />
    ),
    parentAssignment: <StudentParentAssignmentProfileSection {...sectionBase} sectionTitle={labels.parentInfo} />,
    adminOnly: <AdminOnlySection mode="view" labels={adminOnlyLabels} profile={profile} />,
    hasParentName: Boolean(profile.parentName),
  });
}

export function StudentProfileSharedView({
  viewModel,
  options,
}: Readonly<{ viewModel: StudentProfileViewModel; options: StudentProfileSharedOptions }>) {
  const { profile, labels, loading, formattedDateOfBirth, scope, mode, activeTab, isOtherScope } = viewModel;
  const { renderLoading } = options;

  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const baseLabels = useAppTranslation(Translation.Profile.Base);
  const teacherLabels = useAppTranslation(Translation.Profile.Teacher);

  let content: ReactNode;
  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    content = <NotificationPreferencesTab isActive />;
  } else if (activeTab !== "profile") {
    content = null;
  } else if (loading || !profile) {
    content = renderLoading(labels.loadingMessage);
  } else if (isOtherScope) {
    content = (
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
  } else if (mode === ProfileMode.Edit) {
    content = (
      <StudentProfileEditBody
        profile={profile}
        labels={labels}
        draft={viewModel.draft}
        saving={viewModel.saving}
        snackbarOpen={viewModel.snackbarOpen}
        snackbarMessage={viewModel.snackbarMessage}
        snackbarSeverity={viewModel.snackbarSeverity}
        onDraftChange={viewModel.onDraftChange}
        onSave={viewModel.onSave}
        onSnackbarClose={viewModel.onSnackbarClose}
        onUploadAvatar={viewModel.onUploadAvatar}
      />
    );
  } else {
    content = (
      <StudentOwnProfileShared
        profile={profile}
        labels={labels}
        formattedDateOfBirth={formattedDateOfBirth}
        options={options}
      />
    );
  }
  return content;
}
