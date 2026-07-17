"use client";

import { TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactElement } from "react";

export type MobileAppDatePickerProps = {
  readonly value: Date | null;
  readonly onChangeAction: (date: Date | null) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly fullWidth?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly slotProps?: {
    readonly textField?: Partial<React.ComponentProps<typeof TextField>>;
  };
};

/**
 * Mobile-tier date picker. Simple TextField with type="date" — no desktop popover/card complexity.
 * Uses native mobile date picker UI.
 */
export const MobileAppDatePicker: React.FC<MobileAppDatePickerProps> = ({
  value,
  onChangeAction,
  label,
  disabled,
  required,
  error,
  helperText,
  fullWidth = true,
  sx,
  slotProps,
}): ReactElement => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value ? new Date(event.target.value) : null;
    onChangeAction(newValue);
  };

  return (
    <TextField
      type="date"
      fullWidth={fullWidth}
      label={label}
      value={value ? value.toISOString().split("T")[0] : ""}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      error={error}
      helperText={helperText}
      sx={sx}
      {...slotProps?.textField}
    />
  );
};
