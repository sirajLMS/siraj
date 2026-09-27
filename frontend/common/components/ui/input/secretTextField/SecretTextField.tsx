"use client";

import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, TextField, type TextFieldProps, Tooltip } from "@mui/material";
import type React from "react";

const HIDDEN_SECRET_MASK = "••••••••";

export type SecretTextFieldProps = Omit<TextFieldProps, "type" | "slotProps"> & {
  readonly revealed: boolean;
  readonly onToggleReveal: () => void;
  readonly showValueLabel: string;
  readonly hideValueLabel: string;
  readonly readOnly?: boolean;
  /**
   * Character cap forwarded to the inner `<input>` — used by consumers to
   * mirror the server-side per-field caps in the browser (plain `TextField`
   * consumers pass `slotProps.htmlInput.maxLength` directly; `slotProps` is
   * omitted here because this component owns the input/endAdornment slots).
   */
  readonly maxLength?: number;
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
    <IconButton edge="end" aria-label={label} aria-pressed={revealed} onClick={onToggleReveal} disabled={disabled}>
      {revealed ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
    </IconButton>
  );

  return (
    <InputAdornment position="end">
      <Tooltip title={label}>
        {disabled ? (
          <Box component="span" aria-disabled sx={{ display: "inline-flex" }}>
            {buttonNode}
          </Box>
        ) : (
          buttonNode
        )}
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
  maxLength,
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
        slotProps={{
          input: { readOnly: true, endAdornment: <SecretRevealToggle {...toggleProps} /> },
          htmlInput: { maxLength },
        }}
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
      slotProps={{ input: { endAdornment: <SecretRevealToggle {...toggleProps} /> }, htmlInput: { maxLength } }}
    />
  );
}
