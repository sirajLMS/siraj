"use client";

import { Box, FormControlLabel, Switch, type SxProps, TextField, type Theme } from "@mui/material";
import { Controller } from "react-hook-form";
import { CurrencySelectController } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySelectControllerShared";
import {
  CREDIT_HOURS_CONFIG,
  PRICE_AMOUNT_CONFIG,
  SORT_ORDER_CONFIG,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.constants";
import { PACKAGE_PLAN_CURRENCY_OPTIONS } from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.options";
import {
  type PackagePlanFieldCoreProps,
  PackagePlanNumberField,
  type PackagePlanSizedFieldProps,
  type PackagePlanSizedValidatedFieldProps,
  PackagePlanValidityMonthsInput,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.parts";

export function PackagePlanCodenameField({
  control,
  errors,
  labels,
  isEditing,
  sx,
  inputSx,
}: Readonly<PackagePlanSizedValidatedFieldProps & { readonly isEditing: boolean; readonly inputSx?: SxProps<Theme> }>) {
  return (
    <Controller
      name="codename"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          size="small"
          label={labels.codename}
          placeholder={labels.codenamePlaceholder}
          helperText={errors.codename?.message ?? labels.codenameHelp}
          error={Boolean(errors.codename)}
          disabled={isEditing}
          slotProps={{ htmlInput: { sx: inputSx } }}
          sx={sx}
        />
      )}
    />
  );
}

export function PackagePlanDisplayNameField({
  control,
  errors,
  labels,
  sx,
}: Readonly<PackagePlanSizedValidatedFieldProps>) {
  return (
    <Controller
      name="displayName"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          size="small"
          label={labels.displayName}
          error={Boolean(errors.displayName)}
          helperText={errors.displayName?.message}
          sx={sx}
        />
      )}
    />
  );
}

export function PackagePlanDescriptionField({ control, labels, sx }: Readonly<PackagePlanSizedFieldProps>) {
  return (
    <Controller
      name="description"
      control={control}
      render={({ field }) => (
        <TextField
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          size="small"
          multiline
          minRows={2}
          label={labels.description}
          sx={sx}
        />
      )}
    />
  );
}

export function PackagePlanCreditHoursField(props: Readonly<PackagePlanSizedValidatedFieldProps>) {
  return <PackagePlanNumberField {...props} config={CREDIT_HOURS_CONFIG} />;
}

export function PackagePlanPriceAmountField(props: Readonly<PackagePlanSizedValidatedFieldProps>) {
  return <PackagePlanNumberField {...props} config={PRICE_AMOUNT_CONFIG} />;
}

export function PackagePlanCurrencyField({ control, labels, sx }: Readonly<PackagePlanSizedFieldProps>) {
  return (
    <Box sx={sx}>
      <CurrencySelectController
        name="currency"
        control={control}
        label={labels.currency}
        allowedCodes={PACKAGE_PLAN_CURRENCY_OPTIONS}
        fullWidth
      />
    </Box>
  );
}

export function PackagePlanSortOrderField(props: Readonly<PackagePlanSizedValidatedFieldProps>) {
  return <PackagePlanNumberField {...props} config={SORT_ORDER_CONFIG} />;
}

export function PackagePlanValidityMonthsField({
  control,
  errors,
  labels,
  sx,
}: Readonly<PackagePlanSizedValidatedFieldProps>) {
  return (
    <Controller
      name="validityMonths"
      control={control}
      render={({ field }) => <PackagePlanValidityMonthsInput field={field} errors={errors} labels={labels} sx={sx} />}
    />
  );
}

export function PackagePlanActiveField({ control, labels }: Readonly<PackagePlanFieldCoreProps>) {
  return (
    <Controller
      name="active"
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
          label={labels.active}
          sx={{ m: 0, gap: 1 }}
        />
      )}
    />
  );
}
