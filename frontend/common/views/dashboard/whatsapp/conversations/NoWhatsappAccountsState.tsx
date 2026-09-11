"use client";

import { WhatsApp as WhatsappIcon } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { WhatsappConversationShellLabels } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

/**
 * Full-page empty state when the tenant has no connected WhatsApp numbers —
 * no list, composer, or registry can function without one.
 */
export function NoWhatsappAccountsState({
  labels,
}: Readonly<{ labels: Pick<WhatsappConversationShellLabels, "noAccountsTitle" | "noAccountsDescription"> }>) {
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
        {labels.noAccountsTitle}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, maxWidth: 480 }}>
        {labels.noAccountsDescription}
      </Typography>
    </Stack>
  );
}
