"use client";

import type { Control } from "react-hook-form";
import { CoreContactSection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection";
import type { StaffSectionLabelsBundle } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

type ContactSectionProps = {
  readonly mode: "edit";
  readonly labels: StaffSectionLabelsBundle;
  readonly scope?: ProfileScope;
  readonly control: Control<StaffAdminEditFormData>;
};

export function ContactSection(props: ContactSectionProps) {
  const { staff: t, baseLabels } = props.labels;

  return (
    <CoreContactSection
      mode={props.mode}
      scope={props.scope}
      sectionTitle={t.sections.contact}
      phoneLabel={t.fields.phone}
      timezoneLabel={t.fields.timezone}
      baseLabels={baseLabels}
      control={props.control}
    />
  );
}
