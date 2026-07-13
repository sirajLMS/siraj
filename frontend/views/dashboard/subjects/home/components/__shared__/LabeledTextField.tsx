"use client";

import { TextField } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { FieldWrapper, standardInputSx } from "@/frontend/common/components/ui/form";

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
 * Renders a `Controller`-bound standard-variant `TextField` wrapped in a
 * `FieldWrapper` (label + required marker + error message).
 *
 * Extracted from the create/edit category and subject dialogs which all
 * previously duplicated the same ~15 line Controller/FieldWrapper/TextField
 * block for name, slug, and description.
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
        <FieldWrapper label={label} required={required} error={error}>
          <TextField
            {...field}
            fullWidth
            variant="standard"
            error={!!error}
            multiline={multiline}
            rows={rows}
            disabled={disabled}
            sx={standardInputSx}
          />
        </FieldWrapper>
      )}
    />
  );
}
