"use client";

import { ForumOutlined } from "@mui/icons-material";
import { Skeleton, Stack, Typography } from "@mui/material";
import type { WhatsappConversationListLabels } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

const LIST_SKELETON_KEYS = ["list-row-a", "list-row-b", "list-row-c"];

export function ConversationListSkeleton() {
  return (
    <Stack spacing={1} sx={{ px: 2, pb: 2 }} aria-busy>
      {LIST_SKELETON_KEYS.map(key => (
        <Skeleton key={key} variant="rounded" height={64} />
      ))}
    </Stack>
  );
}

export function ConversationListEmptyState({ labels }: Readonly<{ labels: WhatsappConversationListLabels }>) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", px: 2, py: 6 }}>
      <ForumOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.noConversations}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.emptyStateDescription}
      </Typography>
    </Stack>
  );
}
