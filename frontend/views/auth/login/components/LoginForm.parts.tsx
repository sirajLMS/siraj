"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import {
  StyledEmailIcon,
  StyledForgotPasswordLink,
  StyledFormActionsContainer,
  StyledLockIcon,
  textFieldFocusSx,
} from "@/frontend/views/auth/login/components/LoginForm.styles";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

interface FormFieldsProps {
  labels: AuthLoginLabels;
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  disabled: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  capsLockOn: boolean;
  onPasswordKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const FormFields = ({
  labels,
  control,
  errors,
  disabled,
  showPassword,
  setShowPassword,
  capsLockOn,
  onPasswordKeyDown,
}: FormFieldsProps) => {
  const theme = useTheme();
  return (
    <>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.email}
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={disabled}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <StyledEmailIcon />
                  </InputAdornment>
                ),
              },
            }}
            sx={textFieldFocusSx(theme)}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.password}
            type={showPassword ? "text" : "password"}
            error={!!errors.password || capsLockOn}
            helperText={errors.password?.message ?? (capsLockOn ? labels.capsLockOn : undefined)}
            disabled={disabled}
            fullWidth
            onKeyDown={onPasswordKeyDown}
            slotProps={{
              formHelperText: {
                sx: { minHeight: theme.spacing(2.5) },
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <StyledLockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showPassword ? labels.hidePassword : labels.showPassword}>
                      <span>
                        <IconButton
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                          edge="end"
                          disabled={disabled}
                          aria-label={showPassword ? labels.hidePassword : labels.showPassword}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
            sx={textFieldFocusSx(theme)}
          />
        )}
      />
    </>
  );
};

export const FormActions = ({ labels }: { labels: AuthLoginLabels }) => {
  const [forgotOpen, setForgotOpen] = useState(false);
  return (
    <StyledFormActionsContainer sx={{ minHeight: 44 }}>
      <StyledForgotPasswordLink
        href="#"
        underline="hover"
        onClick={event => {
          event.preventDefault();
          setForgotOpen(true);
        }}
        sx={theme => ({
          fontSize: "0.85rem",
          fontWeight: 600,
          color: theme.palette.primary.main,
          transition: theme.transitions.create("color"),
          "&:hover": { color: theme.palette.primary.dark, textDecoration: "underline" },
        })}
      >
        {labels.forgotPassword}
      </StyledForgotPasswordLink>
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{labels.forgotPasswordComingSoonTitle}</DialogTitle>
        <DialogContent>{labels.forgotPasswordComingSoonBody}</DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)} variant="contained">
            {labels.close}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledFormActionsContainer>
  );
};
