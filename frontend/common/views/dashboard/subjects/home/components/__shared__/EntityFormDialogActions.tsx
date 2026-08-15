"use client";

import { Button, CircularProgress, DialogActions } from "@mui/material";

interface EntityFormDialogActionsProps {
  /** HTML id of the <form> the submit button should target. */
  readonly formId: string;
  readonly cancelLabel: string;
  readonly saveLabel: string;
  readonly onClose: () => void;
  readonly isLoading: boolean;
}

/**
 * Shared cancel/save action row for the entity (category & subject) create/edit
 * dialogs.
 *
 * Extracted from the previously duplicated ~25 line DialogActions block that
 * appeared in CreateCategoryDialog, CreateSubjectDialog, and EditSubjectDialog
 * (and a near-identical copy in EditCategoryDialog). The `formId` prop lets
 * each dialog target its own <form> without re-implementing the button styling,
 * and the labels are passed in already translated so this component has no
 * translation dependency and stays trivially reusable.
 */
export function EntityFormDialogActions({
  formId,
  cancelLabel,
  saveLabel,
  onClose,
  isLoading,
}: Readonly<EntityFormDialogActionsProps>) {
  return (
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button
        onClick={onClose}
        disabled={isLoading}
        variant="text"
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
        disabled={isLoading}
        variant="contained"
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
  );
}
