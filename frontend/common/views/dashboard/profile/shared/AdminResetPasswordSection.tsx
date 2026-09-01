"use client";

import { KeyOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type Ref, useCallback, useImperativeHandle, useState } from "react";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { SectionPanel } from "@/frontend/common/components/ui";
import { Translation, useAppTranslation } from "@/shared/locale";
import { countPasswordClasses, PASSWORD_MIN_LENGTH } from "@/shared/utils/password-schema";

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
    (password: string, confirm: string): { readonly password?: string; readonly confirm?: string } => {
      if (password.length === 0) {
        return { password: t.passwordRequired };
      }
      if (password.length < PASSWORD_MIN_LENGTH) {
        return { password: t.passwordMinLength };
      }
      if (countPasswordClasses(password) < 2) {
        return { password: t.passwordWeakComplexity };
      }
      if (password !== confirm) {
        return { confirm: t.passwordsDoNotMatch };
      }
      return {};
    },
    [t.passwordRequired, t.passwordMinLength, t.passwordWeakComplexity, t.passwordsDoNotMatch]
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
        <Box>
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
          <PasswordStrengthMeter
            password={newPassword}
            labels={{
              strength: t.passwordStrength,
              weak: t.strengthWeak,
              fair: t.strengthFair,
              strong: t.strengthStrong,
            }}
          />
        </Box>
        <TextField
          label={t.confirmPassword}
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          error={confirmPasswordError.length > 0 || liveMismatch}
          helperText={confirmHelperText}
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
