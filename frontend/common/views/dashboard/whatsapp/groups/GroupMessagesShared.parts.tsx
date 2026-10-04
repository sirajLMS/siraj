import { PushPinOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type {
  WhatsappGroupMessageRow,
  WhatsappGroupsMessagesLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import { resolveMessageText } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel";

function isOutboundMessage(direction: WhatsappGroupMessageRow["direction"]): boolean {
  const labels: Record<string, boolean> = {
    ECHO: true,
    API_OUTBOUND: true,
  };
  return labels[direction] ?? false;
}

interface MessageItemProps {
  readonly message: WhatsappGroupMessageRow;
  readonly labels: WhatsappGroupsMessagesLabels;
  readonly canManage: boolean;
  readonly pinning: boolean;
  readonly onPin: (messageId: string) => void;
  readonly onUnpin: (messageId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
}

export function MessageItem({
  message,
  labels,
  canManage,
  pinning,
  onPin,
  onUnpin,
  formatTimestamp,
}: Readonly<MessageItemProps>) {
  const outbound = isOutboundMessage(message.direction);
  const pinned = message.pinnedAt !== null;
  const text = resolveMessageText(message.content);
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
          {
            bgcolor: theme => (outbound ? theme.palette.primaryContainer : theme.palette.surfaceVariant),
            color: theme => (outbound ? theme.palette.onPrimaryContainer : theme.palette.onSurfaceVariant),
          },
        ]}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          {pinned && (
            <Typography variant="labelUppercase" sx={{ opacity: 0.7 }}>
              {labels.pinned}
            </Typography>
          )}
          {canManage && (
            <Tooltip title={pinned ? labels.unpin : labels.pin}>
              <IconButton
                size="small"
                disabled={pinning}
                onClick={() => (pinned ? onUnpin(message.id) : onPin(message.id))}
                aria-label={pinned ? labels.unpin : labels.pin}
                sx={{ opacity: 0.7 }}
              >
                {pinning ? <CircularProgress size={14} /> : <PushPinOutlined sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        {text !== null && (
          <Typography variant="bodyMd" sx={{ whiteSpace: "pre-wrap" }} dir="auto">
            {text}
          </Typography>
        )}
        <Typography variant="caption" sx={{ opacity: 0.7, marginInlineStart: "auto" }}>
          {formatTimestamp(message.sentAt)}
        </Typography>
      </Stack>
    </Box>
  );
}
