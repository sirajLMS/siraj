"use client";

import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import type { ReactNode } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";

export interface EntityFormDialogProps {
  readonly open: boolean;
  readonly title: string;
  /** HTML id of the <form> rendered in children that the submit button targets. */
  readonly formId: string;
  readonly cancelLabel: string;
  readonly saveLabel: string;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/**
 * Generic form-dialog shell for entity create/edit flows that own their
 * <form> element outside the shell (form id targeting instead of a wrapping
 * form). Children are rendered inside the dialog body and provide the form
 * fields plus the <form> element; the shell renders the chrome (title, body
 * container, and the cancel/save action row). Labels are passed in already
 * translated so the shell has no translation dependency, and the close path
 * is guarded while a save is in flight so consumers can pass a plain
 * `onClose` handler.
 */
export function EntityFormDialog({
  open,
  title,
  formId,
  cancelLabel,
  saveLabel,
  isLoading,
  onClose,
  children,
}: Readonly<EntityFormDialogProps>) {
  return (
    <Dialog {...DialogPresets.info} open={open} onClose={isLoading ? undefined : onClose}>
      <DialogTitle sx={{ typography: "titleLg" }}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="text"
          onClick={onClose}
          disabled={isLoading}
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontWeight: 700,
            borderRadius: 1.5,
          })}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          form={formId}
          variant="contained"
          disabled={isLoading}
          aria-busy={isLoading}
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          {isLoading ? <CircularProgress size={20} sx={theme => ({ color: theme.palette.onPrimary })} /> : saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
