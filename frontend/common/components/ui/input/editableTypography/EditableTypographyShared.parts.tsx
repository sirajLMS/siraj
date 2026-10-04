"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type React from "react";

/**
 * Display control. It renders as a native `<button>` so keyboard users get Enter/Space
 * activation for free; the resets keep the surrounding text flow intact.
 */
const HoverButton = styled("button")(({ theme }) => ({
  cursor: "pointer",
  font: "inherit",
  color: "inherit",
  textAlign: "inherit",
  background: "none",
  border: 0,
  borderRadius: Number(theme.shape.borderRadius),
  paddingBlock: 0,
  paddingInline: theme.spacing(0.5),
  marginBlock: 0,
  marginInline: theme.spacing(-0.5),
  transition: theme.transitions.create(["background-color", "outline"]),
  "&:hover": {
    background: theme.palette.action.hover,
  },
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

export interface EditableTypographyEditFieldProps {
  readonly textField: TextFieldProps;
  readonly inputValue: string;
  readonly error: string | undefined | null;
  readonly onInputChange: (value: string) => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly endAdornment: React.ReactNode;
  readonly defaultTextFieldSize?: boolean;
  readonly textFieldSx?: SxProps<Theme>;
}

export function EditableTypographyEditField({
  textField,
  inputValue,
  error,
  onInputChange,
  onKeyDown,
  inputRef,
  endAdornment,
  defaultTextFieldSize,
  textFieldSx,
}: Readonly<EditableTypographyEditFieldProps>) {
  return (
    <TextField
      {...textField}
      autoFocus
      size={defaultTextFieldSize ? (textField.size ?? "small") : textField.size}
      sx={textFieldSx}
      value={inputValue}
      onChange={e => onInputChange(e.target.value)}
      error={!!error}
      helperText={error}
      onKeyDown={onKeyDown}
      inputRef={inputRef}
      slotProps={{
        input: {
          endAdornment,
        },
      }}
    />
  );
}

export interface EditableActionsAdornmentProps {
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly iconButtonSize: "small" | "medium" | "large";
  readonly saveLabel: string;
  readonly cancelLabel: string;
}

export function EditableActionsAdornment({
  onSave,
  onCancel,
  iconButtonSize,
  saveLabel,
  cancelLabel,
}: Readonly<EditableActionsAdornmentProps>) {
  return (
    <InputAdornment position="end">
      <Tooltip title={saveLabel}>
        <IconButton onClick={onSave} aria-label={saveLabel} color="success" size={iconButtonSize}>
          <CheckIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={cancelLabel}>
        <IconButton onClick={onCancel} aria-label={cancelLabel} color="error" size={iconButtonSize}>
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );
}

export interface EditableTypographyDisplayProps {
  readonly value: string;
  readonly typography: TypographyProps;
  readonly editHint: string;
  readonly onClick: () => void;
  readonly onDoubleClick: () => void;
  readonly onTouchStart: () => void;
  readonly onTouchEnd: () => void;
}

export function EditableTypographyDisplay({
  value,
  typography,
  editHint,
  onClick,
  onDoubleClick,
  onTouchStart,
  onTouchEnd,
}: Readonly<EditableTypographyDisplayProps>) {
  return (
    <Tooltip title={editHint}>
      <HoverButton
        type="button"
        aria-label={`${value} (${editHint})`}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Typography {...typography}>{value}</Typography>
      </HoverButton>
    </Tooltip>
  );
}
