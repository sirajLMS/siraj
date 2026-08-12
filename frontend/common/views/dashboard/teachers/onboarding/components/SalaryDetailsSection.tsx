"use client";

import { Grid, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { CurrencySymbolAdornment } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySymbolAdornmentShared";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/common/lib/currency";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

interface SalaryDetailsSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
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

export function SalaryDetailsSection({ register, control, errors, labels }: Readonly<SalaryDetailsSectionProps>) {
  const rateCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = getCurrencySymbol(rateCurrency ?? CurrencyCode.Usd);

  return (
    <Grid
      container
      spacing={3}
      sx={theme => ({
        p: theme.layout.cardPadding,
      })}
    >
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          {...register("hourlyRate")}
          label={labels.fields.salaryAmount}
          placeholder={labels.placeholders.salaryAmount}
          type="number"
          required
          error={!!errors.hourlyRate}
          helperText={errors.hourlyRate?.message}
          fullWidth
          sx={outlinedInputSx}
          slotProps={{
            input: {
              startAdornment: <CurrencySymbolAdornment symbol={currencySymbol} variant="typography" />,
            },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="rateCurrency"
          control={control}
          render={({ field }) => {
            const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
            return (
              <CurrencySelect
                currency={option}
                setCurrencyAction={selected => {
                  field.onChange(selected.code);
                }}
                onBlurAction={field.onBlur}
                label={labels.fields.currency}
                required
                error={!!errors.rateCurrency}
                helperText={errors.rateCurrency?.message}
                fullWidth
              />
            );
          }}
        />
      </Grid>
    </Grid>
  );
}
