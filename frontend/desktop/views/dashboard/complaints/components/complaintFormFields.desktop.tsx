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
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { ComplaintCategory } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import type { ComplaintsParentLabels } from "@/shared/locale";

const StyledFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

const StyledFormHeaderBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledFormHeaderIcon = styled(RateReviewOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledEmailIcon = styled(EmailOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledDescriptionIcon = styled(DescriptionOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

interface ComplaintFormFieldsDesktopProps {
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly labels: ComplaintsParentLabels;
}

function FormHeader({ title }: { readonly title: string }) {
  return (
    <StyledFormHeaderBox>
      <StyledFormHeaderIcon />
      <Typography variant="titleLg">{title}</Typography>
    </StyledFormHeaderBox>
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
  readonly error: FieldErrors<ComplaintFormData>["category"] | FieldErrors<ComplaintFormData>["studentId"];
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
}: {
  readonly control: Control<ComplaintFormData>;
  readonly error: FieldErrors<ComplaintFormData>["complaintDetails"];
  readonly labels: ComplaintsParentLabels;
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
          minRows={5}
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

export function ComplaintFormFieldsDesktop({ control, errors, labels }: Readonly<ComplaintFormFieldsDesktopProps>) {
  return (
    <StyledFormContainer>
      <FormHeader title={labels.formTitle} />

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
          <StudentAutocompleteDesktop
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

      <ComplaintDetailsField control={control} error={errors.complaintDetails} labels={labels} />
    </StyledFormContainer>
  );
}
