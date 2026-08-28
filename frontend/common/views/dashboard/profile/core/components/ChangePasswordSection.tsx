"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
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

        <TextField
          type={showCurrent ? "text" : "password"}
          label={tProfile.currentPassword}
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          fullWidth
          size="small"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      setShowCurrent(!showCurrent);
                    }}
                    edge="end"
                    aria-label={showCurrent ? tProfile.hidePassword : tProfile.showPassword}
                  >
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box>
          <TextField
            type={showNew ? "text" : "password"}
            label={tProfile.newPassword}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            fullWidth
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        setShowNew(!showNew);
                      }}
                      edge="end"
                      aria-label={showNew ? tProfile.hidePassword : tProfile.showPassword}
                    >
                      {showNew ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
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

        <TextField
          type={showConfirm ? "text" : "password"}
          label={tProfile.confirmPassword}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          fullWidth
          size="small"
          error={passwordsDoNotMatch}
          helperText={passwordsDoNotMatch ? tProfile.passwordMismatch : undefined}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      setShowConfirm(!showConfirm);
                    }}
                    edge="end"
                    aria-label={showConfirm ? tProfile.hidePassword : tProfile.showPassword}
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
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
