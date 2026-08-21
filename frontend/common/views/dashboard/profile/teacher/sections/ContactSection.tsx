"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { CoreContactSection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type {
  TeacherAdminEditFormData,
  TeacherOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

type ContactSectionLabels = Pick<TeacherProfileViewLabels, "teacher"> & {
  readonly baseLabels: ProfileSharedBaseLabels;
};

type ContactSectionOwnEditProps = {
  readonly labels: ContactSectionLabels;
  readonly scope?: ProfileScope;
  readonly isAdminScope: false;
  readonly register: UseFormRegister<TeacherOwnEditFormData>;
  readonly control: Control<TeacherOwnEditFormData>;
};

type ContactSectionAdminEditProps = {
  readonly labels: ContactSectionLabels;
  readonly scope?: ProfileScope;
  readonly isAdminScope: true;
  readonly register: UseFormRegister<TeacherAdminEditFormData>;
  readonly control: Control<TeacherAdminEditFormData>;
};

type ContactSectionProps = ContactSectionOwnEditProps | ContactSectionAdminEditProps;

export function ContactSection(props: ContactSectionProps) {
  const t = props.labels.teacher;

  return (
    <CoreContactSection
      mode="edit"
      scope={props.scope}
      sectionTitle={t.sections.contact}
      phoneLabel={t.fields.phone}
      timezoneLabel={t.fields.timezone}
      baseLabels={props.labels.baseLabels}
      control={props.control}
    />
  );
}
