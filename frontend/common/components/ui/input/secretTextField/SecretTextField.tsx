"use client";

import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField, type TextFieldProps, Tooltip } from "@mui/material";
import type React from "react";

export const HIDDEN_SECRET_MASK = "••••••••";

export type SecretTextFieldProps = Omit<TextFieldProps, "type" | "slotProps"> & {
  readonly revealed: boolean;
  readonly onToggleReveal: () => void;
  readonly showValueLabel: string;
  readonly hideValueLabel: string;
  readonly readOnly?: boolean;
};

function SecretRevealToggle({
  revealed,
  onToggleReveal,
  showValueLabel,
  hideValueLabel,
  disabled,
}: Readonly<
  Pick<SecretTextFieldProps, "revealed" | "showValueLabel" | "hideValueLabel"> & {
    readonly onToggleReveal: () => void;
    readonly disabled?: boolean;
  }
>): React.ReactNode {
  const label = revealed ? hideValueLabel : showValueLabel;
  const buttonNode = (
    <IconButton edge="end" aria-label={label} onClick={onToggleReveal} disabled={disabled}>
      {revealed ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
    </IconButton>
  );

  return (
    <InputAdornment position="end">
      <Tooltip title={label}>
        {disabled ? <span style={{ display: "inline-flex" }}>{buttonNode}</span> : buttonNode}
      </Tooltip>
    </InputAdornment>
  );
}

/**
 * Text input for secret values (API tokens, client secrets). Editable mode masks the
 * value behind a password-type input until the reveal toggle is pressed; read-only mode
 * never exposes the raw value in the DOM unless explicitly revealed, showing a mask
 * placeholder otherwise. No secret value is ever logged.
 */
export function SecretTextField({
  revealed,
  onToggleReveal,
  showValueLabel,
  hideValueLabel,
  readOnly = false,
  disabled = false,
  fullWidth = true,
  size = "small",
  autoComplete = "off",
  label,
  value,
  placeholder,
  ...rest
}: SecretTextFieldProps): React.ReactNode {
  const toggleProps = { revealed, onToggleReveal, showValueLabel, hideValueLabel, disabled };

  if (readOnly) {
    const stringValue = typeof value === "string" ? value : "";
    const displayValueWhenRevealed = stringValue === "" ? (placeholder ?? HIDDEN_SECRET_MASK) : stringValue;
    const displayValue = revealed ? displayValueWhenRevealed : HIDDEN_SECRET_MASK;
    return (
      <TextField
        label={label}
        value={displayValue}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        {...rest}
        slotProps={{ input: { readOnly: true, endAdornment: <SecretRevealToggle {...toggleProps} /> } }}
      />
    );
  }

  return (
    <TextField
      label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      autoComplete={autoComplete}
      type={revealed ? "text" : "password"}
      {...rest}
      slotProps={{ input: { endAdornment: <SecretRevealToggle {...toggleProps} /> } }}
    />
  );
}
