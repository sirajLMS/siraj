"use client";

import { Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { type PersonOption, resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { ParentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

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

export function ParentAssignmentSection({
  control,
  errors,
  parentLocked,
  sectionTitle,
  labels,
}: Readonly<ParentAssignmentSectionProps>) {
  return (
    <MobileSectionPanel title={sectionTitle} contentInset={false}>
      <Box sx={theme => ({ p: theme.layout.cardPadding })}>
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => {
            const selectedParent: PersonOption | null = field.value
              ? resolvePersonOption(field.value, [], { id: field.value, name: "" })
              : null;

            return (
              <ParentAutocompleteMobile
                value={selectedParent}
                disabled={parentLocked}
                label={labels.parent}
                placeholder={labels.parentPlaceholder}
                error={Boolean(errors.parentId)}
                helperText={errors.parentId ? labels.parentRequired : undefined}
                onChange={person => {
                  field.onChange(person?.id ?? "");
                }}
              />
            );
          }}
        />
      </Box>
    </MobileSectionPanel>
  );
}
