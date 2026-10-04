"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TextFieldProps } from "@mui/material/TextField";
import type { TypographyProps } from "@mui/material/Typography";
import { useMemo } from "react";
import {
  useEditableTypographyActivation,
  useEditableTypographyController,
} from "@/frontend/common/components/ui/input/editableTypography/EditableTypographyShared.hooks";
import {
  EditableActionsAdornment,
  EditableTypographyDisplay,
  EditableTypographyEditField,
} from "@/frontend/common/components/ui/input/editableTypography/EditableTypographyShared.parts";
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
  const {
    isEditing,
    inputValue,
    error,
    inputRef,
    activate,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleInputChange,
  } = useEditableTypographyController({
    startEditing,
    value,
    isValidAction: isValid,
    onSaveAction: onSave,
    onCancelAction: onCancel,
  });
  const { handleClick, handleDoubleClick, handleTouchStart, handleTouchEnd } = useEditableTypographyActivation({
    doubleClickToEdit,
    onActivate: activate,
  });

  const endAdornment = useMemo(
    () => (
      <EditableActionsAdornment
        onSave={handleSave}
        onCancel={handleCancel}
        iconButtonSize={iconButtonSize}
        saveLabel={t.save}
        cancelLabel={t.cancel}
      />
    ),
    [handleSave, handleCancel, iconButtonSize, t.save, t.cancel]
  );

  if (isEditing) {
    return (
      <EditableTypographyEditField
        textField={textField}
        inputValue={inputValue}
        error={error}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        inputRef={inputRef}
        endAdornment={endAdornment}
        defaultTextFieldSize={defaultTextFieldSize}
        textFieldSx={textFieldSx}
      />
    );
  }

  const editHint = doubleClickToEdit ? t.doubleClickToEdit : t.clickToEdit;

  return (
    <EditableTypographyDisplay
      value={value}
      typography={typography}
      editHint={editHint}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  );
}
