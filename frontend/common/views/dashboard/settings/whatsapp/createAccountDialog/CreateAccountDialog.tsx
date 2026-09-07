"use client";

import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { Alert, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material";
import { useCallback, useState } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { DialogSaveCancelActions } from "@/frontend/common/views/dashboard/settings/whatsapp/dialogs";
import type { WhatsappCreateInput } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { resolvePurposeValue } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
import { WhatsappPurposeSelect } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeSelect";
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
  readonly validatePurpose: (value: string) => string | null;
}

type WhatsappValidationKey =
  | "validationDisplayNameRequired"
  | "validationDisplayNameTooLong"
  | "validationPhoneNumberIdRequired"
  | "validationPhoneNumberIdNumeric"
  | "validationWabaIdRequired"
  | "validationWabaIdNumeric"
  | "validationPurposeRequired"
  | "validationPurposeInvalid";

const VALIDATION_KEYS: ReadonlySet<string> = new Set([
  "validationDisplayNameRequired",
  "validationDisplayNameTooLong",
  "validationPhoneNumberIdRequired",
  "validationPhoneNumberIdNumeric",
  "validationWabaIdRequired",
  "validationWabaIdNumeric",
  "validationPurposeRequired",
  "validationPurposeInvalid",
]);

type PurposeDescriptionKey =
  | "purposeOptionGeneralDescription"
  | "purposeOptionStudentsDescription"
  | "purposeOptionAdvertisingDescription";

const PURPOSE_DESCRIPTION_KEYS: Readonly<Record<string, PurposeDescriptionKey>> = {
  GENERAL: "purposeOptionGeneralDescription",
  STUDENTS: "purposeOptionStudentsDescription",
  ADVERTISING: "purposeOptionAdvertisingDescription",
};

function resolvePurposeDescription(purpose: string, labels: WhatsappLabels): string | null {
  if (!(purpose in PURPOSE_DESCRIPTION_KEYS)) {
    return null;
  }
  return labels[PURPOSE_DESCRIPTION_KEYS[purpose]];
}

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
  readonly purpose: string;
  readonly displayNameError: string | null;
  readonly phoneNumberIdError: string | null;
  readonly wabaIdError: string | null;
  readonly purposeError: string | null;
}

function useCreateAccountForm(
  open: boolean,
  labels: WhatsappLabels,
  validateDisplayName: (value: string) => string | null,
  validatePhoneNumberId: (value: string) => string | null,
  validateWabaId: (value: string) => string | null,
  validatePurpose: (value: string) => string | null
) {
  const [displayName, setDisplayName] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [purpose, setPurpose] = useState<string>(WhatsappAccountPurpose.General);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [phoneNumberIdError, setPhoneNumberIdError] = useState<string | null>(null);
  const [wabaIdError, setWabaIdError] = useState<string | null>(null);
  const [purposeError, setPurposeError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDisplayName("");
      setPhoneNumberId("");
      setWabaId("");
      setPurpose(WhatsappAccountPurpose.General);
      setDisplayNameError(null);
      setPhoneNumberIdError(null);
      setWabaIdError(null);
      setPurposeError(null);
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

  const handlePurposeChange = useCallback(
    (value: string) => {
      setPurpose(value);
      setPurposeError(resolveValidationError(validatePurpose(value), labels));
    },
    [labels, validatePurpose]
  );

  const validateAll = useCallback((): CreateFormState => {
    const dErr = resolveValidationError(validateDisplayName(displayName), labels);
    setDisplayNameError(dErr);
    const pErr = resolveValidationError(validatePhoneNumberId(phoneNumberId), labels);
    setPhoneNumberIdError(pErr);
    const wErr = resolveValidationError(validateWabaId(wabaId), labels);
    setWabaIdError(wErr);
    const puErr = resolveValidationError(validatePurpose(purpose), labels);
    setPurposeError(puErr);
    return {
      displayName,
      phoneNumberId,
      wabaId,
      purpose,
      displayNameError: dErr,
      phoneNumberIdError: pErr,
      wabaIdError: wErr,
      purposeError: puErr,
    };
  }, [
    displayName,
    phoneNumberId,
    wabaId,
    purpose,
    labels,
    validateDisplayName,
    validatePhoneNumberId,
    validateWabaId,
    validatePurpose,
  ]);

  return {
    displayName,
    phoneNumberId,
    wabaId,
    purpose,
    displayNameError,
    phoneNumberIdError,
    wabaIdError,
    purposeError,
    handleDisplayNameChange,
    handlePhoneNumberIdChange,
    handleWabaIdChange,
    handlePurposeChange,
    validateAll,
  };
}

function CreateAccountDialogFields({
  labels,
  loading,
  displayName,
  phoneNumberId,
  wabaId,
  purpose,
  displayNameError,
  phoneNumberIdError,
  wabaIdError,
  purposeError,
  onDisplayNameChange,
  onPhoneNumberIdChange,
  onWabaIdChange,
  onPurposeChange,
  mutationError,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly displayName: string;
  readonly phoneNumberId: string;
  readonly wabaId: string;
  readonly purpose: string;
  readonly displayNameError: string | null;
  readonly phoneNumberIdError: string | null;
  readonly wabaIdError: string | null;
  readonly purposeError: string | null;
  readonly onDisplayNameChange: (value: string) => void;
  readonly onPhoneNumberIdChange: (value: string) => void;
  readonly onWabaIdChange: (value: string) => void;
  readonly onPurposeChange: (value: string) => void;
  readonly mutationError: string | null;
}>) {
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Alert severity="info" sx={{ "& .MuiAlert-message": { flexGrow: 1, textWrap: "pretty" } }}>
        {labels.addNumberInfoBanner}
      </Alert>
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
      <WhatsappPurposeSelect
        labels={labels}
        value={purpose}
        error={purposeError}
        description={resolvePurposeDescription(purpose, labels)}
        disabled={loading}
        onChange={onPurposeChange}
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
  validatePurpose,
}: Readonly<CreateAccountDialogProps>) {
  const form = useCreateAccountForm(
    open,
    labels,
    validateDisplayName,
    validatePhoneNumberId,
    validateWabaId,
    validatePurpose
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const state = form.validateAll();
    const purpose = resolvePurposeValue(state.purpose);
    if (
      state.displayNameError !== null ||
      state.phoneNumberIdError !== null ||
      state.wabaIdError !== null ||
      state.purposeError !== null ||
      purpose === undefined
    ) {
      return;
    }
    await onSubmit({
      displayName: state.displayName,
      phoneNumberId: state.phoneNumberId,
      wabaId: state.wabaId,
      purpose,
    });
  }, [form, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        {labels.createAccountTitle}
        <IconButton aria-label={labels.embeddedSignupClose} onClick={handleClose} disabled={loading} size="small">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <CreateAccountDialogFields
          labels={labels}
          loading={loading}
          displayName={form.displayName}
          phoneNumberId={form.phoneNumberId}
          wabaId={form.wabaId}
          purpose={form.purpose}
          displayNameError={form.displayNameError}
          phoneNumberIdError={form.phoneNumberIdError}
          wabaIdError={form.wabaIdError}
          purposeError={form.purposeError}
          onDisplayNameChange={form.handleDisplayNameChange}
          onPhoneNumberIdChange={form.handlePhoneNumberIdChange}
          onWabaIdChange={form.handleWabaIdChange}
          onPurposeChange={form.handlePurposeChange}
          mutationError={mutationError}
        />
      </DialogContent>
      <DialogSaveCancelActions labels={labels} loading={loading} onClose={handleClose} onSubmit={handleSubmit} />
    </Dialog>
  );
}
