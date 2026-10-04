"use client";

import { Chip, Stack, type SxProps, TextField, type Theme } from "@mui/material";
import { type Control, Controller, type ControllerRenderProps, type FieldErrors } from "react-hook-form";
import { PACKAGE_PLAN_VALIDITY_CHOICES } from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.options";
import type {
  PackagePlanFormData,
  PackagePlanFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

type PackagePlanFormLabels = PackagePlansLabels["form"];

export interface PackagePlanFieldCoreProps {
  readonly control: Control<PackagePlanFormInput, undefined, PackagePlanFormData>;
  readonly labels: PackagePlanFormLabels;
}

interface PackagePlanValidatedFieldProps extends PackagePlanFieldCoreProps {
  readonly errors: FieldErrors<PackagePlanFormInput>;
}

export interface PackagePlanSizedFieldProps extends PackagePlanFieldCoreProps {
  readonly sx?: SxProps<Theme>;
}

export interface PackagePlanSizedValidatedFieldProps extends PackagePlanValidatedFieldProps {
  readonly sx?: SxProps<Theme>;
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

export function PackagePlanNumberField({ config, control, errors, labels, sx }: Readonly<PackagePlanNumberFieldProps>) {
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

interface PackagePlanValidityChipsProps {
  readonly value: unknown;
  readonly unlimitedLabel: string;
  readonly onChange: (months: number | null) => void;
}

function PackagePlanValidityChips({ value, unlimitedLabel, onChange }: Readonly<PackagePlanValidityChipsProps>) {
  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
      {PACKAGE_PLAN_VALIDITY_CHOICES.map(months => (
        <Chip
          key={months}
          size="small"
          clickable
          label={String(months)}
          aria-pressed={value === months}
          color={value === months ? "primary" : "default"}
          variant={value === months ? "filled" : "outlined"}
          onClick={() => onChange(months)}
        />
      ))}
      <Chip
        size="small"
        clickable
        label={unlimitedLabel}
        aria-pressed={value == null}
        color={value == null ? "primary" : "default"}
        variant={value == null ? "filled" : "outlined"}
        onClick={() => onChange(null)}
      />
    </Stack>
  );
}

interface PackagePlanValidityMonthsInputProps {
  readonly field: ControllerRenderProps<PackagePlanFormInput, "validityMonths">;
  readonly errors: FieldErrors<PackagePlanFormInput>;
  readonly labels: PackagePlanFormLabels;
  readonly sx?: SxProps<Theme>;
}

export function PackagePlanValidityMonthsInput({
  field,
  errors,
  labels,
  sx,
}: Readonly<PackagePlanValidityMonthsInputProps>) {
  return (
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
      <PackagePlanValidityChips
        value={field.value}
        unlimitedLabel={labels.validityUnlimited}
        onChange={value => field.onChange(value)}
      />
    </Stack>
  );
}
