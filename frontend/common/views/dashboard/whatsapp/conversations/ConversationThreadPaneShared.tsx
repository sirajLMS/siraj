"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import {
  ThreadMessagesFeedback,
  ThreadPaneFrame,
  useThreadAutoScroll,
} from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import { ConversationMessageItem } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationMessageItem.parts";
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
  const scrollContainerRef = useThreadAutoScroll(messages, loading);
  return (
    <ThreadPaneFrame
      backLabel={inboxLabels.back}
      onBack={onBack}
      header={
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
      }
    >
      <Stack
        ref={scrollContainerRef}
        spacing={1}
        sx={{ px: 2, pt: 2, pb: 2, minHeight: 240, maxHeight: 480, overflowY: "auto" }}
        component="section"
        aria-label={title}
      >
        <ThreadMessagesFeedback loading={loading} messages={messages} emptyText={labels.threadMessagesEmpty} />
        {!loading ? (
          <Stack spacing={1.5}>
            {messages.map(message => (
              <ConversationMessageItem
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
    </ThreadPaneFrame>
  );
}
