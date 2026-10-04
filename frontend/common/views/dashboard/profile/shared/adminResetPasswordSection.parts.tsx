"use client";

import { Box } from "@mui/material";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { SecretTextField } from "@/frontend/common/components/ui/input/secretTextField";
import type { ProfileAdminResetPasswordLabels } from "@/shared/locale/types/profile";

type AdminResetPasswordFieldProps = {
  readonly value: string;
  readonly label: string;
  readonly error: boolean;
  readonly helperText?: string;
  readonly revealed: boolean;
  readonly onToggleReveal: () => void;
  readonly onValueChange: (value: string) => void;
  readonly showStrengthMeter: boolean;
  readonly labels: ProfileAdminResetPasswordLabels;
};

export function AdminResetPasswordField({
  value,
  label,
  error,
  helperText,
  revealed,
  onToggleReveal,
  onValueChange,
  showStrengthMeter,
  labels: t,
}: AdminResetPasswordFieldProps) {
  const secretField = (
    <SecretTextField
      revealed={revealed}
      onToggleReveal={onToggleReveal}
      showValueLabel={t.showPassword}
      hideValueLabel={t.hidePassword}
      label={label}
      value={value}
      onChange={e => onValueChange(e.target.value)}
      error={error}
      helperText={helperText}
      fullWidth
      autoComplete="new-password"
    />
  );

  if (!showStrengthMeter) {
    return secretField;
  }

  return (
    <Box>
      {secretField}
      <PasswordStrengthMeter
        password={value}
        labels={{
          strength: t.passwordStrength,
          weak: t.strengthWeak,
          fair: t.strengthFair,
          strong: t.strengthStrong,
        }}
      />
    </Box>
  );
}
