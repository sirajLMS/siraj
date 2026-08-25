"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Person, Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Link, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { type Control, Controller, type FieldErrors, useForm } from "react-hook-form";
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

const StyledSubmitButton = styled(Button)({
  paddingTop: 12,
  paddingBottom: 12,
});

const FormFields = ({
  labels,
  control,
  errors,
  isSubmitting,
  showPassword,
  setShowPassword,
}: {
  labels: AuthLoginLabels;
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  isSubmitting: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
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
          <TextField
            {...field}
            label={labels.password}
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
                      aria-label={showPassword ? labels.hidePassword : labels.showPassword}
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

const FormActions = ({ labels }: { labels: AuthLoginLabels }) => {
  return (
    <StyledFormActionsContainer>
      <StyledForgotPasswordLink href="#" underline="hover">
        {labels.forgotPassword}
      </StyledForgotPasswordLink>
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
        gap: 2.5,
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
      />

      <FormActions labels={labels} />

      <StyledSubmitButton
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting || isRetrying}
        fullWidth
        sx={{ mt: 1 }}
      >
        {isSubmitting || isRetrying ? <CircularProgress size={24} color="inherit" /> : labels.signIn}
      </StyledSubmitButton>
    </Box>
  );
}
