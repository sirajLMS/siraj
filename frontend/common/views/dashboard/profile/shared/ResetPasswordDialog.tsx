"use client";

import { KeyOutlined } from "@mui/icons-material";
import { Box, Checkbox, Dialog, FormControlLabel, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog";
import type { ResetPasswordDialogProps } from "@/frontend/common/components/ui/dialog/types/resetPasswordDialog.types";
import { SecretTextField } from "@/frontend/common/components/ui/input/secretTextField";
import { Translation, useAppTranslation } from "@/shared/locale";
import { countPasswordClasses, PASSWORD_MIN_LENGTH } from "@/shared/utils/password-schema";

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
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = t.adminResetPassword.passwordRequired;
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = t.adminResetPassword.passwordMinLength;
    } else if (countPasswordClasses(password) < 2) {
      newErrors.password = t.adminResetPassword.passwordWeakComplexity;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.adminResetPassword.passwordsDoNotMatch;
    }

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

          <Box>
            <SecretTextField
              revealed={showPassword}
              onToggleReveal={() => setShowPassword(prev => !prev)}
              showValueLabel={t.adminResetPassword.showPassword}
              hideValueLabel={t.adminResetPassword.hidePassword}
              value={password}
              label={t.adminResetPassword.newPassword}
              onChange={e => handlePasswordChange(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              autoComplete="new-password"
              disabled={isLoading}
            />
            <PasswordStrengthMeter
              password={password}
              labels={{
                strength: t.adminResetPassword.passwordStrength,
                weak: t.adminResetPassword.strengthWeak,
                fair: t.adminResetPassword.strengthFair,
                strong: t.adminResetPassword.strengthStrong,
              }}
            />
          </Box>

          <SecretTextField
            revealed={showPassword}
            onToggleReveal={() => setShowPassword(prev => !prev)}
            showValueLabel={t.adminResetPassword.showPassword}
            hideValueLabel={t.adminResetPassword.hidePassword}
            value={confirmPassword}
            label={t.adminResetPassword.confirmPassword}
            onChange={e => handleConfirmPasswordChange(e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            fullWidth
            autoComplete="new-password"
            disabled={isLoading}
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
