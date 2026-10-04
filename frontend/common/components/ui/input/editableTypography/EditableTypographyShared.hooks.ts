import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseEditableTypographyActivationOptions {
  readonly doubleClickToEdit: boolean;
  readonly onActivate: () => void;
}

export function useEditableTypographyActivation({
  doubleClickToEdit,
  onActivate,
}: UseEditableTypographyActivationOptions) {
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback(() => {
    if (!doubleClickToEdit) {
      onActivate();
    }
  }, [doubleClickToEdit, onActivate]);

  const handleDoubleClick = useCallback(() => {
    if (doubleClickToEdit) {
      onActivate();
    }
  }, [doubleClickToEdit, onActivate]);

  const handleTouchStart = useCallback(() => {
    touchTimeout.current = setTimeout(() => {
      onActivate();
    }, 500);
  }, [onActivate]);

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

  return { handleClick, handleDoubleClick, handleTouchStart, handleTouchEnd };
}

export interface UseEditableTypographyControllerOptions {
  readonly startEditing: boolean;
  readonly value: string;
  readonly isValidAction?: (value: string) => string | undefined | null;
  readonly onSaveAction: (value: string) => undefined | string | Promise<undefined | string>;
  readonly onCancelAction?: () => void;
}

export function useEditableTypographyController({
  startEditing,
  value,
  isValidAction: isValid,
  onSaveAction: onSave,
  onCancelAction: onCancel,
}: UseEditableTypographyControllerOptions) {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | undefined | null>();
  const inputRef = useRef<HTMLInputElement>(null);
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

  const activate = useCallback(() => setIsEditing(true), []);

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

  const handleInputChange = useCallback(
    (nextValue: string) => {
      setInputValue(nextValue);
      if (isValid) {
        setError(isValid(nextValue));
      }
    },
    [isValid]
  );

  return {
    isEditing,
    inputValue,
    error,
    inputRef,
    activate,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleInputChange,
  };
}
