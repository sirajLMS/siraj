"use client";

import { FormControlLabel, Switch, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { type ComponentType, useState } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { PersonOption, StudentAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect/types";
import type {
  PaymentFormData,
  PaymentFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/paymentFormSchema";

interface PaymentDecimalControllerFieldProps<TValues extends FieldValues, TTransformed> {
  readonly control: Control<TValues, undefined, TTransformed>;
  readonly name: FieldPath<TValues>;
  readonly label: string;
  readonly inputStep: number;
  readonly inputMin: number;
  readonly sx?: SxProps<Theme>;
}

/**
 * Decimal number input bound via react-hook-form Controller. The create and
 * edit payment forms share this field behavior; tier views only vary the
 * field name, the step/min bounds, and the layout sx.
 */
export function PaymentDecimalControllerField<TValues extends FieldValues, TTransformed>({
  control,
  name,
  label,
  inputStep,
  inputMin,
  sx,
}: Readonly<PaymentDecimalControllerFieldProps<TValues, TTransformed>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          size="small"
          type="number"
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          slotProps={{ htmlInput: { step: inputStep, min: inputMin, inputMode: "decimal" } }}
          sx={sx}
        />
      )}
    />
  );
}

interface PaymentStudentControllerFieldProps {
  readonly control: Control<PaymentFormInput, undefined, PaymentFormData>;
  readonly label: string;
  readonly placeholder: string;
  readonly StudentAutocomplete: ComponentType<StudentAutocompleteProps>;
}

/**
 * Student picker for the create-payment form. The tier views inject their own
 * StudentAutocomplete variant; the resolved option (id + display name) is kept
 * in local state so the autocomplete shows the human-readable name instead of
 * the raw id after re-renders triggered by other fields (e.g. package auto-fill).
 */
export function PaymentStudentControllerField({
  control,
  label,
  placeholder,
  StudentAutocomplete,
}: Readonly<PaymentStudentControllerFieldProps>) {
  const [selectedStudent, setSelectedStudent] = useState<PersonOption | null>(null);
  return (
    <Controller
      name="studentId"
      control={control}
      render={({ field, fieldState }) => (
        <StudentAutocomplete
          value={selectedStudent}
          onChange={option => {
            setSelectedStudent(option ?? null);
            field.onChange(option?.id ?? "");
          }}
          label={label}
          placeholder={placeholder}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          fullWidth
        />
      )}
    />
  );
}

interface PaymentPaidStatusControllerFieldProps {
  readonly control: Control<PaymentFormInput, undefined, PaymentFormData>;
  readonly onLabel: string;
  readonly offLabel: string;
}

/** Paid/unpaid toggle for the create-payment form; label flips with the switch state. */
export function PaymentPaidStatusControllerField({
  control,
  onLabel,
  offLabel,
}: Readonly<PaymentPaidStatusControllerFieldProps>) {
  return (
    <Controller
      name="isPaidStatusOn"
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
          label={field.value ? onLabel : offLabel}
        />
      )}
    />
  );
}
