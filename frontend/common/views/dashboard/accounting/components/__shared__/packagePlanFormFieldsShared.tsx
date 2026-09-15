"use client";

import { Box, Chip, FormControlLabel, Stack, Switch, type SxProps, TextField, type Theme } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { CurrencySelectController } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySelectControllerShared";
import {
  PACKAGE_PLAN_CURRENCY_OPTIONS,
  PACKAGE_PLAN_VALIDITY_CHOICES,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.options";
import type {
  PackagePlanFormData,
  PackagePlanFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

type PackagePlanFormLabels = PackagePlansLabels["form"];

interface PackagePlanFieldCoreProps {
  readonly control: Control<PackagePlanFormInput, undefined, PackagePlanFormData>;
  readonly labels: PackagePlanFormLabels;
}

interface PackagePlanValidatedFieldProps extends PackagePlanFieldCoreProps {
  readonly errors: FieldErrors<PackagePlanFormInput>;
}

interface PackagePlanSizedFieldProps extends PackagePlanFieldCoreProps {
  readonly sx?: SxProps<Theme>;
}

interface PackagePlanSizedValidatedFieldProps extends PackagePlanValidatedFieldProps {
  readonly sx?: SxProps<Theme>;
}

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

interface PackagePlanNumberFieldProps extends PackagePlanSizedValidatedFieldProps {
  readonly config: {
    readonly name: "creditHours" | "priceAmount" | "sortOrder";
    readonly labelKey: "creditHours" | "priceAmount" | "sortOrder";
    readonly step?: number;
    readonly min?: number;
    readonly inputMode?: "decimal" | "numeric";
  };
}

const CREDIT_HOURS_CONFIG = {
  name: "creditHours" as const,
  labelKey: "creditHours" as const,
  step: 0.5,
  min: 0.5,
  inputMode: "decimal" as const,
};

const PRICE_AMOUNT_CONFIG = {
  name: "priceAmount" as const,
  labelKey: "priceAmount" as const,
  step: 0.01,
  min: 0,
  inputMode: "decimal" as const,
};

const SORT_ORDER_CONFIG = {
  name: "sortOrder" as const,
  labelKey: "sortOrder" as const,
  step: 1,
  min: 0,
};

function PackagePlanNumberField({ config, control, errors, labels, sx }: Readonly<PackagePlanNumberFieldProps>) {
  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          size="small"
          type="number"
          label={labels[config.labelKey]}
          error={Boolean(errors[config.name])}
          helperText={errors[config.name]?.message}
          slotProps={{ htmlInput: { step: config.step, min: config.min, inputMode: config.inputMode } }}
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
      render={({ field }) => (
        <Stack spacing={1} sx={sx}>
          <TextField
            value={field.value ?? ""}
            onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)}
            size="small"
            type="number"
            label={labels.validityMonths}
            error={Boolean(errors.validityMonths)}
            helperText={errors.validityMonths?.message}
            slotProps={{
              htmlInput: { step: 1, min: 1, max: 120 },
              inputLabel: { shrink: true },
            }}
            sx={{ width: "100%" }}
          />
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {PACKAGE_PLAN_VALIDITY_CHOICES.map(months => (
              <Chip
                key={months}
                size="small"
                clickable
                label={String(months)}
                aria-pressed={field.value === months}
                color={field.value === months ? "primary" : "default"}
                variant={field.value === months ? "filled" : "outlined"}
                onClick={() => field.onChange(months)}
              />
            ))}
            <Chip
              size="small"
              clickable
              label={labels.validityUnlimited}
              aria-pressed={field.value == null}
              color={field.value == null ? "primary" : "default"}
              variant={field.value == null ? "filled" : "outlined"}
              onClick={() => field.onChange(null)}
            />
          </Stack>
        </Stack>
      )}
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
