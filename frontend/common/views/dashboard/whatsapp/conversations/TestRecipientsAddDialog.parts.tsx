"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { PhoneInput } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";
import type { WhatsappRecipientPanelLabels } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

const ADD_DIALOG_ID = "whatsapp-add-test-recipient-dialog";

type TestRecipientsAddDialogProps = Readonly<{
  labels: WhatsappRecipientPanelLabels;
  open: boolean;
  phone: string;
  phoneValid: boolean;
  note: string;
  error: string | null;
  busy: boolean;
  onClose: () => void;
  onPhoneChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}>;

export function TestRecipientsAddDialog({
  labels,
  open,
  phone,
  phoneValid,
  note,
  error,
  busy,
  onClose,
  onPhoneChange,
  onNoteChange,
  onSubmit,
}: TestRecipientsAddDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={ADD_DIALOG_ID} maxWidth="xs" fullWidth>
      <DialogTitle id={ADD_DIALOG_ID}>{labels.addRecipientDialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <PhoneInput
            label={labels.recipientPhoneLabel}
            placeholder={labels.recipientPhonePlaceholder}
            value={phone === "" ? null : phone}
            onChangeAction={value => onPhoneChange(value ?? "")}
            fullWidth
          />
          <TextField
            size="small"
            fullWidth
            label={labels.recipientNoteLabel}
            placeholder={labels.recipientNotePlaceholder}
            value={note}
            onChange={event => onNoteChange(event.target.value)}
          />
          {error !== null && error !== "" && (
            <Alert severity="error" component="div">
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {labels.dialogCancel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={busy || !phoneValid}
          startIcon={busy ? <CircularProgress size={16} /> : undefined}
        >
          {labels.dialogSave}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
