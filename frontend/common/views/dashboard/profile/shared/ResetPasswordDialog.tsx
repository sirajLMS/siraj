"use client";

import { KeyOutlined } from "@mui/icons-material";
import { Checkbox, Dialog, FormControlLabel, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog";
import type { ResetPasswordDialogProps } from "@/frontend/common/components/ui/dialog/types/resetPasswordDialog.types";
import {
  buildResetPasswordFieldErrors,
  type ResetPasswordFieldErrors,
} from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.helpers";
import { ResetPasswordFields } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

export function ResetPasswordDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  userName,
  userEmail,
  sendEmail,
  setSendEmail,
}: Readonly<ResetPasswordDialogProps>) {
  const t = useAppTranslation(Translation.Profile.Base);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordFieldErrors>({});

  const validate = (): boolean => {
    const newErrors = buildResetPasswordFieldErrors(password, confirmPassword, t.adminResetPassword);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validate()) {
      onConfirm(password, sendEmail);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <BaseFormDialogSection
        icon={<KeyOutlined sx={{ fontSize: 32 }} />}
        title={t.adminResetPassword.title}
        cancelLabel={t.adminResetPassword.cancelButton}
        confirmLabel={t.adminResetPassword.resetButton}
        confirmLoadingLabel={t.adminResetPassword.resettingButton}
        onClose={onClose}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      >
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
            {t.adminResetPassword.description(userName, userEmail)}
          </Typography>

          <ResetPasswordFields
            password={password}
            confirmPassword={confirmPassword}
            errors={errors}
            revealed={showPassword}
            onToggleReveal={() => setShowPassword(prev => !prev)}
            onPasswordChange={handlePasswordChange}
            onConfirmPasswordChange={handleConfirmPasswordChange}
            disabled={isLoading}
            labels={t.adminResetPassword}
          />

          <FormControlLabel
            control={
              <Checkbox checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} disabled={isLoading} />
            }
            label={t.adminResetPassword.sendEmailLabel}
          />
        </Stack>
      </BaseFormDialogSection>
    </Dialog>
  );
}
