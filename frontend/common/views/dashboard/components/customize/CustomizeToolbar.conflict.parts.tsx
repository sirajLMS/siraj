import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { DialogPresets } from "@/frontend/common/components/ui/dialog";
import type { SettingsAppearanceTabLabels } from "@/shared/locale/types/dashboard/settings/appearance";

export interface CustomizeConflictDialogProps {
  readonly open: boolean;
  readonly labels: SettingsAppearanceTabLabels;
  readonly onCancel: () => void;
  readonly onReload: () => void;
  readonly onOverwrite: () => void;
}

/**
 * Optimistic-concurrency resolution dialog (AC-33): Reload re-syncs the
 * local store from the server, Overwrite re-runs the failed mutation
 * without the `expectedUpdatedAt` guard, Cancel keeps local edits.
 */
export function CustomizeConflictDialog({
  open,
  labels: t,
  onCancel,
  onReload,
  onOverwrite,
}: CustomizeConflictDialogProps) {
  return (
    <Dialog {...DialogPresets.confirm} open={open} onClose={onCancel}>
      <DialogTitle>{t.conflictTitle}</DialogTitle>
      <DialogContent>{t.conflictBody}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t.conflictCancel}</Button>
        <Button onClick={onReload} color="primary" variant="outlined">
          {t.conflictReload}
        </Button>
        <Button onClick={onOverwrite} color="warning" variant="contained">
          {t.conflictOverwrite}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
