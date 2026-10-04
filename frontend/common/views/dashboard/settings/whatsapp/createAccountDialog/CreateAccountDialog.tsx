"use client";

import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { useCallback } from "react";
import { useCreateAccountForm } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/createAccountDialog.hooks";
import { CreateAccountDialogFields } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/createAccountDialog.parts";
import { DialogSaveCancelActions } from "@/frontend/common/views/dashboard/settings/whatsapp/dialogs";
import type { WhatsappCreateInput } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { resolvePurposeValue } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
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
  const form = useCreateAccountForm(open, labels, {
    displayName: validateDisplayName,
    phoneNumberId: validatePhoneNumberId,
    wabaId: validateWabaId,
    purpose: validatePurpose,
  });

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const { values, errors } = form.validateAll();
    const purpose = resolvePurposeValue(values.purpose);
    if (
      errors.displayName !== null ||
      errors.phoneNumberId !== null ||
      errors.wabaId !== null ||
      errors.purpose !== null ||
      purpose === undefined
    ) {
      return;
    }
    await onSubmit({
      displayName: values.displayName,
      phoneNumberId: values.phoneNumberId,
      wabaId: values.wabaId,
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
          values={form.values}
          errors={form.errors}
          onFieldChange={form.onFieldChange}
          mutationError={mutationError}
        />
      </DialogContent>
      <DialogSaveCancelActions labels={labels} loading={loading} onClose={handleClose} onSubmit={handleSubmit} />
    </Dialog>
  );
}
