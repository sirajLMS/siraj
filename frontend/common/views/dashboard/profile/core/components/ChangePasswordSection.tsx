"use client";

import LockOutlined from "@mui/icons-material/LockOutlined";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useChangePasswordSectionViewModel } from "@/frontend/common/views/dashboard/profile/core/useChangePasswordSectionViewModel";

export function ChangePasswordSection() {
  const {
    labels,
    currentPassword,
    newPassword,
    confirmPassword,
    errorMsg,
    successMsg,
    loading,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  } = useChangePasswordSectionViewModel();
  const tProfile = labels.profile.changePassword;

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <LockOutlined color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {tProfile.title}
          </Typography>
        </Stack>

        {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}
        {successMsg ? <Alert severity="success">{successMsg}</Alert> : null}

        <TextField
          type="password"
          label={tProfile.currentPassword}
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />

        <TextField
          type="password"
          label={tProfile.newPassword}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />

        <TextField
          type="password"
          label={tProfile.confirmPassword}
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
            {tProfile.submit}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
