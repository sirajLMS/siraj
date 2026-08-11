"use client";

import { Button } from "@mui/material";
import type { Theme } from "@mui/material/styles";

/** Shared slot props interface for dialog action button configuration. */
export interface DialogActionSlotProps {
  /** Dialog-level props (fullScreen vs sm-width, aria-labelledby, etc.). */
  readonly dialogProps: Readonly<Record<string, unknown>>;
  /** Sx for the DialogActions container (column vs row layout, gap, etc.). */
  readonly actionsSx: import("@mui/material/styles").SxProps<Theme>;
  /** Whether action buttons should be full-width (mobile) or auto (desktop). */
  readonly actionButtonsFullWidth: boolean;
  /** Extra Sx applied to the cancel button (mobile adds py: 1.5). */
  readonly cancelButtonSx: Record<string, unknown> | undefined;
  /** Extra Sx applied to the save button (mobile adds py: 1.5). */
  readonly saveButtonSx: Record<string, unknown> | undefined;
  /** Button render order: desktop = cancel-first, mobile = save-first. */
  readonly actionOrder: "cancel-first" | "save-first";
}

function cancelSx(theme: Theme): Record<string, unknown> {
  return {
    color: theme.palette.text.secondary,
    fontWeight: 700,
    borderRadius: 1.5,
  };
}

function saveSx(theme: Theme): Record<string, unknown> {
  return {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.onPrimary,
    fontWeight: 700,
    borderRadius: 1.5,
    "&:hover": { backgroundColor: theme.palette.primary.dark },
  };
}

export function DialogCancelButton({
  onClose,
  isLoading,
  cancelLabel,
  fullWidth,
  extraSx,
}: Readonly<{
  onClose: () => void;
  isLoading: boolean;
  cancelLabel: string;
  fullWidth: boolean;
  extraSx: Record<string, unknown> | undefined;
}>) {
  return (
    <Button
      onClick={onClose}
      disabled={isLoading}
      fullWidth={fullWidth}
      variant="text"
      sx={theme => ({
        ...cancelSx(theme),
        ...extraSx,
      })}
    >
      {cancelLabel}
    </Button>
  );
}

export function DialogSaveButton({
  formId,
  isLoading,
  saveLabel,
  savingLabel,
  fullWidth,
  extraSx,
}: Readonly<{
  formId: string;
  isLoading: boolean;
  saveLabel: string;
  savingLabel: string;
  fullWidth: boolean;
  extraSx: Record<string, unknown> | undefined;
}>) {
  return (
    <Button
      type="submit"
      form={formId}
      disabled={isLoading}
      fullWidth={fullWidth}
      variant="contained"
      sx={theme => ({
        ...saveSx(theme),
        ...extraSx,
      })}
    >
      {isLoading ? savingLabel : saveLabel}
    </Button>
  );
}

export function DialogActionsRenderer({
  slots,
  cancelBtn,
  saveBtn,
}: Readonly<{
  slots: DialogActionSlotProps;
  cancelBtn: React.ReactNode;
  saveBtn: React.ReactNode;
}>) {
  return (
    <>
      {slots.actionOrder === "cancel-first" ? (
        <>
          {cancelBtn}
          {saveBtn}
        </>
      ) : (
        <>
          {saveBtn}
          {cancelBtn}
        </>
      )}
    </>
  );
}
