"use client";

import { WhatsApp as WhatsappIcon } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

/**
 * Empty-state content when the tenant has no connected WhatsApp numbers —
 * no group list, creation, or sync can function without one. Renders only the
 * icon and copy block; the consuming desktop view owns the panel chrome.
 */
export function NoWhatsappGroupsAccountsState({ labels }: Readonly<{ labels: string }>) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        alignItems: "center",
        textAlign: "center",
        py: 6,
      }}
    >
      <WhatsappIcon sx={{ fontSize: 48, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels}
      </Typography>
    </Stack>
  );
}
