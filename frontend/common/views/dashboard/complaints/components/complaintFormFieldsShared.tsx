"use client";

import { Box, MenuItem } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { ComplaintCategory } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  ComplaintDetailsField,
  ContactEmailField,
  FormHeader,
  SelectFieldGroup,
} from "@/frontend/common/views/dashboard/complaints/components/complaintFormFieldsShared.parts";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintFormFieldsSlotProps {
  /** Tier-specific student autocomplete component (desktop or mobile). */
  readonly StudentAutocomplete: React.ComponentType<{
    readonly value: PersonOption | null;
    readonly onChange: (next: PersonOption | null) => void;
    readonly scope: { readonly viewerAssigned: boolean };
    readonly label: string;
    readonly error: boolean;
    readonly helperText: string | undefined;
  }>;
}

interface ComplaintFormFieldsSharedOptions {
  /** Gap between form fields (spacing units). Desktop: 4, Mobile: 3. */
  readonly fieldGap: number;
  /** Extra bottom margin on the header box (spacing units). Desktop: 1, Mobile: 0. */
  readonly headerMarginBottom: number;
  /** Min rows for the complaint details textarea. Desktop: 5, Mobile: 4. */
  readonly detailsMinRows: number;
}

export interface ComplaintFormFieldsSharedProps {
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly labels: ComplaintsParentLabels;
  readonly slots: ComplaintFormFieldsSlotProps;
  readonly options: ComplaintFormFieldsSharedOptions;
}

export function ComplaintFormFieldsShared({
  control,
  errors,
  labels,
  slots,
  options,
}: Readonly<ComplaintFormFieldsSharedProps>) {
  const { StudentAutocomplete } = slots;
  return (
    <Box
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(options.fieldGap),
      })}
    >
      <FormHeader title={labels.formTitle} marginBottom={options.headerMarginBottom} />

      <SelectFieldGroup label={labels.category} control={control} name="category" error={errors.category}>
        {Object.values(ComplaintCategory).map(cat => (
          <MenuItem key={cat} value={cat}>
            {labels.categoryLabels[cat]}
          </MenuItem>
        ))}
      </SelectFieldGroup>

      <Controller
        name="studentId"
        control={control}
        render={({ field, fieldState }) => (
          <StudentAutocomplete
            value={field.value ? ({ id: field.value, name: "" } satisfies PersonOption) : null}
            onChange={option => {
              field.onChange(option?.id ?? "");
            }}
            scope={{ viewerAssigned: true }}
            label={labels.student}
            error={Boolean(fieldState.error ?? errors.studentId)}
            helperText={fieldState.error?.message ?? errors.studentId?.message}
          />
        )}
      />

      <ContactEmailField control={control} error={errors.contactEmail} labels={labels} />

      <ComplaintDetailsField
        control={control}
        error={errors.complaintDetails}
        labels={labels}
        minRows={options.detailsMinRows}
      />
    </Box>
  );
}
