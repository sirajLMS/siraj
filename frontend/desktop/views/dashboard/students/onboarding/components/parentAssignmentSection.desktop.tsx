"use client";

import type { Control, FieldErrors } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import {
  ParentAssignmentSectionShared,
  type ParentAssignmentSectionSharedOptions,
} from "@/frontend/common/views/dashboard/students/onboarding/components/__shared__/parentAssignmentSectionShared";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { ParentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

interface ParentAssignmentSectionProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly parentLocked: boolean;
  readonly sectionTitle: string;
  readonly labels: {
    readonly parent: string;
    readonly parentPlaceholder: string;
    readonly parentRequired: string;
  };
}

const DESKTOP_OPTIONS: ParentAssignmentSectionSharedOptions = {
  Panel: SectionPanel,
  ParentAutocomplete: ParentAutocompleteDesktop,
  boxSx: theme => ({ p: theme.layout.cardPadding }),
};

export function ParentAssignmentSection({
  control,
  errors,
  parentLocked,
  sectionTitle,
  labels,
}: Readonly<ParentAssignmentSectionProps>) {
  return (
    <ParentAssignmentSectionShared
      control={control}
      errors={errors}
      parentLocked={parentLocked}
      sectionTitle={sectionTitle}
      labels={labels}
      options={DESKTOP_OPTIONS}
    />
  );
}
