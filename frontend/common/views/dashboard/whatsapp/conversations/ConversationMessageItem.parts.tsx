"use client";

import { BlockOutlined, HideImageOutlined } from "@mui/icons-material";
import { Box, Stack, type Theme, Typography } from "@mui/material";
import type { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getWhatsappMessageDirectionLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappInboxDirectionLabel";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

function resolveMessageText(content: unknown): string | null {
  if (typeof content === "string") {
    return content === "" ? null : content;
  }
  // Persisted rows carry the Meta typed-content envelope (e.g. `{ body, … }`).
  if (typeof content !== "object" || content === null || !("body" in content)) {
    return null;
  }
  const body: unknown = content.body;
  return typeof body === "string" && body !== "" ? body : null;
}

function isOutboundMessage(direction: WhatsappMessageDirection | null): boolean {
  const labels: Record<string, boolean> = {
    ECHO: true,
    API_OUTBOUND: true,
  };
  return direction !== null ? (labels[direction] ?? false) : false;
}

const inboundBubbleSx = (theme: Theme) => ({
  bgcolor: theme.palette.surfaceVariant,
  color: theme.palette.onSurfaceVariant,
});

const outboundBubbleSx = (theme: Theme) => ({
  bgcolor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
});

function ConversationMessageBody({
  message,
  inboxLabels,
}: Readonly<{ message: WhatsappMessageRow; inboxLabels: WhatsappInboxLabels }>) {
  if (message.revokedAt !== null) {
    return (
      <Typography variant="bodyMd" sx={{ fontStyle: "italic", display: "flex", gap: 0.5, alignItems: "center" }}>
        <BlockOutlined fontSize="small" />
        {inboxLabels.messageRevoked}
      </Typography>
    );
  }
  const text = resolveMessageText(message.content);
  if (text !== null) {
    return (
      <Typography variant="bodyMd" sx={{ whiteSpace: "pre-wrap" }} dir="auto">
        {text}
      </Typography>
    );
  }
  if (message.mediaPlaceholder === true) {
    return (
      <Stack spacing={0.75} sx={{ alignItems: "flex-start" }}>
        <HideImageOutlined fontSize="small" />
        <Typography variant="bodyMd">{inboxLabels.mediaExpired}</Typography>
      </Stack>
    );
  }
  return null;
}

interface ConversationMessageItemProps {
  readonly message: WhatsappMessageRow;
  readonly inboxLabels: WhatsappInboxLabels;
  readonly formatTimestamp: (iso: string | null) => string;
}

export function ConversationMessageItem({
  message,
  inboxLabels,
  formatTimestamp,
}: Readonly<ConversationMessageItemProps>) {
  const outbound = isOutboundMessage(message.direction);
  const directionLabel = getWhatsappMessageDirectionLabel(inboxLabels, message.direction);
  return (
    <Box sx={{ display: "flex", justifyContent: outbound ? "flex-end" : "flex-start" }}>
      <Stack
        spacing={0.5}
        sx={[
          {
            maxWidth: "85%",
            px: 1.5,
            py: 1.25,
            borderRadius: 2,
            borderStartStartRadius: outbound ? 8 : 2,
            borderStartEndRadius: outbound ? 2 : 8,
          },
          outbound ? outboundBubbleSx : inboundBubbleSx,
        ]}
      >
        <ConversationMessageBody message={message} inboxLabels={inboxLabels} />
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
          {directionLabel !== "" && (
            <Typography variant="labelUppercase" sx={{ opacity: 0.7 }}>
              {directionLabel}
            </Typography>
          )}
          <Typography variant="caption" sx={{ opacity: 0.7, marginInlineStart: "auto" }}>
            {message.editedAt ? `${inboxLabels.editedLabel} · ` : ""}
            {formatTimestamp(message.sentAt)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
