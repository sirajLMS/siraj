"use client";

import { KeyOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { ResetPasswordDialogProps } from "@/frontend/common/components/ui/dialog/types/resetPasswordDialog.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function ResetPasswordDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  userName,
  userEmail,
  sendEmail,
  setSendEmail,
}: Readonly<ResetPasswordDialogProps>) {
  const t = useAppTranslation(Translation.Profile.Base);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = t.adminResetPassword.passwordRequired;
    } else if (password.length < 8) {
      newErrors.password = t.adminResetPassword.passwordMinLength;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.adminResetPassword.passwordsDoNotMatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validate()) {
      onConfirm(password, sendEmail);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle component="div" sx={{ pt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box
          sx={theme => ({
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          })}
        >
          <KeyOutlined sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="headlineMd">{t.adminResetPassword.title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
            {t.adminResetPassword.description(userName, userEmail)}
          </Typography>

          <FormControl fullWidth error={!!errors.password}>
            <InputLabel shrink>{t.adminResetPassword.newPassword}</InputLabel>
            <TextField
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        edge="end"
                        aria-label={
                          showPassword ? t.adminResetPassword.hidePassword : t.adminResetPassword.showPassword
                        }
                      >
                        {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              disabled={isLoading}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.confirmPassword}>
            <InputLabel shrink>{t.adminResetPassword.confirmPassword}</InputLabel>
            <TextField
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={e => handleConfirmPasswordChange(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              fullWidth
              autoComplete="new-password"
              disabled={isLoading}
            />
          </FormControl>

          <FormControl component="fieldset" fullWidth>
            <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: "center" }}>
              <input
                type="checkbox"
                id="send-email-checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                disabled={isLoading}
              />
              <Typography
                component="label"
                htmlFor="send-email-checkbox"
                sx={{ cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
              >
                {t.adminResetPassword.sendEmailLabel}
              </Typography>
            </Stack>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button fullWidth onClick={onClose} disabled={isLoading} sx={{ py: 1.5 }}>
          {t.adminResetPassword.cancelButton}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading}
          sx={theme => ({
            py: 1.5,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          {isLoading ? t.adminResetPassword.resettingButton : t.adminResetPassword.resetButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
