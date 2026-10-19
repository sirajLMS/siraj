"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import { type Control, Controller, type FieldErrors, useWatch } from "react-hook-form";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import {
  type VmLabels,
  validationMessage,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.helpers";
import type { GeneralUserCreateFormData } from "@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema";

function PasswordField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  const [showPassword, setShowPassword] = useState(false);
  // Watch the password value so the strength meter updates live without
  // re-rendering the whole form on every keystroke.
  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };
  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton onClick={toggleShowPassword} edge="end" aria-label={labels.password} aria-pressed={showPassword}>
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              label={labels.password}
              type={showPassword ? "text" : "password"}
              required
              fullWidth
              sx={outlinedInputSx}
              error={!!errors.password}
              helperText={validationMessage(labels, errors.password)}
              slotProps={{ input: { endAdornment: passwordAdornment } }}
            />
            <PasswordStrengthMeter
              password={passwordValue}
              labels={{
                strength: labels.passwordStrength,
                weak: labels.strengthWeak,
                fair: labels.strengthFair,
                strong: labels.strengthStrong,
              }}
            />
          </Box>
        )}
      />
    </Grid>
  );
}

export { PasswordField };
