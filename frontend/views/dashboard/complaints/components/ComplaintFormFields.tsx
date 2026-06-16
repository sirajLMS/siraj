"use client";

import { DescriptionOutlined, EmailOutlined, RateReviewOutlined } from "@mui/icons-material";
import { Box, FormControl, InputAdornment, MenuItem, Select, TextField, Typography } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { ParentStudentOption } from "@/frontend/stores/parentComplaintsStore";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";
import type { ComplaintFormData } from "../schemas/complaintFormSchema";

interface ComplaintFormFieldsProps {
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly labels: ComplaintsParentLabels;
  readonly studentOptions: readonly ParentStudentOption[];
  readonly variant: "desktop" | "mobile";
}

function FieldLabel({ children }: Readonly<{ children: string }>) {
  return (
    <Typography
      variant="labelMd"
      sx={theme => ({
        color: theme.palette.onSurfaceVariant,
        textTransform: "uppercase",
        fontWeight: 500,
      })}
    >
      {children}
    </Typography>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 3 : 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: isMobile ? 0 : 1 }}>
        <RateReviewOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="titleLg">{labels.formTitle}</Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main, mt: 0.5 })}>
                  {errors.studentId.message}
                </Typography>
              ) : null}
            </FormControl>
          )}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                      <EmailOutlined sx={theme => ({ color: theme.palette.primary.main })} />
                    </InputAdornment>
                  ),
                },
                htmlInput: { autoComplete: "email" },
              }}
            />
          )}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                      <DescriptionOutlined sx={theme => ({ color: theme.palette.primary.main })} />
                    </InputAdornment>
                  ),
                },
                htmlInput: { autoComplete: "off" },
              }}
            />
          )}
        />
      </Box>
    </Box>
  );
}
