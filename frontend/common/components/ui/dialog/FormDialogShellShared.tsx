"use client";

import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { type ReactNode, useId } from "react";

export interface FormDialogShellSharedProps {
  readonly open: boolean;
  /** Close handler; swallowed by the dialog while a submit is in flight. */
  readonly onClose: () => void;
  /** Native form submit handler wired to the internal <form> element. */
  readonly onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly isSubmitting: boolean;
  readonly title: string;
  /** Form field content rendered inside the scrollable dialog body. */
  readonly children: ReactNode;
  readonly cancelLabel: string;
  readonly submitLabel: string;
  /** Optional label shown on the submit button while submitting; the button shows only a spinner when omitted. */
  readonly submittingLabel?: string;
  /** Full-screen rendering used by the mobile tier wrapper. Defaults to false. */
  readonly fullScreen?: boolean;
  /** Max-width preset for centered panels. Defaults to "sm". */
  readonly maxWidth?: "xs" | "sm" | "md" | "lg";
}

/**
 * Viewport-agnostic dialog chrome for form dialogs used by both tiers.
 * Renders a centered <Dialog> wrapping a native <form> so the confirm
 * action submits it, a themed title, a scrollable divider body, and a
 * cancel/submit action row. Close requests are ignored while a submit
 * is in flight so in-progress mutations cannot be dismissed midway.
 */
export function FormDialogShellShared({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  children,
  cancelLabel,
  submitLabel,
  submittingLabel,
  fullScreen = false,
  maxWidth = "sm",
}: Readonly<FormDialogShellSharedProps>) {
  const titleId = useId();

  return (
    <Dialog
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      aria-labelledby={titleId}
    >
      <form onSubmit={onSubmit}>
        <DialogTitle id={titleId} sx={{ typography: "titleLg" }}>
          {title}
        </DialogTitle>
        <DialogContent dividers>{children}</DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} sx={theme => ({ color: theme.palette.onPrimary })} />
              ) : undefined
            }
          >
            {isSubmitting ? (submittingLabel ?? "") : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
