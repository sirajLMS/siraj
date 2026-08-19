"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Translation, useAppTranslation } from "@/shared/locale";

export type EditableTypographySharedProps = {
  readonly typography: TypographyProps;
  readonly textField: TextFieldProps;
  readonly onSaveAction: (value: string) => undefined | string | Promise<undefined | string>;
  readonly doubleClickToEdit?: boolean;
  readonly startEditing?: boolean;
  readonly value: string;
  readonly isValidAction?: (value: string) => string | undefined | null;
  readonly onCancelAction?: () => void;
};

export type EditableTypographySlotProps = {
  /** Size override for the action IconButtons in the end adornment. */
  readonly iconButtonSize?: "small" | "medium" | "large";
  /** Optional sx to spread on the TextField (tier-specific defaults). */
  readonly textFieldSx?: SxProps<Theme>;
  /** Whether to default TextField size to "small" when not explicitly set. */
  readonly defaultTextFieldSize?: boolean;
};

const HoverTypography = styled(Typography)(({ theme }) => ({
  "&:hover": {
    cursor: "text",
    background: theme.palette.action.hover,
  },
}));

function EditableTypographyEditField({
  textField,
  inputValue,
  error,
  onInputChange,
  onKeyDown,
  inputRef,
  endAdornment,
  defaultTextFieldSize,
  textFieldSx,
}: {
  readonly textField: TextFieldProps;
  readonly inputValue: string;
  readonly error: string | undefined | null;
  readonly onInputChange: (value: string) => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly endAdornment: React.ReactNode;
  readonly defaultTextFieldSize?: boolean;
  readonly textFieldSx?: SxProps<Theme>;
}) {
  return (
    <TextField
      {...textField}
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

export function EditableTypographyShared({
  typography,
  textField,
  onSaveAction: onSave,
  doubleClickToEdit = true,
  startEditing = false,
  value,
  isValidAction: isValid,
  onCancelAction: onCancel,
  iconButtonSize = "small",
  defaultTextFieldSize,
  textFieldSx,
}: Readonly<EditableTypographySharedProps & EditableTypographySlotProps>) {
  const t = useAppTranslation(Translation.Ui.EditableTypography);
  const [isEditing, setIsEditing] = useState(startEditing);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | undefined | null>();
  const inputRef = useRef<HTMLInputElement>(null);
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [prevStartEditing, setPrevStartEditing] = useState(startEditing);
  const [prevValue, setPrevValue] = useState(value);

  if (prevStartEditing !== startEditing) {
    setPrevStartEditing(startEditing);
    setIsEditing(startEditing);
  }

  if (prevValue !== value && !isEditing) {
    setPrevValue(value);
    setInputValue(value);
  }

  const handleClick = useCallback(() => {
    if (!doubleClickToEdit) {
      setIsEditing(true);
    }
  }, [doubleClickToEdit]);

  const handleDoubleClick = useCallback(() => {
    if (doubleClickToEdit) {
      setIsEditing(true);
    }
  }, [doubleClickToEdit]);

  const handleTouchStart = useCallback(() => {
    touchTimeout.current = setTimeout(() => {
      setIsEditing(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (isValid) {
      const validationError = isValid(inputValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    const saveResult = await onSave(inputValue);
    if (typeof saveResult === "string" && saveResult) {
      setError(saveResult);
      return;
    }
    setError(undefined);
    setIsEditing(false);
  }, [isValid, inputValue, onSave]);

  const handleCancel = useCallback(() => {
    setInputValue(value);
    setIsEditing(false);
    onCancel?.();
  }, [value, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleSave().then(r => r);
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const endAdornment = useMemo(
    () => (
      <InputAdornment position="end">
        <IconButton onClick={handleSave} aria-label={t.save} color="success" size={iconButtonSize}>
          <CheckIcon />
        </IconButton>
        <IconButton onClick={handleCancel} aria-label={t.cancel} color="error" size={iconButtonSize}>
          <CloseIcon />
        </IconButton>
      </InputAdornment>
    ),
    [handleSave, handleCancel, iconButtonSize, t.save, t.cancel]
  );

  if (isEditing) {
    return (
      <EditableTypographyEditField
        textField={textField}
        inputValue={inputValue}
        error={error}
        onInputChange={nextValue => {
          setInputValue(nextValue);
          if (isValid) {
            setError(isValid(nextValue));
          }
        }}
        onKeyDown={handleKeyDown}
        inputRef={inputRef}
        endAdornment={endAdornment}
        defaultTextFieldSize={defaultTextFieldSize}
        textFieldSx={textFieldSx}
      />
    );
  }

  return (
    <HoverTypography
      {...typography}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {value}
    </HoverTypography>
  );
}
