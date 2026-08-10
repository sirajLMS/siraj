"use client";

import type { DialogProps } from "@mui/material/Dialog";

/**
 * Shared dialog presets for consistent styling and behavior.
 * Apply these to Dialog components using the spread operator:
 *
 * ```tsx
 * <Dialog {...DialogPresets.confirm}>
 *   <DialogTitle>Confirm Action</DialogTitle>
 *   <DialogContent>
 *     <DialogContentText>Are you sure?</DialogContentText>
 *   </DialogContent>
 *   <DialogActions>
 *     <Button onClick={onClose}>Cancel</Button>
 *     <Button onClick={onConfirm}>Confirm</Button>
 *   </DialogActions>
 * </Dialog>
 * ```
 */

export const DialogPresets = {
  /**
   * Confirmation dialog preset (small width, centered).
   * Use for delete, cancel, or irreversible actions.
   */
  confirm: {
    maxWidth: "xs",
    fullWidth: true,
  } satisfies Partial<DialogProps>,

  /**
   * Error dialog preset (small width, centered).
   * Use for displaying error messages or alerts.
   */
  error: {
    maxWidth: "xs",
    fullWidth: true,
  } satisfies Partial<DialogProps>,

  /**
   * Info dialog preset (medium width).
   * Use for informational or form dialogs.
   */
  info: {
    maxWidth: "sm",
    fullWidth: true,
  } satisfies Partial<DialogProps>,

  /**
   * Large dialog preset (large width).
   * Use for complex forms or detailed content.
   */
  large: {
    maxWidth: "md",
    fullWidth: true,
  } satisfies Partial<DialogProps>,
};
