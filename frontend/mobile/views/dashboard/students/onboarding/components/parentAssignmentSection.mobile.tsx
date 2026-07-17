"use client";

import { FamilyRestroomOutlined } from "@mui/icons-material";
import { Autocomplete, Box, InputAdornment, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import type { ParentOption } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";

interface ParentAssignmentSectionProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly parentOptions: readonly ParentOption[];
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
  parentOptions,
  parentLocked,
  sectionTitle,
  labels,
}: Readonly<ParentAssignmentSectionProps>) {
  return (
    <SectionPanel title={sectionTitle}>
      <Box sx={theme => ({ p: theme.layout.cardPadding })}>
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => {
            const selectedParent = parentOptions.find(option => option.id === field.value) ?? null;

            return (
              <Autocomplete
                options={parentOptions}
                value={selectedParent}
                disabled={parentLocked}
                getOptionLabel={option => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_event, value) => {
                  field.onChange(value?.id ?? "");
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={labels.parent}
                    placeholder={labels.parentPlaceholder}
                    error={Boolean(errors.parentId)}
                    helperText={errors.parentId ? labels.parentRequired : undefined}
                    slotProps={{
                      input: {
                        ...params.slotProps.input,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <FamilyRestroomOutlined />
                            </InputAdornment>
                            {params.slotProps.input?.startAdornment}
                          </>
                        ),
                      },
                      inputLabel: params.slotProps.inputLabel,
                      htmlInput: {
                        ...params.slotProps.htmlInput,
                        autoComplete: "off",
                      },
                    }}
                  />
                )}
              />
            );
          }}
        />
      </Box>
    </SectionPanel>
  );
}
