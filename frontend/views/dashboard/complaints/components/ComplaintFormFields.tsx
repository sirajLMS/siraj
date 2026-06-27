"use client";

import { DescriptionOutlined, EmailOutlined, RateReviewOutlined } from "@mui/icons-material";
import { Box, FormControl, InputAdornment, MenuItem, Select, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ComplaintCategory } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";
import type { ComplaintFormData } from "../schemas/complaintFormSchema";
import type { ParentStudentOption } from "../types/complaints.types";

/** Styled field label with uppercase text and surface-variant color */
const StyledFieldLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  fontWeight: 500,
}));

/** Main form layout container with responsive gap based on viewport */
const StyledFormContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(isMobile ? 3 : 4),
}));

/** Form header row containing the icon and form title */
const StyledFormHeaderBox = styled(Box, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(isMobile ? 0 : 1),
}));

/** Error message displayed below a form field when validation fails */
const StyledFieldErrorMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(0.5),
}));

/** Rate review icon in primary color for the form header */
const StyledFormHeaderIcon = styled(RateReviewOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

/** Email icon in primary color for the contact email field */
const StyledEmailIcon = styled(EmailOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

/** Description icon in primary color for the details field */
const StyledDescriptionIcon = styled(DescriptionOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

/** Wrapper for each form field group (label + input + error) */
const StyledFormFieldGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

interface ComplaintFormFieldsProps {
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly labels: ComplaintsParentLabels;
  readonly studentOptions: readonly ParentStudentOption[];
  readonly variant: "desktop" | "mobile";
}

function FieldLabel({ children }: Readonly<{ children: string }>) {
  return <StyledFieldLabel variant="labelMd">{children}</StyledFieldLabel>;
}

export function ComplaintFormFields({
  control,
  errors,
  labels,
  studentOptions,
  variant,
}: Readonly<ComplaintFormFieldsProps>) {
  const isMobile = variant === "mobile";

  return (
    <StyledFormContainer isMobile={isMobile}>
      {/* Form header with icon and title */}
      <StyledFormHeaderBox isMobile={isMobile}>
        <StyledFormHeaderIcon />
        <Typography variant="titleLg">{labels.formTitle}</Typography>
      </StyledFormHeaderBox>

      <StyledFormFieldGroup>
        <FieldLabel>{labels.category}</FieldLabel>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.category)}>
              <Select
                {...field}
                displayEmpty
                value={field.value}
                onChange={event => {
                  field.onChange(event.target.value as ComplaintCategory);
                }}
              >
                {Object.values(ComplaintCategory).map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {labels.categoryLabels[cat]}
                  </MenuItem>
                ))}
              </Select>
              {errors.category?.message ? (
                <StyledFieldErrorMessage variant="bodyMd">{errors.category.message}</StyledFieldErrorMessage>
              ) : null}
            </FormControl>
          )}
        />
      </StyledFormFieldGroup>

      <StyledFormFieldGroup>
        <FieldLabel>{labels.student}</FieldLabel>
        <Controller
          name="studentId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.studentId)}>
              <Select
                {...field}
                displayEmpty
                value={field.value}
                onChange={event => {
                  field.onChange(event.target.value);
                }}
              >
                <MenuItem value="" disabled>
                  {labels.student}
                </MenuItem>
                {studentOptions.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.studentId?.message ? (
                <StyledFieldErrorMessage variant="bodyMd">{errors.studentId.message}</StyledFieldErrorMessage>
              ) : null}
            </FormControl>
          )}
        />
      </StyledFormFieldGroup>

      {/* Contact email text field */}
      <StyledFormFieldGroup>
        <FieldLabel>{labels.contactEmail}</FieldLabel>
        <Controller
          name="contactEmail"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              placeholder={labels.contactEmailPlaceholder}
              fullWidth
              error={Boolean(errors.contactEmail)}
              helperText={errors.contactEmail?.message}
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
      </StyledFormFieldGroup>

      {/* Complaint details multi-line text field */}
      <StyledFormFieldGroup>
        <FieldLabel>{labels.complaintDetails}</FieldLabel>
        <Controller
          name="complaintDetails"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              placeholder={labels.complaintDetailsPlaceholder}
              fullWidth
              multiline
              minRows={isMobile ? 4 : 5}
              error={Boolean(errors.complaintDetails)}
              helperText={errors.complaintDetails?.message}
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
      </StyledFormFieldGroup>
    </StyledFormContainer>
  );
}
