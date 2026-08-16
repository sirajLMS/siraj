import { Button, CircularProgress, DialogActions } from "@mui/material";

export function DialogSaveCancelActions({
  labels,
  loading,
  onClose,
  onSubmit,
}: Readonly<{
  readonly labels: { readonly cancel: string; readonly save: string };
  readonly loading: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
}>) {
  return (
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        {labels.cancel}
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} /> : undefined}
      >
        {labels.save}
      </Button>
    </DialogActions>
  );
}
