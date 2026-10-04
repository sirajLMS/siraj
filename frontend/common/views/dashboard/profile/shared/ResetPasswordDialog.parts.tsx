"use client";

import { Box } from "@mui/material";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { SecretTextField } from "@/frontend/common/components/ui/input/secretTextField";
import type {
  ResetPasswordFieldErrors,
  ResetPasswordFieldsLabels,
} from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.helpers";

type ResetPasswordFieldsProps = Readonly<{
  password: string;
  confirmPassword: string;
  errors: ResetPasswordFieldErrors;
  revealed: boolean;
  onToggleReveal: () => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  disabled: boolean;
  labels: ResetPasswordFieldsLabels;
}>;

export function ResetPasswordFields({
  password,
  confirmPassword,
  errors,
  revealed,
  onToggleReveal,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled,
  labels,
}: ResetPasswordFieldsProps) {
  return (
    <>
      <Box>
        <SecretTextField
          revealed={revealed}
          onToggleReveal={onToggleReveal}
          showValueLabel={labels.showPassword}
          hideValueLabel={labels.hidePassword}
          value={password}
          label={labels.newPassword}
          onChange={e => onPasswordChange(e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
          fullWidth
          autoComplete="new-password"
          disabled={disabled}
        />
        <PasswordStrengthMeter
          password={password}
          labels={{
            strength: labels.passwordStrength,
            weak: labels.strengthWeak,
            fair: labels.strengthFair,
            strong: labels.strengthStrong,
          }}
        />
      </Box>

      <SecretTextField
        revealed={revealed}
        onToggleReveal={onToggleReveal}
        showValueLabel={labels.showPassword}
        hideValueLabel={labels.hidePassword}
        value={confirmPassword}
        label={labels.confirmPassword}
        onChange={e => onConfirmPasswordChange(e.target.value)}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        fullWidth
        autoComplete="new-password"
        disabled={disabled}
      />
    </>
  );
}
