"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import type { Gender, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfilePersonalSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection";
import type {
  ProfilePersonalFieldLabels,
  ProfileSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type {
  TeacherAdminEditFormData,
  TeacherOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";

type TeacherExtensionFormFields = {
  nationality?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender | null;
  qualifications?: string;
};

const TEACHER_EXTENSION_FIELDS = {
  nationality: true,
  address: true,
  dateOfBirth: true,
  gender: true,
  qualifications: true,
} as const;

type TeacherExtensionLabels = Pick<TeacherProfileViewLabels, "teacher"> & {
  readonly personalFieldLabels: ProfilePersonalFieldLabels;
  readonly baseLabels: ProfileSharedBaseLabels;
};

type TeacherExtensionProfileSectionViewProps = {
  readonly mode: "view";
  readonly labels: TeacherExtensionLabels;
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: string | null;
  readonly qualifications?: string | null;
};

type TeacherExtensionProfileSectionEditProps<T extends TeacherExtensionFormFields> = {
  readonly mode: "edit";
  readonly labels: TeacherExtensionLabels;
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
};

type TeacherExtensionProfileSectionProps<T extends TeacherExtensionFormFields = TeacherAdminEditFormData | TeacherOwnEditFormData> =
  | TeacherExtensionProfileSectionViewProps
  | TeacherExtensionProfileSectionEditProps<T>;

/**
 * Teacher extension fields (nationality, address, DOB, gender, qualifications) —
 * mirrors onboarding `TeacherExtensionSection` personal fields.
 */
export function TeacherExtensionProfileSection<T extends TeacherExtensionFormFields>(
  props: Readonly<TeacherExtensionProfileSectionProps<T>>
) {
  const baseLabels = props.labels.baseLabels;

  if (props.mode === "edit") {
    return (
      <ProfilePersonalSection
        mode="edit"
        scope={props.scope}
        fieldGroupKey="teacher_identity"
        qualificationsFieldGroupKey="teacher_professional"
        sectionTitle={props.sectionTitle}
        fieldLabels={props.labels.personalFieldLabels}
        baseLabels={baseLabels}
        fields={TEACHER_EXTENSION_FIELDS}
        register={props.register}
        control={props.control}
      />
    );
  }

  return (
    <ProfilePersonalSection
      mode="view"
      scope={props.scope}
      fieldGroupKey="teacher_identity"
      qualificationsFieldGroupKey="teacher_professional"
      sectionTitle={props.sectionTitle}
      fieldLabels={props.labels.personalFieldLabels}
      baseLabels={baseLabels}
      fields={TEACHER_EXTENSION_FIELDS}
      nationality={props.nationality}
      address={props.address}
      dateOfBirth={props.dateOfBirth}
      gender={props.gender}
      qualifications={props.qualifications}
    />
  );
}
