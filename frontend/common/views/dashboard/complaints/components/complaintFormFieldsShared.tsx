"use client";

import { DescriptionOutlined, EmailOutlined, RateReviewOutlined } from "@mui/icons-material";
import {
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { ComplaintCategory } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import type { ComplaintsParentLabels } from "@/shared/locale";

export interface ComplaintFormFieldsSlotProps {
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

export interface ComplaintFormFieldsSharedOptions {
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

const StyledFormHeaderIcon = styled(RateReviewOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledEmailIcon = styled(EmailOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledDescriptionIcon = styled(DescriptionOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

function FormHeader({ title, marginBottom }: { readonly title: string; readonly marginBottom: number }) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        marginBottom: theme.spacing(marginBottom),
      })}
    >
      <StyledFormHeaderIcon />
      <Typography variant="titleLg">{title}</Typography>
    </Box>
  );
}

function SelectFieldGroup({
  label,
  control,
  name,
  error,
  children,
}: {
  readonly label: string;
  readonly control: Control<ComplaintFormData>;
  readonly name: "category" | "studentId";
  readonly error: FieldErrors<ComplaintFormData>["category"];
  readonly children: React.ReactNode;
}) {
  const labelId = `${name}-label`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={Boolean(error)} sx={outlinedInputSx}>
          <InputLabel id={labelId} shrink>
            {label}
          </InputLabel>
          <Select {...field} labelId={labelId} label={label} displayEmpty value={field.value}>
            {children}
          </Select>
          {error?.message ? <FormHelperText>{error.message}</FormHelperText> : null}
        </FormControl>
      )}
    />
  );
}

function ContactEmailField({
  control,
  error,
  labels,
}: {
  readonly control: Control<ComplaintFormData>;
  readonly error: FieldErrors<ComplaintFormData>["contactEmail"];
  readonly labels: ComplaintsParentLabels;
}) {
  return (
    <Controller
      name="contactEmail"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={labels.contactEmail}
          placeholder={labels.contactEmailPlaceholder}
          variant="outlined"
          fullWidth
          error={Boolean(error)}
          helperText={error?.message}
          sx={outlinedInputSx}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <StyledEmailIcon />
                </InputAdornment>
              ),
            },
            htmlInput: { autoComplete: "email" },
          }}
        />
      )}
    />
  );
}

function ComplaintDetailsField({
  control,
  error,
  labels,
  minRows,
}: {
  readonly control: Control<ComplaintFormData>;
  readonly error: FieldErrors<ComplaintFormData>["complaintDetails"];
  readonly labels: ComplaintsParentLabels;
  readonly minRows: number;
}) {
  return (
    <Controller
      name="complaintDetails"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={labels.complaintDetails}
          placeholder={labels.complaintDetailsPlaceholder}
          variant="outlined"
          fullWidth
          multiline
          minRows={minRows}
          error={Boolean(error)}
          helperText={error?.message}
          sx={outlinedInputSx}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                  <StyledDescriptionIcon />
                </InputAdornment>
              ),
            },
            htmlInput: { autoComplete: "off" },
          }}
        />
      )}
    />
  );
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
