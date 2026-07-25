"use client";

import { useMutation } from "@apollo/client/react";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { changePasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale";

export function ChangePasswordSection() {
  const t = useAppTranslation();
  const tProfile = t.profileTranslations.base;
  const tErrors = t.errorsTranslations;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [changePassword, { loading }] = useMutation(changePasswordMutationDocument);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(tErrors.auth.passwordsDoNotMatch);
      return;
    }

    try {
      const response = await changePassword({
        variables: {
          input: {
            currentPassword,
            newPassword,
            confirmPassword,
          },
        },
      });

      if (response.data?.changePassword) {
        setSuccessMsg(tProfile.changePassword.success);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      logger.error("Failed to change password", err);
      const message = err instanceof Error ? err.message : tErrors.auth.currentPasswordInvalid;
      setErrorMsg(message);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <LockOutlined color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {tProfile.changePassword.title}
          </Typography>
        </Stack>

        {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}
        {successMsg ? <Alert severity="success">{successMsg}</Alert> : null}

        <TextField
          type="password"
          label={tProfile.changePassword.currentPassword}
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />

        <TextField
          type="password"
          label={tProfile.changePassword.newPassword}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />

        <TextField
          type="password"
          label={tProfile.changePassword.confirmPassword}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {tProfile.changePassword.submit}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
