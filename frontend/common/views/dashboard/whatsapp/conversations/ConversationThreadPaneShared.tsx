"use client";

import { ArrowBackOutlined, BlockOutlined, HideImageOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Stack, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getWhatsappMessageDirectionLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappInboxDirectionLabel";
import { useAutoScrollToEnd } from "@/frontend/common/views/dashboard/whatsapp/conversations/useAutoScrollToEnd";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

export interface ConversationThreadPaneSharedProps {
  readonly labels: Pick<WhatsappConversationsLabels, "threadHeading" | "threadMessagesEmpty" | "lastMessageAt">;
  readonly inboxLabels: WhatsappInboxLabels;
  readonly title: string;
  readonly subtitle: string;
  readonly lastActivityText: string;
  readonly messages: readonly WhatsappMessageRow[];
  readonly loading: boolean;
  readonly formatTimestamp: (iso: string | null) => string;
  /** Renders the back button (single-pane layouts); omitted on split panes. */
  readonly onBack?: () => void;
  /**
   * Composer slot pinned under the message list. Unlike the read-only inbox
   * thread in settings, this pane carries an interactive composer, so its frame
   * deliberately has no read-only notice strip.
   */
  readonly composer?: ReactNode;
}

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

interface MessageItemProps {
  readonly message: WhatsappMessageRow;
  readonly inboxLabels: WhatsappInboxLabels;
  readonly formatTimestamp: (iso: string | null) => string;
}

const inboundBubbleSx = (theme: Theme) => ({
  bgcolor: theme.palette.surfaceVariant,
  color: theme.palette.onSurfaceVariant,
});

const outboundBubbleSx = (theme: Theme) => ({
  bgcolor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
});

function MessageBody({
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

function MessageItem({ message, inboxLabels, formatTimestamp }: Readonly<MessageItemProps>) {
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
        <MessageBody message={message} inboxLabels={inboxLabels} />
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

/**
 * Conversation thread pane for the `/whatsapp` workspace: header with the
 * contact name and last-activity line, scrollable message history, and an
 * optional composer docked below. Message bubbles align outbound traffic to
 * the inline end so the layout stays correct in RTL. Unlike the workspace
 * list panels, this pane keeps its own bordered chrome — chat panes are
 * message surfaces, not SectionPanel list shells.
 */
export function ConversationThreadPaneShared({
  labels,
  inboxLabels,
  title,
  subtitle,
  lastActivityText,
  messages,
  loading,
  formatTimestamp,
  onBack,
  composer,
}: Readonly<ConversationThreadPaneSharedProps>) {
  const lastMessageId = messages.length > 0 ? (messages[messages.length - 1]?.id ?? null) : null;
  const scrollContainerRef = useAutoScrollToEnd<HTMLElement>(lastMessageId, loading);
  return (
    <Stack sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ p: 2, alignItems: "center", borderBottom: theme => `1px solid ${theme.palette.outlineVariant}` }}
      >
        {onBack && (
          <IconButton onClick={onBack} aria-label={inboxLabels.back} size="small">
            <ArrowBackOutlined sx={theme => ({ transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)" })} />
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="titleLg" noWrap>
            {title}
          </Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }} dir="auto">
            {subtitle}
          </Typography>
          {lastActivityText !== "" && (
            <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
              {lastActivityText}
            </Typography>
          )}
        </Box>
      </Stack>
      <Stack
        ref={scrollContainerRef}
        spacing={1}
        sx={{ px: 2, pt: 2, pb: 2, minHeight: 240, maxHeight: 480, overflowY: "auto" }}
        component="section"
        aria-label={title}
      >
        {loading ? (
          <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
            <CircularProgress size={28} />
          </Box>
        ) : null}
        {!loading && messages.length === 0 ? (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {labels.threadMessagesEmpty}
          </Typography>
        ) : null}
        {!loading ? (
          <Stack spacing={1.5}>
            {messages.map(message => (
              <MessageItem
                key={message.id}
                message={message}
                inboxLabels={inboxLabels}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
      {composer ? (
        <Box sx={{ borderTop: theme => `1px solid ${theme.palette.outlineVariant}`, p: 2 }}>{composer}</Box>
      ) : null}
    </Stack>
  );
}
