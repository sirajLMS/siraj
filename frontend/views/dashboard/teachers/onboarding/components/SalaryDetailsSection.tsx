"use client";

import { Box, Grid, Input, InputAdornment, MenuItem, Select, Typography } from "@mui/material";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { labelSx, outlinedInputSx, standardInputSx } from "@/frontend/components/ui/form";
import type { TeacherOnboardingFormData } from "../schemas/teacherOnboardingSchema";

interface SalaryDetailsSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly salaryAmount: string;
      readonly currency: string;
    };
    readonly placeholders: {
      readonly salaryAmount: string;
    };
  };
}

export function SalaryDetailsSection({ register, errors, labels }: Readonly<SalaryDetailsSectionProps>) {
  return (
    <Grid
      container
      spacing={3}
      sx={theme => ({
        p: theme.layout.cardPadding,
      })}
    >
      <Grid size={{ xs: 12, md: 8 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.salaryAmount}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("salaryAmount")}
          placeholder={labels.placeholders.salaryAmount}
          type="number"
          error={!!errors.salaryAmount}
          fullWidth
          sx={standardInputSx}
          startAdornment={
            <InputAdornment position="start">
              <Typography
                variant="bodyMd"
                sx={theme => ({
                  fontWeight: 700,
                  color: theme.palette.onSurfaceVariant,
                })}
              >
                $
              </Typography>
            </InputAdornment>
          }
        />
        {errors.salaryAmount ? (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.error.main, mt: 0.5, display: "block" })}>
            {errors.salaryAmount.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.currency}
        </Box>
        <Select {...register("currency")} defaultValue="USD" fullWidth sx={outlinedInputSx}>
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="EGP">EGP</MenuItem>
          <MenuItem value="SAR">SAR</MenuItem>
          <MenuItem value="AED">AED</MenuItem>
          <MenuItem value="EUR">EUR</MenuItem>
        </Select>
      </Grid>
    </Grid>
  );
}
