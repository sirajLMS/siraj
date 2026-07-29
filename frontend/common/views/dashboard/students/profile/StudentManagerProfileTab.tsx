"use client";

import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentParentAssignmentProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentParentAssignmentProfileSection";
import { StudentProfileUserDetailsSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentProfileUserDetailsSection";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import { Stack } from "@mui/material";
import { Translation, useAppTranslation } from "@/shared/locale";

function toStudentProfileRow(profile: StudentProfileQueryData): StudentProfileRow {
  return {
    id: profile.id ?? "",
    name: profile.name ?? "",
    status: profile.status ?? "",
    avatarUrl: profile.avatarUrl ?? null,
    dateOfBirth: profile.dateOfBirth ?? null,
    gender: profile.gender ?? null,
    language: profile.language ?? null,
    timezoneOverride: profile.timezoneOverride ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    timezone: profile.timezone ?? null,
    displayCurrency: profile.displayCurrency ?? null,
    parentId: profile.parentId ?? null,
    parentUserId: profile.parentUserId ?? null,
    parentName: profile.parentName ?? null,
    parentEmail: profile.parentEmail ?? null,
    parentPhone: profile.parentPhone ?? null,
    isAssociatedViewer: profile.isAssociatedViewer ?? false,
    primaryTeacherId: profile.primaryTeacherId ?? null,
    teacherUserId: profile.teacherUserId ?? null,
    teacherName: profile.teacherName ?? null,
    hoursPerWeek: profile.hoursPerWeek ?? null,
    classesRemaining: profile.classesRemaining ?? 0,
    classesTotal: profile.classesTotal ?? 0,
    version: profile.version ?? 0,
    createdAt: profile.createdAt ?? null,
    updatedAt: profile.updatedAt ?? null,
  };
}

export function StudentManagerProfileTab() {
  const profileContext = useStudentProfileContext();
  const profile = profileContext?.profile;
  const labels = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const teacherLabels = useAppTranslation(Translation.Profile.Teacher);
  const baseLabels = useAppTranslation(Translation.Profile.Base);

  if (!profile) {
    return null;
  }

  const studentProfile = toStudentProfileRow(profile);
  const sectionProps = {
    profile: studentProfile,
    labels,
    notSetLabel: baseLabels.notSet,
    timezoneLabel: parentLabels.fields.timezone,
    enforceFieldAccess: true,
  };

  return (
    <Stack spacing={3}>
      <StudentProfileUserDetailsSection
        profile={studentProfile}
        scope={ProfileScope.Other}
        sectionTitle={parentLabels.sections.contact}
        phoneLabel={labels.phone}
        timezoneLabel={parentLabels.fields.timezone}
        currencyLabel={teacherLabels.fields.displayCurrency}
        baseLabels={{ notSet: baseLabels.notSet, fieldAccess: baseLabels.fieldAccess }}
      />
      <StudentExtensionProfileSection {...sectionProps} sectionTitle={labels.personalInfo} />
      <StudentParentAssignmentProfileSection {...sectionProps} sectionTitle={labels.parentInfo} />
    </Stack>
  );
}
