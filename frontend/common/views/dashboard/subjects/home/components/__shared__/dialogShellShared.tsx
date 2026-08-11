"use client";

import { Box, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import type { ReactNode, SubmitEventHandler } from "react";
import {
  type DialogActionSlotProps,
  DialogActionsRenderer,
  DialogCancelButton,
  DialogSaveButton,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogActionButtonsShared";

export interface DialogShellSharedProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly isLoading: boolean;
  readonly titleId: string;
  readonly dialogTitle: string;
  readonly cancelLabel: string;
  readonly saveLabel: string;
  readonly savingLabel: string;
  readonly formId: string;
  readonly slots: DialogActionSlotProps;
  /** Pass-through for the form's onSubmit handler (e.g. handleSubmit(onSubmit)). */
  readonly onSubmit: SubmitEventHandler<HTMLFormElement>;
  readonly children: ReactNode;
}

const FORM_SX = { mt: 1, display: "flex", flexDirection: "column", gap: 3 } as const;

/** Shared dialog shell: Dialog → Title → Content → Box form → Actions. */
export function DialogShellShared({
  open,
  onClose,
  isLoading,
  titleId,
  dialogTitle,
  cancelLabel,
  saveLabel,
  savingLabel,
  formId,
  slots,
  onSubmit,
  children,
}: Readonly<DialogShellSharedProps>) {
  const cancelBtn = (
    <DialogCancelButton
      onClose={onClose}
      isLoading={isLoading}
      cancelLabel={cancelLabel}
      fullWidth={slots.actionButtonsFullWidth}
      extraSx={slots.cancelButtonSx}
    />
  );
  const saveBtn = (
    <DialogSaveButton
      formId={formId}
      isLoading={isLoading}
      saveLabel={saveLabel}
      savingLabel={savingLabel}
      fullWidth={slots.actionButtonsFullWidth}
      extraSx={slots.saveButtonSx}
    />
  );

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} {...slots.dialogProps}>
      <DialogTitle id={titleId}>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box component="form" id={formId} onSubmit={onSubmit} sx={FORM_SX}>
          {children}
        </Box>
      </DialogContent>
      <DialogActions sx={slots.actionsSx}>
        <DialogActionsRenderer slots={slots} cancelBtn={cancelBtn} saveBtn={saveBtn} />
      </DialogActions>
    </Dialog>
  );
}
