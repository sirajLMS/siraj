"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, CircularProgress } from "@mui/material";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { FormActions, FormFields } from "@/frontend/views/auth/login/components/LoginForm.parts";
import { StyledSubmitButton } from "@/frontend/views/auth/login/components/LoginForm.styles";
import { createLoginSchema, type LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

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
