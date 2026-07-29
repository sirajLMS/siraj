"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type { ParentAdminData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { ProfilePersonalSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection";
import type { ProfilePersonalFieldLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { ProfileParentLabels } from "@/shared/locale/types/profile";

const PARENT_PERSONAL_FIELDS = {
  nationality: true,
  address: true,
} as const;

function toParentPersonalFieldLabels(labels: ProfileParentLabels): ProfilePersonalFieldLabels {
  return {
    nationality: labels.fields.nationality,
    address: labels.fields.address,
    dateOfBirth: "",
    gender: "",
    male: "",
    female: "",
    qualifications: "",
  };
}

type IdentitySectionProps =
  | {
      readonly mode: "view";
      readonly labels: ProfileParentLabels;
      readonly scope?: ProfileScope;
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly labels: ProfileParentLabels;
      readonly scope?: ProfileScope;
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

export function IdentitySection(props: IdentitySectionProps) {
  const t = props.labels;
  const fieldLabels = toParentPersonalFieldLabels(t);

  if (props.mode === "edit") {
    return (
      <ProfilePersonalSection
        mode="edit"
        scope={props.scope}
        fieldGroupKey="parent_identity"
        sectionTitle={t.sections.identity}
        fieldLabels={fieldLabels}
        fields={PARENT_PERSONAL_FIELDS}
        register={props.register}
        control={props.control}
      />
    );
  }

  return (
    <ProfilePersonalSection
      mode="view"
      scope={props.scope}
      fieldGroupKey="parent_identity"
      sectionTitle={t.sections.identity}
      fieldLabels={fieldLabels}
      fields={PARENT_PERSONAL_FIELDS}
      nationality={props.adminData.nationality}
      address={props.adminData.address}
    />
  );
}
