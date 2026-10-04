"use client";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import type { CredentialEditDialogSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/credentialEditDialogShared.types";
import { TokenTestButton } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/TokenTestButtonShared";
import { resolveTokenTestFailureText } from "@/frontend/common/views/dashboard/settings/whatsapp/tokenTestFailureText";
import { TokenVisibilityAdornmentMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.cardParts";
import { useCredentialDialogActions } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.credentialDialog.hooks";
import type { CredentialDialogState } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.helpers";

export function CredentialEditDialogMobile({
  open,
  state,
  labels,
  onClose,
  onConfirm,
  onTest,
  tokenTestStates,
  loading,
  validate,
}: Readonly<
  CredentialEditDialogSharedProps<CredentialDialogState> & {
    readonly loading: boolean;
    readonly validate: (value: string) => string | null;
  }
>) {
  const { form, testing, showToken, setShowToken, handleClose, handleConfirm, handleFieldChange, handleTest } =
    useCredentialDialogActions({ state, labels, onClose, onConfirm, onTest, validate });

  const isToken = state.field === "accessToken";
  const title = isToken ? labels.editToken : labels.editPin;
  const fieldLabel = isToken ? labels.accessToken : labels.twoStepPin;
  const placeholder = isToken ? labels.accessTokenPlaceholder : labels.twoStepPinPlaceholder;
  const busy = form.submitting || loading;
  const tokenTestResult = isToken ? tokenTestStates[state.accountId]?.[form.value] : undefined;
  const testState = tokenTestResult?.state;
  const testFailureText = tokenTestResult ? resolveTokenTestFailureText(labels, tokenTestResult) : null;
  const testFailed = testState === "failed";
  const fieldError = form.error !== null || testFailed;
  const fieldHelperText = testFailed ? testFailureText : form.error;
  const saveDisabled = isToken
    ? busy || testing || form.value.length === 0 || testState !== "success"
    : busy || form.value.length === 0;

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type={showToken ? "text" : "password"}
            label={fieldLabel}
            placeholder={placeholder}
            value={form.value}
            onChange={handleFieldChange}
            error={fieldError}
            helperText={fieldHelperText ?? undefined}
            aria-invalid={fieldError}
            disabled={busy}
            slotProps={{
              input: {
                endAdornment: (
                  <TokenVisibilityAdornmentMobile
                    isToken={isToken}
                    show={showToken}
                    labels={labels}
                    onToggle={() => setShowToken(previous => !previous)}
                  />
                ),
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          {labels.cancel}
        </Button>
        {isToken ? (
          <TokenTestButton
            testing={testing}
            testState={testState}
            disabled={form.value.length === 0}
            labels={labels}
            onTest={handleTest}
          />
        ) : null}
        <Button variant="contained" disabled={saveDisabled} onClick={handleConfirm}>
          {form.submitting || loading ? <CircularProgress size={20} /> : labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
