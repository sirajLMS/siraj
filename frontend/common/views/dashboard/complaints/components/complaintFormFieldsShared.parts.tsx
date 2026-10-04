"use client";

import {
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import {
  StyledDescriptionIcon,
  StyledEmailIcon,
  StyledFormHeaderIcon,
} from "@/frontend/common/views/dashboard/complaints/components/complaintFormFieldsShared.styled";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import type { ComplaintsParentLabels } from "@/shared/locale";

export function FormHeader({ title, marginBottom }: { readonly title: string; readonly marginBottom: number }) {
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

export function SelectFieldGroup({
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

export function ContactEmailField({
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

export function ComplaintDetailsField({
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
