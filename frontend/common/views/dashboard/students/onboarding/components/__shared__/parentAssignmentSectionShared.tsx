import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactNode } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import {
  type ParentAutocompleteProps,
  type PersonOption,
  resolvePersonOption,
} from "@/frontend/common/components/ui/input/userSelect";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

export interface ParentAssignmentSectionSharedOptions {
  readonly Panel: ComponentType<{
    readonly title?: ReactNode;
    readonly children?: ReactNode;
    readonly contentInset?: boolean;
  }>;
  readonly ParentAutocomplete: ComponentType<ParentAutocompleteProps>;
  readonly panelContentInset?: boolean;
  readonly boxSx: SxProps<Theme>;
}

interface ParentAssignmentSectionSharedProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly parentLocked: boolean;
  readonly sectionTitle: string;
  readonly labels: {
    readonly parent: string;
    readonly parentPlaceholder: string;
    readonly parentRequired: string;
  };
  readonly options: ParentAssignmentSectionSharedOptions;
}

export function ParentAssignmentSectionShared({
  control,
  errors,
  parentLocked,
  sectionTitle,
  labels,
  options,
}: Readonly<ParentAssignmentSectionSharedProps>) {
  const { Panel, ParentAutocomplete, panelContentInset, boxSx } = options;

  return (
    <Panel title={sectionTitle} contentInset={panelContentInset}>
      <Box sx={boxSx}>
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => {
            const selectedParent: PersonOption | null = field.value
              ? resolvePersonOption(field.value, [], { id: field.value, name: "" })
              : null;

            return (
              <ParentAutocomplete
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
    </Panel>
  );
}
