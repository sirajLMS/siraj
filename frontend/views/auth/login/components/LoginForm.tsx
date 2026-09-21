"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import { alpha, styled, type Theme } from "@mui/material/styles";
import { useCallback, useState } from "react";
import { type Control, Controller, type FieldErrors, useForm } from "react-hook-form";
import { createLoginSchema, type LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

// Semantic envelope icon for the email field — signals "email" not "username".
const StyledEmailIcon = styled(Email)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledLockIcon = styled(Lock)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledFormActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: "-0.5rem",
});

// Shared focus + error styling for all login TextFields — gives inputs a clear focus
// ring (accessibility), consistent border radius, and a red focus ring on error.
// Reused by both the email and password fields to avoid duplication (jscpd).
const textFieldFocusSx = (theme: Theme) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    transition: theme.transitions.create(["box-shadow", "border-color"], {
      duration: theme.transitions.duration.short,
    }),
    "& fieldset": {
      borderColor: alpha(theme.palette.text.primary, 0.6),
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.6),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-focused": {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.22)}`,
    },
    "&.Mui-focused.Mui-error": {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.error.main, 0.25)}`,
    },
    "&.Mui-error .MuiInputAdornment-root": {
      color: theme.palette.error.main,
    },
  },
  "& .MuiInputLabel-root": {
    color: alpha(theme.palette.text.primary, 0.7),
    fontWeight: 500,
    "&.Mui-focused": { color: theme.palette.primary.main },
    "&.Mui-error": { color: theme.palette.error.main },
    "&.Mui-error.Mui-focused": { color: theme.palette.error.main },
  },
});

const StyledForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 500,
}));

// Submit button — flat fill aligned with the global MuiButton override (which kills
// elevation), so no gradient or glow that would fight the design system or make a
// disabled button look clickable. Interactive states are explicit: hover/active
// darken the fill, focus-visible rings, disabled fully mutes.
const StyledSubmitButton = styled(Button)(({ theme }) => ({
  paddingTop: 14,
  paddingBottom: 14,
  minHeight: 52,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: theme.palette.onPrimary,
  backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create(["background-color", "box-shadow"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  "&:focus-visible": {
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  "&.Mui-disabled": {
    color: theme.palette.action.disabled,
    backgroundColor: theme.palette.action.disabledBackground,
    boxShadow: "none",
  },
}));

const FormFields = ({
  labels,
  control,
  errors,
  disabled,
  showPassword,
  setShowPassword,
  capsLockOn,
  onPasswordKeyDown,
}: {
  labels: AuthLoginLabels;
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  disabled: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  capsLockOn: boolean;
  onPasswordKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) => {
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

const FormActions = ({ labels }: { labels: AuthLoginLabels }) => {
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

export interface LoginFormProps {
  readonly labels: AuthLoginLabels;
  readonly onSubmitAction: (data: LoginFormData) => Promise<void>;
  readonly externalLoginResult?: { type: "success" | "error"; message: string } | null;
  readonly isRetrying?: boolean;
}

export function LoginForm({
  labels,
  onSubmitAction,
  externalLoginResult,
  isRetrying = false,
}: Readonly<LoginFormProps>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loginResult, setLoginResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loginSchema = createLoginSchema({
    emailRequired: labels.emailRequired,
    emailInvalid: labels.emailInvalid,
    passwordRequired: labels.passwordRequired,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Caps Lock detector — fires on every keydown in the password field.
  // `getModifierState` is the spec-compliant way to read Caps Lock regardless
  // of the physical key (handles macOS + non-US layouts).
  const handlePasswordKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  }, []);

  const onSubmit = (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginResult(null);

    onSubmitAction(data)
      .catch(() => {
        setLoginResult({
          type: "error",
          message: labels.loginError,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const finalLoginResult = externalLoginResult ?? loginResult;
  // While the success alert is visible the view model is hard-redirecting to the
  // dashboard — keep the form in its busy state so nothing can be re-clicked.
  const loginSucceeded = finalLoginResult?.type === "success";
  const isBusy = isSubmitting || isRetrying || loginSucceeded;

  return (
    <form
      noValidate
      onSubmit={e => {
        e.preventDefault();
        void handleSubmit(onSubmit)(e);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      {isRetrying && (
        <Alert severity="info" sx={{ mb: 1 }}>
          {labels.retrying}
        </Alert>
      )}
      {!isRetrying && finalLoginResult != null && (
        <Alert severity={finalLoginResult.type} sx={{ mb: 1 }}>
          {finalLoginResult.message}
        </Alert>
      )}

      <FormFields
        labels={labels}
        control={control}
        errors={errors}
        disabled={isBusy}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        capsLockOn={capsLockOn}
        onPasswordKeyDown={handlePasswordKeyDown}
      />

      <FormActions labels={labels} />

      <StyledSubmitButton type="submit" variant="contained" size="large" disabled={isBusy} fullWidth sx={{ mt: 0.5 }}>
        {isBusy ? <CircularProgress size={24} color="inherit" /> : labels.signIn}
      </StyledSubmitButton>
    </form>
  );
}
