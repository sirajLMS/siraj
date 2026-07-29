"use client";

import {
  Box,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/common/lib/currency";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import { Translation, useAppTranslation } from "@/shared/locale";

interface SectionProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

export function FeesContractSection({ register, control, errors }: SectionProps) {
  const t = useAppTranslation(Translation.Dashboard.ParentOnboarding);
  const currency = useWatch({ control, name: "currency" });
  const currencySymbol = getCurrencySymbol(currency ?? CurrencyCode.Usd);
  const invoiceTypeLabelId = "parent-onboarding-invoice-type-label";

  return (
    <SectionPanel title={t.sections.feesContract}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth required error={!!errors.invoiceType} sx={outlinedInputSx}>
            <InputLabel id={invoiceTypeLabelId} shrink>
              {t.fields.invoiceType}
            </InputLabel>
            <Select
              {...register("invoiceType")}
              labelId={invoiceTypeLabelId}
              label={t.fields.invoiceType}
              defaultValue=""
            >
              <MenuItem value="">{t.placeholders.invoiceType}</MenuItem>
              <MenuItem value={InvoiceType.PerClasses}>{t.options.invoiceType.perClass}</MenuItem>
              <MenuItem value={InvoiceType.Monthly}>{t.options.invoiceType.monthly}</MenuItem>
            </Select>
            {errors.invoiceType ? (
              <FormHelperText>{t.validation[errors.invoiceType.message as keyof typeof t.validation]}</FormHelperText>
            ) : null}
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register("feeAmount")}
            label={t.fields.feeAmount}
            placeholder={t.placeholders.feeAmount}
            required
            error={!!errors.feeAmount}
            helperText={
              errors.feeAmount ? t.validation[errors.feeAmount.message as keyof typeof t.validation] : undefined
            }
            fullWidth
            type="number"
            sx={outlinedInputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="span"
                      sx={theme => ({
                        fontWeight: "bold",
                        color: theme.palette.primary.main,
                        opacity: 0.6,
                      })}
                    >
                      {currencySymbol}
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="currency"
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
                  label={t.fields.currency}
                  required
                  error={!!errors.currency}
                  helperText={
                    errors.currency ? t.validation[errors.currency.message as keyof typeof t.validation] : undefined
                  }
                  fullWidth
                />
              );
            }}
          />
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
