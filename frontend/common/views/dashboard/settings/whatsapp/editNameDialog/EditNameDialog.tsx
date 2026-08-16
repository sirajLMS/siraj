"use client";

import { Alert, Dialog, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { DialogSaveCancelActions } from "@/frontend/common/views/dashboard/settings/whatsapp/dialogs";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface EditNameDialogProps {
  readonly open: boolean;
  readonly accountId: string | null;
  readonly initialDisplayName: string;
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly mutationError: string | null;
  readonly onClose: () => void;
  readonly onSubmit: (accountId: string, displayName: string) => Promise<void>;
  readonly validateDisplayName: (value: string) => string | null;
}

type WhatsappValidationKey = "validationDisplayNameRequired" | "validationDisplayNameTooLong";

const VALIDATION_KEYS: ReadonlySet<string> = new Set(["validationDisplayNameRequired", "validationDisplayNameTooLong"]);

function isValidationKey(value: string): value is WhatsappValidationKey {
  return VALIDATION_KEYS.has(value);
}

function resolveValidationError(key: string | null, labels: WhatsappLabels): string | null {
  if (key === null) {
    return null;
  }
  if (isValidationKey(key)) {
    return labels[key];
  }
  return key;
}

function useEditNameForm(
  open: boolean,
  initialDisplayName: string,
  labels: WhatsappLabels,
  validateDisplayName: (value: string) => string | null
) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDisplayName(initialDisplayName);
      setDisplayNameError(null);
    }
  }, [open, initialDisplayName]);

  const handleChange = useCallback(
    (value: string) => {
      setDisplayName(value);
      setDisplayNameError(resolveValidationError(validateDisplayName(value), labels));
    },
    [labels, validateDisplayName]
  );

  const validate = useCallback((): string | null => {
    const err = resolveValidationError(validateDisplayName(displayName), labels);
    setDisplayNameError(err);
    return err;
  }, [displayName, labels, validateDisplayName]);

  return { displayName, displayNameError, handleChange, validate };
}

export function EditNameDialog({
  open,
  accountId,
  initialDisplayName,
  labels,
  loading,
  mutationError,
  onClose,
  onSubmit,
  validateDisplayName,
}: Readonly<EditNameDialogProps>) {
  const form = useEditNameForm(open, initialDisplayName, labels, validateDisplayName);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (accountId === null) {
      return;
    }
    const err = form.validate();
    if (err !== null) {
      return;
    }
    await onSubmit(accountId, form.displayName);
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
            onChange={e => form.handleChange(e.target.value)}
            error={form.displayNameError !== null}
            helperText={form.displayNameError}
            aria-invalid={form.displayNameError !== null}
            fullWidth
            disabled={loading}
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
