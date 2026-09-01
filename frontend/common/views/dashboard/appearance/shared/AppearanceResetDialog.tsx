import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

interface AppearanceResetDialogLabels {
  readonly resetConfirmTitle: string;
  readonly resetConfirmBody: string;
  readonly resetConfirmCancel: string;
  readonly resetConfirmConfirm: string;
}

export interface AppearanceResetDialogProps {
  readonly open: boolean;
  readonly loading: boolean;
  readonly labels: AppearanceResetDialogLabels;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function AppearanceResetDialog({ open, loading, labels, onClose, onConfirm }: AppearanceResetDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{labels.resetConfirmTitle}</DialogTitle>
      <DialogContent>{labels.resetConfirmBody}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.resetConfirmCancel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {labels.resetConfirmConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
