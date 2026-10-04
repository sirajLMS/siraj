"use client";

import { LockOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  dayDividerLabel,
  dayKey,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread.helpers";
import {
  DayDivider,
  MessageBubble,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread.parts";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { ThreadPaneFrame, useThreadAutoScroll } from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import { useAppLocale } from "@/shared/locale/localeContext";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

export interface ConversationThreadProps {
  readonly title: string;
  readonly subtitle: string;
  readonly messages: readonly WhatsappMessageRow[];
  readonly labels: WhatsappInboxLabels;
  readonly loading: boolean;
  readonly formatTimestamp: (iso: string | null) => string;
  /** When provided, a back button renders (mobile single-pane flow). */
  readonly onBack?: () => void;
}

interface ThreadBodyProps {
  readonly messages: readonly WhatsappMessageRow[];
  readonly labels: WhatsappInboxLabels;
  readonly loading: boolean;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly locale: string;
}

function renderMessagesWithDayDividers(
  messages: readonly WhatsappMessageRow[],
  labels: WhatsappInboxLabels,
  formatTimestamp: (iso: string | null) => string,
  locale: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastDay: string | null = null;
  for (const message of messages) {
    const day = dayKey(message.sentAt);
    if (day !== null && day !== lastDay) {
      lastDay = day;
      nodes.push(
        <DayDivider key={`day-${day}-${message.id}`} label={dayDividerLabel(message.sentAt, labels, locale)} />
      );
    }
    nodes.push(<MessageBubble key={message.id} message={message} labels={labels} formatTimestamp={formatTimestamp} />);
  }
  return nodes;
}

function ThreadBody({ messages, labels, loading, formatTimestamp, locale }: Readonly<ThreadBodyProps>) {
  if (loading) {
    return (
      <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (messages.length === 0) {
    return (
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.threadMessagesEmpty}
      </Typography>
    );
  }
  return <>{renderMessagesWithDayDividers(messages, labels, formatTimestamp, locale)}</>;
}

/**
 * Read-only conversation thread pane. Bubbles align outbound (ECHO /
 * API_OUTBOUND) to the inline-end and inbound to the inline-start so the
 * layout stays correct in RTL. Revoked messages render as an italic marker;
 * media items without content render the striped placeholder box.
 */
export function ConversationThread({
  title,
  subtitle,
  messages,
  labels,
  loading,
  formatTimestamp,
  onBack,
}: Readonly<ConversationThreadProps>) {
  const locale = useAppLocale();
  const scrollContainerRef = useThreadAutoScroll(messages, loading);
  return (
    <ThreadPaneFrame
      backLabel={labels.back}
      onBack={onBack}
      header={
        <Box>
          <Typography variant="titleLg">{title}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {subtitle}
          </Typography>
        </Box>
      }
    >
      <Stack
        ref={scrollContainerRef}
        spacing={2}
        sx={{ pt: 2, px: 2, pb: 3, minHeight: 240, maxHeight: 520, overflowY: "auto" }}
        component="section"
      >
        <ThreadBody
          messages={messages}
          labels={labels}
          loading={loading}
          formatTimestamp={formatTimestamp}
          locale={locale}
        />
      </Stack>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          p: 1.5,
          justifyContent: "center",
          alignItems: "center",
          borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
          bgcolor: theme => theme.palette.surfaceVariant,
          color: theme => theme.palette.onSurfaceVariant,
        }}
      >
        <LockOutlined fontSize="small" />
        <Typography variant="bodyMd">{labels.readOnlyNotice}</Typography>
      </Stack>
    </ThreadPaneFrame>
  );
}
