import { BlockOutlined, HideImageOutlined } from "@mui/icons-material";
import { Box, Stack, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  isOutbound,
  messageText,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread.helpers";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getWhatsappMessageDirectionLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappInboxDirectionLabel";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

/** Centered date pill dividing message groups by send day. */
export function DayDivider({ label }: Readonly<{ label: string }>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Typography
        variant="labelUppercase"
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          bgcolor: theme => theme.palette.surfaceVariant,
          color: theme => theme.palette.onSurfaceVariant,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function RevokedMessageBody({ labels }: Readonly<{ labels: WhatsappInboxLabels }>) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <BlockOutlined fontSize="small" />
      <Typography variant="bodyMd" sx={{ fontStyle: "italic" }}>
        {labels.messageRevoked}
      </Typography>
    </Stack>
  );
}

function MessageMediaPlaceholder({ labels }: Readonly<{ labels: WhatsappInboxLabels }>) {
  return (
    <Stack
      spacing={1}
      sx={{
        border: theme => `1px dashed ${theme.palette.outline}`,
        borderRadius: 2,
        p: 2,
        alignItems: "center",
        color: theme => theme.palette.onSurfaceVariant,
      }}
    >
      <HideImageOutlined />
      <Typography variant="bodyMd">{labels.mediaExpired}</Typography>
    </Stack>
  );
}

function renderMessageBody(message: WhatsappMessageRow, labels: WhatsappInboxLabels): ReactNode {
  if (message.revokedAt !== null) {
    return <RevokedMessageBody labels={labels} />;
  }
  const body = messageText(message.content);
  if (body !== null) {
    return (
      <Typography variant="bodyMd" sx={{ whiteSpace: "pre-wrap" }}>
        {body}
      </Typography>
    );
  }
  if (message.mediaPlaceholder === true) {
    return <MessageMediaPlaceholder labels={labels} />;
  }
  return null;
}

interface MessageBubbleProps {
  readonly message: WhatsappMessageRow;
  readonly labels: WhatsappInboxLabels;
  readonly formatTimestamp: (iso: string | null) => string;
}

const INBOUND_BUBBLE_SX = (theme: Theme) => ({
  bgcolor: theme.palette.surfaceVariant,
  color: theme.palette.onSurfaceVariant,
});

const OUTBOUND_BUBBLE_SX = (theme: Theme) => ({
  bgcolor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
});

export function MessageBubble({ message, labels, formatTimestamp }: Readonly<MessageBubbleProps>) {
  const outbound = isOutbound(message.direction);
  const directionLabel = getWhatsappMessageDirectionLabel(labels, message.direction);

  return (
    <Stack
      spacing={0.5}
      sx={[
        {
          alignSelf: outbound ? "flex-end" : "flex-start",
          maxWidth: "80%",
          p: 1.5,
          borderRadius: 2,
          borderStartStartRadius: outbound ? 8 : 2,
          borderStartEndRadius: outbound ? 2 : 8,
        },
        outbound ? OUTBOUND_BUBBLE_SX : INBOUND_BUBBLE_SX,
      ]}
    >
      {renderMessageBody(message, labels)}
      <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
        {directionLabel !== "" && (
          <Typography variant="labelUppercase" sx={{ opacity: 0.7 }}>
            {directionLabel}
          </Typography>
        )}
        <Typography variant="caption" sx={{ opacity: 0.7, marginInlineStart: "auto" }}>
          {message.editedAt ? `${labels.editedLabel} · ` : ""}
          {formatTimestamp(message.sentAt)}
        </Typography>
      </Stack>
    </Stack>
  );
}
