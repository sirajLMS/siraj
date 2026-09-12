"use client";

import { WhatsApp as WhatsappIcon } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

/**
 * Full-page empty state when the tenant has no connected WhatsApp numbers —
 * no group list, creation, or sync can function without one.
 */
export function NoWhatsappGroupsAccountsState({ labels }: Readonly<{ labels: string }>) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        alignItems: "center",
        textAlign: "center",
        py: 10,
        px: 2,
        borderRadius: 2,
        border: theme => `1px dashed ${theme.palette.outlineVariant}`,
      }}
    >
      <WhatsappIcon sx={{ fontSize: 48, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels}
      </Typography>
    </Stack>
  );
}
