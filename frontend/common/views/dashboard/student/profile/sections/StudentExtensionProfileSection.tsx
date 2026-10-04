"use client";

import { getIdentityFieldVisibility } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection.helpers";
import {
  StudentExtensionProfileEditSection,
  StudentExtensionProfileViewSection,
} from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection.parts";
import type {
  StudentProfileEditableSectionProps,
  StudentProfileSectionBaseProps,
} from "@/frontend/common/views/dashboard/student/profile/sections/studentProfileSection.types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";

type StudentExtensionProfileSectionProps = StudentProfileSectionBaseProps &
  Partial<Pick<StudentProfileEditableSectionProps, "isEditing" | "draft" | "onDraftChange">> & {
    readonly formattedDateOfBirth?: string;
    readonly timezoneOverrideLabel?: string;
  };

export function StudentExtensionProfileSection({
  profile,
  labels,
  sectionTitle,
  notSetLabel,
  enforceFieldAccess = false,
  isEditing = false,
  draft,
  onDraftChange,
  formattedDateOfBirth,
  timezoneOverrideLabel,
}: Readonly<StudentExtensionProfileSectionProps>) {
  const { canView, canViewField } = useStudentFieldAccess();
  const canViewIdentity = enforceFieldAccess ? canView("student_identity") : true;

  if (!canViewIdentity) {
    return null;
  }

  if (isEditing && draft && onDraftChange) {
    return (
      <StudentExtensionProfileEditSection
        sectionTitle={sectionTitle}
        labels={labels}
        draft={draft}
        onDraftChange={onDraftChange}
        timezoneOverrideLabel={timezoneOverrideLabel}
      />
    );
  }

  const visibility = getIdentityFieldVisibility(enforceFieldAccess, canViewField, timezoneOverrideLabel);

  return (
    <StudentExtensionProfileViewSection
      sectionTitle={sectionTitle}
      labels={labels}
      profile={profile}
      notSetLabel={notSetLabel}
      dateOfBirthDisplay={formattedDateOfBirth ?? profile.dateOfBirth ?? notSetLabel}
      timezoneOverrideLabel={timezoneOverrideLabel}
      {...visibility}
    />
  );
}
