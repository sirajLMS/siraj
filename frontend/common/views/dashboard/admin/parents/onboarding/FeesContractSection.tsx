"use client";

import { FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { type Control, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { CurrencySelectController } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySelectControllerShared";
import { CurrencySymbolAdornment } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySymbolAdornmentShared";
import { CurrencyCode, InvoiceType } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents";

interface SectionProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

type ValidationMessages = ParentOnboardingLabels["validation"];

function isValidationKey(key: string, validation: ValidationMessages): key is keyof typeof validation {
  return key in validation;
}

function getValidationMessage(message: string | undefined, validation: ValidationMessages): string | undefined {
  if (message && isValidationKey(message, validation)) {
    return validation[message];
  }
  return undefined;
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
              <FormHelperText>{getValidationMessage(errors.invoiceType.message, t.validation)}</FormHelperText>
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
            helperText={errors.feeAmount ? getValidationMessage(errors.feeAmount.message, t.validation) : undefined}
            fullWidth
            type="number"
            sx={outlinedInputSx}
            slotProps={{
              input: {
                startAdornment: <CurrencySymbolAdornment symbol={currencySymbol} />,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CurrencySelectController
            name="currency"
            control={control}
            label={t.fields.currency}
            required
            error={!!errors.currency}
            helperText={errors.currency ? getValidationMessage(errors.currency.message, t.validation) : undefined}
            fullWidth
          />
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
