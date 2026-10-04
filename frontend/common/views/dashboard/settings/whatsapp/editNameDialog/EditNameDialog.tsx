"use client";

import { Alert, Dialog, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useCallback } from "react";
import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { DialogSaveCancelActions } from "@/frontend/common/views/dashboard/settings/whatsapp/dialogs";
import { useEditNameForm } from "@/frontend/common/views/dashboard/settings/whatsapp/editNameDialog/EditNameDialog.hooks";
import { resolvePurposeValue } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
import { WhatsappPurposeSelect } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeSelect";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface EditNameDialogProps {
  readonly open: boolean;
  readonly accountId: string | null;
  readonly initialDisplayName: string;
  /** Current routing purpose of the account (pre-selected in the purpose select). */
  readonly initialPurpose: WhatsappAccountPurpose;
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly mutationError: string | null;
  readonly onClose: () => void;
  readonly onSubmit: (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => Promise<void>;
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePurpose: (value: string) => string | null;
}

function EditPurposeFields({
  labels,
  loading,
  purpose,
  purposeError,
  onPurposeChange,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly purpose: string;
  readonly purposeError: string | null;
  readonly onPurposeChange: (value: string) => void;
}>) {
  return (
    <WhatsappPurposeSelect
      labels={labels}
      value={purpose}
      error={purposeError}
      disabled={loading}
      onChange={onPurposeChange}
    />
  );
}

export function EditNameDialog({
  open,
  accountId,
  initialDisplayName,
  initialPurpose,
  labels,
  loading,
  mutationError,
  onClose,
  onSubmit,
  validateDisplayName,
  validatePurpose,
}: Readonly<EditNameDialogProps>) {
  const form = useEditNameForm(open, initialDisplayName, initialPurpose, labels, validateDisplayName, validatePurpose);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (accountId === null) {
      return;
    }
    if (!form.validate()) {
      return;
    }
    const purpose = resolvePurposeValue(form.purpose);
    if (purpose === undefined) {
      return;
    }
    await onSubmit(accountId, form.displayName, purpose);
  }, [accountId, form, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{labels.editNameTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={labels.displayNameLabel}
            placeholder={labels.displayNameHelper}
            value={form.displayName}
            onChange={e => form.handleNameChange(e.target.value)}
            error={form.displayNameError !== null}
            helperText={form.displayNameError}
            aria-invalid={form.displayNameError !== null}
            fullWidth
            disabled={loading}
          />
          <EditPurposeFields
            labels={labels}
            loading={loading}
            purpose={form.purpose}
            purposeError={form.purposeError}
            onPurposeChange={form.handlePurposeChange}
          />
          {mutationError !== null ? (
            <Alert severity="error" role="alert">
              {mutationError}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogSaveCancelActions labels={labels} loading={loading} onClose={handleClose} onSubmit={handleSubmit} />
    </Dialog>
  );
}
