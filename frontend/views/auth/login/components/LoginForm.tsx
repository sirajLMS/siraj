"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Person, Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Link, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { type Control, Controller, type FieldErrors, useForm } from "react-hook-form";
import { mockLogin } from "@/frontend/views/auth/login/actions/mockLogin";
import { createLoginSchema, type LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import { useAppTranslation } from "@/shared/locale";

// Person icon for email field with secondary color
const StyledPersonIcon = styled(Person)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Lock icon for password field with secondary color
const StyledLockIcon = styled(Lock)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Form actions container with flex layout for forgot password
const StyledFormActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
});

// Forgot password link with primary color
const StyledForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 500,
}));

// Submit button with custom padding and margin
const StyledSubmitButton = styled(Button)({
  paddingTop: 12,
  paddingBottom: 12,
});

const FormFields = ({
  control,
  errors,
  isSubmitting,
  showPassword,
  setShowPassword,
}: {
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  isSubmitting: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}) => {
  const t = useAppTranslation().authTranslations.login;

  return (
    <>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t.email}
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
          <TextField
            {...field}
            label={t.password}
            type={showPassword ? "text" : "password"}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isSubmitting}
            fullWidth
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
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />
    </>
  );
};

const FormActions = ({ isSubmitting: _isSubmitting }: { isSubmitting: boolean }) => {
  const t = useAppTranslation().authTranslations.login;

  return (
    <StyledFormActionsContainer>
      <StyledForgotPasswordLink href="#" underline="hover">
        {t.forgotPassword}
      </StyledForgotPasswordLink>
    </StyledFormActionsContainer>
  );
};

export interface LoginFormProps {
  onSubmitAction?: (data: LoginFormData) => Promise<void>;
  externalLoginResult?: { type: "success" | "error"; message: string } | null;
}

export function LoginForm({ onSubmitAction, externalLoginResult }: LoginFormProps = {}) {
  const t = useAppTranslation().authTranslations.login;
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginResult, setLoginResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loginSchema = createLoginSchema({
    emailRequired: t.emailRequired,
    emailInvalid: t.emailInvalid,
    passwordRequired: t.passwordRequired,
    passwordMinLength: t.passwordMinLength,
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

  const onSubmit = (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginResult(null);

    if (onSubmitAction) {
      onSubmitAction(data)
        .catch(() => {
          setLoginResult({
            type: "error",
            message: t.loginError,
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
              message: t.loginSuccess,
            });
          } else {
            setLoginResult({
              type: "error",
              message: t.invalidCredentials,
            });
          }
        })
        .catch(() => {
          setLoginResult({
            type: "error",
            message: t.loginError,
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  const finalLoginResult = externalLoginResult || loginResult;

  return (
    <Box
      component="form"
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
      }}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {finalLoginResult && (
        <Alert severity={finalLoginResult.type} sx={{ mb: 1 }}>
          {finalLoginResult.message}
        </Alert>
      )}

      <FormFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <FormActions isSubmitting={isSubmitting} />

      <StyledSubmitButton
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
        fullWidth
        sx={{ mt: 1 }}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t.signIn}
      </StyledSubmitButton>
    </Box>
  );
}
