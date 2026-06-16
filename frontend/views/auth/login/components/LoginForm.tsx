"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Person, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type Control, Controller, type FieldErrors, useForm } from "react-hook-form";
import { mockLogin } from "../actions/mockLogin";
import { createLoginSchema, type LoginFormData } from "../schemas/loginSchema";

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
  const t = useTranslations("auth.login");

  return (
    <>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t("email")}
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isSubmitting}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={theme => ({ color: theme.palette.text.secondary })} />
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
            label={t("password")}
            type={showPassword ? "text" : "password"}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isSubmitting}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={theme => ({ color: theme.palette.text.secondary })} />
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

const FormActions = ({ control, isSubmitting }: { control: Control<LoginFormData>; isSubmitting: boolean }) => {
  const t = useTranslations("auth.login");

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Controller
        name="rememberMe"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} disabled={isSubmitting} />}
            label={
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {t("rememberMe")}
              </Typography>
            }
          />
        )}
      />
      <Link
        href="#"
        underline="hover"
        sx={theme => ({
          color: theme.palette.primary.main,
          fontSize: "14px",
          fontWeight: 500,
        })}
      >
        {t("forgotPassword")}
      </Link>
    </Box>
  );
};

export function LoginForm() {
  const t = useTranslations("auth.login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginResult, setLoginResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loginSchema = createLoginSchema({
    emailRequired: t("emailRequired"),
    emailInvalid: t("emailInvalid"),
    passwordRequired: t("passwordRequired"),
    passwordMinLength: t("passwordMinLength"),
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
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginResult(null);

    mockLogin(data)
      .then(response => {
        if (response.success) {
          setLoginResult({
            type: "success",
            message: t("loginSuccess"),
          });
        } else {
          setLoginResult({
            type: "error",
            message: t("invalidCredentials"),
          });
        }
      })
      .catch(() => {
        setLoginResult({
          type: "error",
          message: t("loginError"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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
      {loginResult && (
        <Alert severity={loginResult.type} sx={{ mb: 1 }}>
          {loginResult.message}
        </Alert>
      )}

      <FormFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <FormActions control={control} isSubmitting={isSubmitting} />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
        fullWidth
        sx={{
          py: 1.5,
          mt: 1,
        }}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t("signIn")}
      </Button>
    </Box>
  );
}
