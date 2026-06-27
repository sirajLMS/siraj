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

const StyledFieldLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  fontWeight: 500,
}));

const StyledFormContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(isMobile ? 3 : 4),
}));

const StyledFormHeaderBox = styled(Box, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(isMobile ? 0 : 1),
}));

const StyledFieldErrorMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(0.5),
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

function FormHeader({ isMobile, title }: { readonly isMobile: boolean; readonly title: string }) {
  return (
    <StyledFormHeaderBox isMobile={isMobile}>
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
  return (
    <StyledFormFieldGroup>
      <FieldLabel>{label}</FieldLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={Boolean(error)}>
            <Select {...field} displayEmpty value={field.value}>
              {children}
            </Select>
            {error?.message ? (
              <StyledFieldErrorMessage variant="bodyMd">{error.message}</StyledFieldErrorMessage>
            ) : null}
          </FormControl>
        )}
      />
    </StyledFormFieldGroup>
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
            error={Boolean(error)}
            helperText={error?.message}
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
  );
}

function ComplaintDetailsField({
  control,
  error,
  labels,
  isMobile,
}: {
  readonly control: Control<ComplaintFormData>;
  readonly error: FieldErrors<ComplaintFormData>["complaintDetails"];
  readonly labels: ComplaintsParentLabels;
  readonly isMobile: boolean;
}) {
  return (
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
            error={Boolean(error)}
            helperText={error?.message}
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
  );
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
      <FormHeader isMobile={isMobile} title={labels.formTitle} />

      <SelectFieldGroup label={labels.category} control={control} name="category" error={errors.category}>
        {Object.values(ComplaintCategory).map(cat => (
          <MenuItem key={cat} value={cat}>
            {labels.categoryLabels[cat]}
          </MenuItem>
        ))}
      </SelectFieldGroup>

      <SelectFieldGroup label={labels.student} control={control} name="studentId" error={errors.studentId}>
        <MenuItem value="" disabled>
          {labels.student}
        </MenuItem>
        {studentOptions.map(option => (
          <MenuItem key={option.id} value={option.id}>
            {option.label}
          </MenuItem>
        ))}
      </SelectFieldGroup>

      <ContactEmailField control={control} error={errors.contactEmail} labels={labels} />

      <ComplaintDetailsField control={control} error={errors.complaintDetails} labels={labels} isMobile={isMobile} />
    </StyledFormContainer>
  );
}
