"use client";

import { KeyOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { type Ref, useCallback, useImperativeHandle, useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface AdminResetPasswordData {
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
    (password: string, confirm: string): { readonly password?: string; readonly confirm?: string } => {
      if (password.length === 0) {
        return { password: t.passwordRequired };
      }
      if (password.length < 8) {
        return { password: t.passwordMinLength };
      }
      if (password !== confirm) {
        return { confirm: t.passwordsDoNotMatch };
      }
      return {};
    },
    [t.passwordRequired, t.passwordMinLength, t.passwordsDoNotMatch]
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

  return (
    <SectionPanel title={t.title}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <KeyOutlined sx={theme => ({ color: theme.palette.primary.main })} />
          <Typography variant="bodyMd">{t.description(userName, userEmail)}</Typography>
        </Stack>
        <TextField
          label={t.newPassword}
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={e => {
            setNewPassword(e.target.value);
            if (newPasswordError) setNewPasswordError("");
          }}
          error={newPasswordError.length > 0}
          helperText={newPasswordError}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(prev => !prev)}
                    edge="end"
                    aria-label={showNewPassword ? t.hidePassword : t.showPassword}
                  >
                    {showNewPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label={t.confirmPassword}
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          error={confirmPasswordError.length > 0}
          helperText={confirmPasswordError}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    edge="end"
                    aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                  >
                    {showConfirmPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
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
