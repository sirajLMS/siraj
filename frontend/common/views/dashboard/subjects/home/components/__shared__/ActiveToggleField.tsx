"use client";

import { Box, Switch, Typography } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";

interface ActiveToggleFieldProps<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly disabled?: boolean;
  readonly label: string;
}

/**
 * Renders the `isActive` toggle (Switch + bodyMd label) bound to a form value.
 *
 * Extracted from the create/edit category and subject dialogs which each
 * duplicated this controller block. Defaults to `true` when the field value is
 * unset so newly created entities are active by default.
 */
export function ActiveToggleField<T extends FieldValues>({
  name,
  control,
  disabled,
  label,
}: Readonly<ActiveToggleFieldProps<T>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch checked={field.value ?? true} onChange={field.onChange} disabled={disabled} />
          <Typography variant="bodyMd">{label}</Typography>
        </Box>
      )}
    />
  );
}
