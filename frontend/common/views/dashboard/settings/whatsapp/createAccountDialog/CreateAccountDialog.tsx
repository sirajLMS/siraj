"use client";

import { Alert, Dialog, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useCallback, useState } from "react";
import { DialogSaveCancelActions } from "@/frontend/common/views/dashboard/settings/whatsapp/dialogs";
import type { WhatsappCreateInput } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface CreateAccountDialogProps {
  readonly open: boolean;
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly mutationError: string | null;
  readonly onClose: () => void;
  readonly onSubmit: (input: WhatsappCreateInput) => Promise<void>;
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
}

type WhatsappValidationKey =
  | "validationDisplayNameRequired"
  | "validationDisplayNameTooLong"
  | "validationPhoneNumberIdRequired"
  | "validationPhoneNumberIdNumeric"
  | "validationWabaIdRequired"
  | "validationWabaIdNumeric";

const VALIDATION_KEYS: ReadonlySet<string> = new Set([
  "validationDisplayNameRequired",
  "validationDisplayNameTooLong",
  "validationPhoneNumberIdRequired",
  "validationPhoneNumberIdNumeric",
  "validationWabaIdRequired",
  "validationWabaIdNumeric",
]);

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

interface CreateFormState {
  readonly displayName: string;
  readonly phoneNumberId: string;
  readonly wabaId: string;
  readonly displayNameError: string | null;
  readonly phoneNumberIdError: string | null;
  readonly wabaIdError: string | null;
}

function useCreateAccountForm(
  open: boolean,
  labels: WhatsappLabels,
  validateDisplayName: (value: string) => string | null,
  validatePhoneNumberId: (value: string) => string | null,
  validateWabaId: (value: string) => string | null
) {
  const [displayName, setDisplayName] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [phoneNumberIdError, setPhoneNumberIdError] = useState<string | null>(null);
  const [wabaIdError, setWabaIdError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDisplayName("");
      setPhoneNumberId("");
      setWabaId("");
      setDisplayNameError(null);
      setPhoneNumberIdError(null);
      setWabaIdError(null);
    }
  }

  const handleDisplayNameChange = useCallback(
    (value: string) => {
      setDisplayName(value);
      setDisplayNameError(resolveValidationError(validateDisplayName(value), labels));
    },
    [labels, validateDisplayName]
  );

  const handlePhoneNumberIdChange = useCallback(
    (value: string) => {
      setPhoneNumberId(value);
      setPhoneNumberIdError(resolveValidationError(validatePhoneNumberId(value), labels));
    },
    [labels, validatePhoneNumberId]
  );

  const handleWabaIdChange = useCallback(
    (value: string) => {
      setWabaId(value);
      setWabaIdError(resolveValidationError(validateWabaId(value), labels));
    },
    [labels, validateWabaId]
  );

  const validateAll = useCallback((): CreateFormState => {
    const dErr = resolveValidationError(validateDisplayName(displayName), labels);
    setDisplayNameError(dErr);
    const pErr = resolveValidationError(validatePhoneNumberId(phoneNumberId), labels);
    setPhoneNumberIdError(pErr);
    const wErr = resolveValidationError(validateWabaId(wabaId), labels);
    setWabaIdError(wErr);
    return { displayName, phoneNumberId, wabaId, displayNameError: dErr, phoneNumberIdError: pErr, wabaIdError: wErr };
  }, [displayName, phoneNumberId, wabaId, labels, validateDisplayName, validatePhoneNumberId, validateWabaId]);

  return {
    displayName,
    phoneNumberId,
    wabaId,
    displayNameError,
    phoneNumberIdError,
    wabaIdError,
    handleDisplayNameChange,
    handlePhoneNumberIdChange,
    handleWabaIdChange,
    validateAll,
  };
}

function CreateAccountDialogFields({
  labels,
  loading,
  displayName,
  phoneNumberId,
  wabaId,
  displayNameError,
  phoneNumberIdError,
  wabaIdError,
  onDisplayNameChange,
  onPhoneNumberIdChange,
  onWabaIdChange,
  mutationError,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly displayName: string;
  readonly phoneNumberId: string;
  readonly wabaId: string;
  readonly displayNameError: string | null;
  readonly phoneNumberIdError: string | null;
  readonly wabaIdError: string | null;
  readonly onDisplayNameChange: (value: string) => void;
  readonly onPhoneNumberIdChange: (value: string) => void;
  readonly onWabaIdChange: (value: string) => void;
  readonly mutationError: string | null;
}>) {
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField
        label={labels.displayNameLabel}
        placeholder={labels.displayNameHelper}
        value={displayName}
        onChange={e => onDisplayNameChange(e.target.value)}
        error={displayNameError !== null}
        helperText={displayNameError}
        aria-invalid={displayNameError !== null}
        fullWidth
        disabled={loading}
      />
      <TextField
        label={labels.phoneNumberIdLabel}
        placeholder={labels.phoneNumberIdHelper}
        value={phoneNumberId}
        onChange={e => onPhoneNumberIdChange(e.target.value)}
        error={phoneNumberIdError !== null}
        helperText={phoneNumberIdError}
        aria-invalid={phoneNumberIdError !== null}
        fullWidth
        disabled={loading}
      />
      <TextField
        label={labels.wabaIdLabel}
        placeholder={labels.wabaIdHelper}
        value={wabaId}
        onChange={e => onWabaIdChange(e.target.value)}
        error={wabaIdError !== null}
        helperText={wabaIdError}
        aria-invalid={wabaIdError !== null}
        fullWidth
        disabled={loading}
      />
      {mutationError !== null ? (
        <Alert severity="error" role="alert">
          {mutationError}
        </Alert>
      ) : null}
    </Stack>
  );
}

export function CreateAccountDialog({
  open,
  labels,
  loading,
  mutationError,
  onClose,
  onSubmit,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
}: Readonly<CreateAccountDialogProps>) {
  const form = useCreateAccountForm(open, labels, validateDisplayName, validatePhoneNumberId, validateWabaId);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const state = form.validateAll();
    if (state.displayNameError !== null || state.phoneNumberIdError !== null || state.wabaIdError !== null) {
      return;
    }
    await onSubmit({
      displayName: state.displayName,
      phoneNumberId: state.phoneNumberId,
      wabaId: state.wabaId,
    });
  }, [form, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{labels.createAccountTitle}</DialogTitle>
      <DialogContent>
        <CreateAccountDialogFields
          labels={labels}
          loading={loading}
          displayName={form.displayName}
          phoneNumberId={form.phoneNumberId}
          wabaId={form.wabaId}
          displayNameError={form.displayNameError}
          phoneNumberIdError={form.phoneNumberIdError}
          wabaIdError={form.wabaIdError}
          onDisplayNameChange={form.handleDisplayNameChange}
          onPhoneNumberIdChange={form.handlePhoneNumberIdChange}
          onWabaIdChange={form.handleWabaIdChange}
          mutationError={mutationError}
        />
      </DialogContent>
      <DialogSaveCancelActions labels={labels} loading={loading} onClose={handleClose} onSubmit={handleSubmit} />
    </Dialog>
  );
}
