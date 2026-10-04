"use client";

import { WhatsApp as WhatsappIcon } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

/**
 * Empty-state content when the tenant has no connected WhatsApp numbers —
 * no list, composer, or sync can function without one. Renders the icon and
 * copy block (plus an optional description line); the consuming view owns
 * the panel chrome.
 */
export function NoWhatsappAccountsEmptyState({
  title,
  description,
}: Readonly<{ title: string; description?: string }>) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", py: 6 }}>
      <WhatsappIcon sx={{ fontSize: 48, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description !== undefined && (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, maxWidth: 480 }}>
          {description}
        </Typography>
      )}
    </Stack>
  );
}
