"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Person, Visibility, VisibilityOff } from "@mui/icons-material";
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
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useCallback, useState } from "react";
import { type Control, Controller, type FieldErrors, useForm, useWatch } from "react-hook-form";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import { mockLogin } from "@/frontend/views/auth/login/actions/mockLogin";
import { createLoginSchema, type LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const StyledPersonIcon = styled(Person)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledLockIcon = styled(Lock)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledFormActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
});

const StyledForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 500,
}));

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  paddingTop: 14,
  paddingBottom: 14,
  minHeight: 52,
  borderRadius: 12,
  fontSize: "0.875rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: theme.palette.onPrimary,
  backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.32)}`,
  transition: theme.transitions.create(["transform", "box-shadow", "filter"], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeOut,
  }),
  "&:hover": {
    backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.42)}`,
    transform: "translateY(-1px)",
    filter: "brightness(1.04)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
  "&.Mui-disabled": {
    backgroundImage: "none",
  },
}));

const FormFields = ({
  labels,
  control,
  errors,
  isSubmitting,
  showPassword,
  setShowPassword,
  passwordValue,
  capsLockOn,
  onPasswordKeyDown,
}: {
  labels: AuthLoginLabels;
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  isSubmitting: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  passwordValue: string;
  capsLockOn: boolean;
  onPasswordKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) => {
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
            disabled={isSubmitting}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <StyledPersonIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              label={labels.password}
              type={showPassword ? "text" : "password"}
              error={!!errors.password || capsLockOn}
              helperText={errors.password?.message ?? (capsLockOn ? labels.capsLockOn : " ")}
              disabled={isSubmitting}
              fullWidth
              onKeyDown={onPasswordKeyDown}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <StyledLockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        edge="end"
                        disabled={isSubmitting}
                        aria-label={showPassword ? labels.hidePassword : labels.showPassword}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
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
    </>
  );
};

const FormActions = ({ labels }: { labels: AuthLoginLabels }) => {
  const [forgotOpen, setForgotOpen] = useState(false);
  return (
    <StyledFormActionsContainer sx={{ mt: 0.5, minHeight: 44 }}>
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
  readonly onSubmitAction?: (data: LoginFormData) => Promise<void>;
  readonly externalLoginResult?: { type: "success" | "error"; message: string } | null;
  readonly isRetrying?: boolean;
}

export function LoginForm({ labels, onSubmitAction, externalLoginResult, isRetrying }: Readonly<LoginFormProps>) {
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

  // Watch the password value so the strength meter updates live without
  // re-rendering the whole form on every keystroke.
  const passwordValue = useWatch({ control, name: "password" }) ?? "";

  // Caps Lock detector — fires on every keydown in the password field.
  // `getModifierState` is the spec-compliant way to read Caps Lock regardless
  // of the physical key (handles macOS + non-US layouts).
  const handlePasswordKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  }, []);

  const onSubmit = (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginResult(null);

    if (onSubmitAction) {
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
    } else {
      mockLogin(data)
        .then(response => {
          if (response.success) {
            setLoginResult({
              type: "success",
              message: labels.loginSuccess,
            });
          } else {
            setLoginResult({
              type: "error",
              message: labels.invalidCredentials,
            });
          }
          return undefined;
        })
        .catch(() => {
          setLoginResult({
            type: "error",
            message: labels.loginError,
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  const finalLoginResult = externalLoginResult ?? loginResult;

  return (
    <Box
      component="form"
      onSubmit={e => {
        e.preventDefault();
        void handleSubmit(onSubmit)(e);
      }}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
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
        isSubmitting={isSubmitting}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        passwordValue={passwordValue}
        capsLockOn={capsLockOn}
        onPasswordKeyDown={handlePasswordKeyDown}
      />

      <FormActions labels={labels} />

      <StyledSubmitButton
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting || isRetrying}
        fullWidth
        sx={{ mt: 2 }}
      >
        {isSubmitting || isRetrying ? <CircularProgress size={24} color="inherit" /> : labels.signIn}
      </StyledSubmitButton>
    </Box>
  );
}
