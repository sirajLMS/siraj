"use client";

import { Stack } from "@mui/material";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentParentAssignmentProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentParentAssignmentProfileSection";
import { StudentProfileUserDetailsSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileUserDetailsSection";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentPortalProfileLabels } from "@/shared/locale/types/dashboard/studentPortal/studentProfile";
import type { ProfileLabels, ProfileParentLabels, ProfileTeacherLabels } from "@/shared/locale/types/profile";

type StudentUserProfileTabContentProps = {
  readonly profile: StudentProfileRow;
  readonly scope: ProfileScope;
  readonly labels: StudentPortalProfileLabels;
  readonly parentLabels: ProfileParentLabels;
  readonly teacherLabels: ProfileTeacherLabels;
  readonly baseLabels: ProfileLabels;
  readonly formattedDateOfBirth?: string;
};

export function StudentUserProfileTabContent({
  profile,
  scope,
  labels,
  parentLabels,
  teacherLabels,
  baseLabels,
  formattedDateOfBirth,
}: Readonly<StudentUserProfileTabContentProps>) {
  const sectionProps = {
    profile,
    labels,
    notSetLabel: baseLabels.notSet,
    timezoneLabel: parentLabels.fields.timezone,
    enforceFieldAccess: scope !== ProfileScope.Own,
  };

  return (
    <Stack spacing={3}>
      <StudentProfileUserDetailsSection
        profile={profile}
        scope={scope}
        sectionTitle={parentLabels.sections.contact}
        phoneLabel={labels.phone}
        timezoneLabel={parentLabels.fields.timezone}
        currencyLabel={teacherLabels.fields.displayCurrency}
        baseLabels={{ notSet: baseLabels.notSet, fieldAccess: baseLabels.fieldAccess, actions: baseLabels.actions }}
      />
      <StudentExtensionProfileSection
        {...sectionProps}
        sectionTitle={labels.personalInfo}
        formattedDateOfBirth={formattedDateOfBirth}
      />
      <StudentParentAssignmentProfileSection {...sectionProps} sectionTitle={labels.parentInfo} />
    </Stack>
  );
}
