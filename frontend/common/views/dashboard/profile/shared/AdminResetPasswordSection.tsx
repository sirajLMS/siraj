"use client";

import { KeyOutlined } from "@mui/icons-material";
import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { type Ref, useCallback, useImperativeHandle, useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui";
import { validateAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/adminResetPasswordSection.helpers";
import { AdminResetPasswordField } from "@/frontend/common/views/dashboard/profile/shared/adminResetPasswordSection.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

interface AdminResetPasswordData {
  readonly newPassword: string;
  readonly sendNotificationEmail: boolean;
  readonly isValid: boolean;
  readonly errors: { readonly password?: string; readonly confirm?: string };
}

export interface AdminResetPasswordSectionRef {
  readonly getResetPasswordData: () => AdminResetPasswordData;
  readonly reset: () => void;
}

interface AdminResetPasswordSectionProps {
  readonly targetUserId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly ref?: Ref<AdminResetPasswordSectionRef>;
}

export function AdminResetPasswordSection({
  targetUserId: _targetUserId,
  userName,
  userEmail,
  ref,
}: AdminResetPasswordSectionProps) {
  const tBase = useAppTranslation(Translation.Profile.Base);
  const t = tBase.adminResetPassword;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendNotificationEmail, setSendNotificationEmail] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validatePassword = useCallback(
    (password: string, confirm: string) => validateAdminResetPassword(password, confirm, t),
    [t]
  );

  useImperativeHandle(ref, () => ({
    getResetPasswordData: () => {
      const errors = validatePassword(newPassword, confirmPassword);
      return {
        newPassword,
        sendNotificationEmail,
        isValid: newPassword.length > 0 && Object.keys(errors).length === 0,
        errors,
      };
    },
    reset: () => {
      setNewPassword("");
      setConfirmPassword("");
      setNewPasswordError("");
      setConfirmPasswordError("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setSendNotificationEmail(false);
    },
  }));

  // Live mismatch detection — shows a helper warning before submit so the user
  // catches typos early instead of after a failed round-trip.
  const liveMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  let confirmHelperText: string | undefined;
  if (confirmPasswordError.length > 0) {
    confirmHelperText = confirmPasswordError;
  } else if (liveMismatch) {
    confirmHelperText = t.passwordsDoNotMatch;
  }

  return (
    <SectionPanel title={t.title}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <KeyOutlined sx={theme => ({ color: theme.palette.primary.main })} />
          <Typography variant="bodyMd">{t.description(userName, userEmail)}</Typography>
        </Stack>
        <AdminResetPasswordField
          value={newPassword}
          label={t.newPassword}
          error={newPasswordError.length > 0}
          helperText={newPasswordError}
          revealed={showNewPassword}
          onToggleReveal={() => setShowNewPassword(prev => !prev)}
          onValueChange={value => {
            setNewPassword(value);
            if (newPasswordError) setNewPasswordError("");
          }}
          showStrengthMeter
          labels={t}
        />
        <AdminResetPasswordField
          value={confirmPassword}
          label={t.confirmPassword}
          error={confirmPasswordError.length > 0 || liveMismatch}
          helperText={confirmHelperText}
          revealed={showConfirmPassword}
          onToggleReveal={() => setShowConfirmPassword(prev => !prev)}
          onValueChange={value => {
            setConfirmPassword(value);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          showStrengthMeter={false}
          labels={t}
        />
        <FormControlLabel
          control={
            <Checkbox checked={sendNotificationEmail} onChange={e => setSendNotificationEmail(e.target.checked)} />
          }
          label={t.sendEmailLabel}
        />
      </Stack>
    </SectionPanel>
  );
}
