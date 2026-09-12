"use client";

import { PushPinOutlined, SendOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useAutoScrollToEnd } from "@/frontend/common/views/dashboard/whatsapp/conversations/useAutoScrollToEnd";
import type {
  WhatsappGroupMessageRow,
  WhatsappGroupsMessagesLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import { resolveMessageText } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel";

export interface GroupMessagesSharedProps {
  readonly labels: WhatsappGroupsMessagesLabels;
  readonly messages: readonly WhatsappGroupMessageRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly draft: string;
  readonly onDraftChange: (value: string) => void;
  readonly sendDisabled: boolean;
  readonly sending: boolean;
  readonly sendError: string | null;
  readonly onSend: () => void;
  readonly canManage: boolean;
  readonly pinningMessageId: string | null;
  readonly onPin: (messageId: string) => void;
  readonly onUnpin: (messageId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly onRetry: () => void;
}

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

function MessageItem({
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

/**
 * Shared group-messages panel for the `/whatsapp` groups workspace: header
 * with the group subject, scrollable message history with per-message
 * pin/unpin actions (management-gated), and the text composer. Message
 * bubbles align outbound traffic to the inline end so the layout stays
 * correct in RTL.
 */
export function GroupMessagesShared({
  labels,
  messages,
  loading,
  error,
  draft,
  onDraftChange,
  sendDisabled,
  sending,
  sendError,
  onSend,
  canManage,
  pinningMessageId,
  onPin,
  onUnpin,
  formatTimestamp,
  onRetry,
}: Readonly<GroupMessagesSharedProps>) {
  const lastMessageId = messages.length > 0 ? (messages[messages.length - 1]?.id ?? null) : null;
  const scrollContainerRef = useAutoScrollToEnd<HTMLElement>(lastMessageId, loading);
  return (
    <Stack spacing={2}>
      {error ? (
        <Alert
          severity="error"
          component="div"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {labels.refresh}
            </Button>
          }
        >
          <Typography variant="bodyMd">{labels.errorGeneric}</Typography>
        </Alert>
      ) : null}
      <Stack
        ref={scrollContainerRef}
        spacing={1}
        sx={{ px: 2, py: 2, minHeight: 240, maxHeight: 480, overflowY: "auto" }}
        component="section"
        aria-label={labels.messagesTitle}
      >
        {loading ? (
          <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
            <CircularProgress size={28} />
          </Box>
        ) : null}
        {!loading && messages.length === 0 ? (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {labels.messagesEmpty}
          </Typography>
        ) : null}
        {!loading ? (
          <Stack spacing={1.5}>
            {messages.map(message => (
              <MessageItem
                key={message.id}
                message={message}
                labels={labels}
                canManage={canManage}
                pinning={pinningMessageId === message.id}
                onPin={onPin}
                onUnpin={onUnpin}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
      {sendError !== null && (
        <Alert severity="error" component="div">
          <Typography variant="bodyMd">{sendError}</Typography>
        </Alert>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={labels.messagePlaceholder}
          value={draft}
          onChange={event => onDraftChange(event.target.value)}
          disabled={!canManage}
          slotProps={{ htmlInput: { dir: "auto" } }}
        />
        <Button
          variant="contained"
          onClick={onSend}
          disabled={sending || sendDisabled}
          startIcon={sending ? <CircularProgress size={16} /> : <SendOutlined />}
          sx={{ flexShrink: 0 }}
        >
          {sending ? labels.sending : labels.send}
        </Button>
      </Stack>
    </Stack>
  );
}
