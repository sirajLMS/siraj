"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { styled } from "@mui/material/styles";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type EditableTypographyProps = {
  readonly typography: TypographyProps;
  readonly textField: TextFieldProps;
  readonly onSaveAction: (value: string) => undefined | string | Promise<undefined | string>;
  readonly doubleClickToEdit?: boolean;
  readonly startEditing?: boolean;
  readonly value: string;
  readonly isValidAction?: (value: string) => string | undefined | null;
  readonly onCancelAction?: () => void;
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
}: {
  readonly textField: TextFieldProps;
  readonly inputValue: string;
  readonly error: string | undefined | null;
  readonly onInputChange: (value: string) => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly endAdornment: React.ReactNode;
}) {
  return (
    <TextField
      {...textField}
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

export const EditableTypography: React.FC<EditableTypographyProps> = ({
  typography,
  textField,
  onSaveAction: onSave,
  doubleClickToEdit = true,
  startEditing = false,
  value,
  isValidAction: isValid,
  onCancelAction: onCancel,
}) => {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | undefined | null>();
  const inputRef = useRef<HTMLInputElement>(null);
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsEditing(startEditing);
  }, [startEditing]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

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
        handleSave().then(r => r);
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const endAdornment = useMemo(
    () => (
      <InputAdornment position="end">
        <IconButton onClick={handleSave} color="success" size="small">
          <CheckIcon />
        </IconButton>
        <IconButton onClick={handleCancel} color="error" size="small">
          <CloseIcon />
        </IconButton>
      </InputAdornment>
    ),
    [handleSave, handleCancel]
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
};
