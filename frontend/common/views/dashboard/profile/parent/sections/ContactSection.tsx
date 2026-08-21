"use client";

import type { Control } from "react-hook-form";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type { ParentSectionLabelsBundle } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { CoreContactSection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection";
import type { ProfileScope } from "@/shared/constants/profile.enum";

type ContactSectionProps = {
  readonly mode: "edit";
  readonly labels: ParentSectionLabelsBundle;
  readonly scope?: ProfileScope;
  readonly control: Control<ParentAdminEditFormData>;
};

export function ContactSection(props: ContactSectionProps) {
  const { parent: t, baseLabels } = props.labels;

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
