"use client";

import { Alert, Stack, TextField } from "@mui/material";
import { resolvePurposeDescription } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/createAccountDialog.helpers";
import type {
  CreateFormErrors,
  CreateFormField,
  CreateFormValues,
} from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/createAccountDialog.hooks";
import { WhatsappPurposeSelect } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeSelect";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Field stack for the create-account dialog: info banner, inputs, purpose select, and mutation error alert. */
export function CreateAccountDialogFields({
  labels,
  loading,
  values,
  errors,
  onFieldChange,
  mutationError,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly loading: boolean;
  readonly values: CreateFormValues;
  readonly errors: CreateFormErrors;
  readonly onFieldChange: (field: CreateFormField, value: string) => void;
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
        value={values.displayName}
        onChange={e => onFieldChange("displayName", e.target.value)}
        error={errors.displayName !== null}
        helperText={errors.displayName}
        aria-invalid={errors.displayName !== null}
        fullWidth
        disabled={loading}
      />
      <TextField
        label={labels.phoneNumberIdLabel}
        placeholder={labels.phoneNumberIdHelper}
        value={values.phoneNumberId}
        onChange={e => onFieldChange("phoneNumberId", e.target.value)}
        error={errors.phoneNumberId !== null}
        helperText={errors.phoneNumberId}
        aria-invalid={errors.phoneNumberId !== null}
        fullWidth
        disabled={loading}
      />
      <TextField
        label={labels.wabaIdLabel}
        placeholder={labels.wabaIdHelper}
        value={values.wabaId}
        onChange={e => onFieldChange("wabaId", e.target.value)}
        error={errors.wabaId !== null}
        helperText={errors.wabaId}
        aria-invalid={errors.wabaId !== null}
        fullWidth
        disabled={loading}
      />
      <WhatsappPurposeSelect
        labels={labels}
        value={values.purpose}
        error={errors.purpose}
        description={resolvePurposeDescription(values.purpose, labels)}
        disabled={loading}
        onChange={value => onFieldChange("purpose", value)}
      />
      {mutationError !== null ? (
        <Alert severity="error" role="alert">
          {mutationError}
        </Alert>
      ) : null}
    </Stack>
  );
}
