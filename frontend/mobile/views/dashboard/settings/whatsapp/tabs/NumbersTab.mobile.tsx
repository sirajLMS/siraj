"use client";

import { CloudSyncOutlined, DeleteOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import { NumberCard } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/**
 * Mobile numbers tab. Intentionally does not support add/update/credential
 * actions (onSetAccessToken, onSetTwoStepPin) — the mobile view is read-only
 * for accounts, only supporting sync and delete.
 * The shared props interface includes these handlers for the desktop view.
 */
export function NumbersTabMobile({
  labels,
  accounts,
  loading,
  syncing,
  snackbar,
  onSyncFromMeta,
  onDeleteAccount,
  onDismissSnackbar,
}: Readonly<NumbersTabSharedProps>) {
  const t = labels.page;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="titleLg">{t.numbersTitle}</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudSyncOutlined />}
          disabled={syncing}
          onClick={onSyncFromMeta}
        >
          {t.syncFromMeta}
        </Button>
      </Box>

      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mb: 2 }}>
        {t.numbersSubtitle}
      </Typography>

      {accounts.length === 0 ? (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, py: 4, textAlign: "center" }}>
          {t.noAccounts}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {accounts.map((account, index) => (
            <NumberCard
              key={account.id ?? account.phoneNumberId ?? index}
              account={account}
              labels={t}
              chipGap={0.5}
              action={
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlined />}
                  onClick={() => {
                    if (!account.id) return;
                    onDeleteAccount(account.id);
                  }}
                >
                  {t.deleteAccount}
                </Button>
              }
            />
          ))}
        </Stack>
      )}

      <NumbersSnackbar state={snackbar} onClose={onDismissSnackbar} />
    </Box>
  );
}
