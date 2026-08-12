"use client";

import { TextField } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";

/**
 * Props for the shared labeled text field controller.
 *
 * The generic `T` is the form values shape so this component can be reused by
 * both the category and subject dialogs (which share the name/slug/description
 * fields) while remaining fully type-safe against any of those form shapes.
 */
interface LabeledTextFieldProps<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly multiline?: boolean;
  readonly rows?: number;
}

/**
 * Renders a `Controller`-bound outlined `TextField` with MUI floating label,
 * required marker, and helper-text error message.
 */
export function LabeledTextField<T extends Record<string, unknown>>({
  name,
  control,
  label,
  required,
  error,
  disabled,
  multiline,
  rows,
}: Readonly<LabeledTextFieldProps<T>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          required={required}
          error={!!error}
          helperText={error}
          multiline={multiline}
          rows={rows}
          disabled={disabled}
          sx={outlinedInputSx}
        />
      )}
    />
  );
}
