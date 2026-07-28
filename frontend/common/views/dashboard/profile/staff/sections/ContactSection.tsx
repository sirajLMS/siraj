"use client";

import type { Control } from "react-hook-form";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CoreContactSection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection";
import type {
  StaffProfileData,
  StaffSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly labels: StaffSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly staffData: StaffProfileData;
    }
  | {
      readonly mode: "edit";
      readonly labels: StaffSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly control: Control<StaffAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const { staff: t, baseLabels } = props.labels;

  if (props.mode === "edit") {
    return (
      <CoreContactSection
        mode="edit"
        scope={props.scope}
        sectionTitle={t.sections.contact}
        phoneLabel={t.fields.phone}
        baseLabels={baseLabels}
        control={props.control}
      />
    );
  }

  return (
    <CoreContactSection
      mode="view"
      scope={props.scope}
      phone={props.staffData.phone}
      sectionTitle={t.sections.contact}
      phoneLabel={t.fields.phone}
      baseLabels={baseLabels}
    />
  );
}
