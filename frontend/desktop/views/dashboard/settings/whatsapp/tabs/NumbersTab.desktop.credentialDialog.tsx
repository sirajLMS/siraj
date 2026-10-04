"use client";

import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import type { CredentialEditDialogSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/credentialEditDialogShared.types";
import { TokenTestButton } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/TokenTestButtonShared";
import type { CredentialDialogState } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.helpers";
import { useCredentialEditForm } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.hooks";

export function CredentialEditDialog({
  open,
  state,
  labels,
  onClose,
  onConfirm,
  onTest,
  tokenTestStates,
}: Readonly<CredentialEditDialogSharedProps<CredentialDialogState>>) {
  const form = useCredentialEditForm(state, labels, onClose, onConfirm, onTest, tokenTestStates);

  return (
    <Dialog open={open} onClose={form.handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{form.title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          type={form.showToken ? "text" : "password"}
          label={form.fieldLabel}
          placeholder={form.placeholder}
          value={form.value}
          onChange={e => form.setValue(e.target.value)}
          error={form.testFailed}
          helperText={form.testFailed ? (form.testFailureText ?? undefined) : undefined}
          aria-invalid={form.testFailed}
          sx={{ mt: 1 }}
          slotProps={{
            input: {
              endAdornment: form.isToken ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={form.showToken ? labels.hideToken : labels.showToken}
                    onClick={() => form.setShowToken(previous => !previous)}
                    edge="end"
                  >
                    {form.showToken ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={form.handleClose}>{labels.cancel}</Button>
        {form.isToken ? (
          <TokenTestButton
            testing={form.testing}
            testState={form.testState}
            disabled={form.value.length === 0}
            labels={labels}
            onTest={form.handleTest}
          />
        ) : null}
        <Button variant="contained" disabled={form.saveDisabled} onClick={form.handleConfirm}>
          {form.submitting ? <CircularProgress size={20} /> : labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
