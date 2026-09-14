"use client";

import { Alert, Box, Stack } from "@mui/material";
import { useState } from "react";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { SecretTextField } from "@/frontend/common/components/ui/input/secretTextField";
import { useChangePasswordSectionViewModel } from "@/frontend/common/views/dashboard/profile/core/useChangePasswordSectionViewModel";

export function ChangePasswordSection() {
  const {
    labels,
    currentPassword,
    newPassword,
    confirmPassword,
    errorMsg,
    successMsg,
    loading,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  } = useChangePasswordSectionViewModel();
  const tProfile = labels.profile.changePassword;

  // Show/hide toggles per field — independent so the user can reveal the new
  // password (to verify strength) while keeping the current one masked.
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Live mismatch detection — shows a helper warning before submit so the user
  // catches typos early instead of after a failed round-trip.
  const passwordsDoNotMatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <SectionPanel title={tProfile.title}>
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}
        {successMsg ? <Alert severity="success">{successMsg}</Alert> : null}

        <SecretTextField
          revealed={showCurrent}
          onToggleReveal={() => {
            setShowCurrent(prev => !prev);
          }}
          showValueLabel={tProfile.showPassword}
          hideValueLabel={tProfile.hidePassword}
          label={tProfile.currentPassword}
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          fullWidth
          size="small"
          autoComplete="current-password"
        />

        <Box>
          <SecretTextField
            revealed={showNew}
            onToggleReveal={() => {
              setShowNew(prev => !prev);
            }}
            showValueLabel={tProfile.showPassword}
            hideValueLabel={tProfile.hidePassword}
            label={tProfile.newPassword}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
          />
          <PasswordStrengthMeter
            password={newPassword}
            labels={{
              strength: tProfile.passwordStrength,
              weak: tProfile.strengthWeak,
              fair: tProfile.strengthFair,
              strong: tProfile.strengthStrong,
            }}
          />
        </Box>

        <SecretTextField
          revealed={showConfirm}
          onToggleReveal={() => {
            setShowConfirm(prev => !prev);
          }}
          showValueLabel={tProfile.showPassword}
          hideValueLabel={tProfile.hidePassword}
          label={tProfile.confirmPassword}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          fullWidth
          size="small"
          error={passwordsDoNotMatch}
          helperText={passwordsDoNotMatch ? tProfile.passwordMismatch : undefined}
          autoComplete="new-password"
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
          <PrimaryPageAction
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword || passwordsDoNotMatch}
          >
            {tProfile.submit}
          </PrimaryPageAction>
        </Box>
      </Stack>
    </SectionPanel>
  );
}
