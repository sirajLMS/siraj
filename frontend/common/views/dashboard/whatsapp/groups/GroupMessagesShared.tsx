"use client";

import { SendOutlined } from "@mui/icons-material";
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { ThreadMessagesFeedback, useThreadAutoScroll } from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import { MessageItem } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupMessagesShared.parts";
import type {
  WhatsappGroupMessageRow,
  WhatsappGroupsMessagesLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

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
  const scrollContainerRef = useThreadAutoScroll(messages, loading);
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
        <ThreadMessagesFeedback loading={loading} messages={messages} emptyText={labels.messagesEmpty} />
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
