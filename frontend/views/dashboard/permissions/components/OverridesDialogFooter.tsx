"use client";

import { Button, CircularProgress, DialogActions } from "@mui/material";

interface OverridesDialogFooterProps {
  readonly onClose: () => void;
  readonly handleSave: () => Promise<void>;
  readonly isDialogLoading: boolean;
  readonly isSaving: boolean;
  readonly t: (key: string) => string;
}

export function OverridesDialogFooter({
  onClose,
  handleSave,
  isDialogLoading,
  isSaving,
  t,
}: Readonly<OverridesDialogFooterProps>) {
  return (
    <DialogActions sx={theme => ({ borderTop: `1px solid ${theme.palette.divider}`, px: 3, py: 2 })}>
      <Button
        onClick={onClose}
        disabled={isDialogLoading}
        variant="text"
        sx={theme => ({
          color: theme.palette.text.secondary,
          fontWeight: 700,
          borderRadius: 1.5,
        })}
      >
        {t("cancel")}
      </Button>
      <Button
        onClick={handleSave}
        disabled={isDialogLoading}
        variant="contained"
        sx={theme => ({
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          fontWeight: 700,
          borderRadius: 1.5,
          "&:hover": {
            bgcolor: theme.palette.primary.dark,
          },
        })}
      >
        {isSaving ? <CircularProgress size={20} color="inherit" /> : "Save Overrides"}
      </Button>
    </DialogActions>
  );
}
