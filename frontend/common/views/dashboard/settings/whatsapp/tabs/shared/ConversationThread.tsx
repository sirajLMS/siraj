"use client";

import { ArrowBackOutlined, BlockOutlined, HideImageOutlined, LockOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Stack, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getWhatsappMessageDirectionLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappInboxDirectionLabel";
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

function messageText(content: unknown): string | null {
  if (typeof content === "string") {
    return content.length > 0 ? content : null;
  }
  // Persisted rows carry the Meta typed-content envelope (e.g. `{ body, … }` or
  // an edit envelope `{ body, __edited_type }`) — read the textual body.
  if (typeof content === "object" && content !== null && "body" in content) {
    const body = content.body;
    return typeof body === "string" && body.length > 0 ? body : null;
  }
  return null;
}

function isOutbound(direction: WhatsappMessageDirection | null): boolean {
  return direction === WhatsappMessageDirection.Echo || direction === WhatsappMessageDirection.ApiOutbound;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKey(sentAt: string | null): string | null {
  if (sentAt === null) {
    return null;
  }
  const date = new Date(sentAt);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayDividerLabel(sentAt: string | null, labels: WhatsappInboxLabels): string {
  if (sentAt === null) {
    return "";
  }
  const date = new Date(sentAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) {
    return labels.dayToday;
  }
  if (isSameDay(date, yesterday)) {
    return labels.dayYesterday;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

/** Centered date pill dividing message groups by send day. */
function DayDivider({ label }: Readonly<{ label: string }>) {
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

function MessageBubble({ message, labels, formatTimestamp }: Readonly<MessageBubbleProps>) {
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

interface ThreadBodyProps {
  readonly messages: readonly WhatsappMessageRow[];
  readonly labels: WhatsappInboxLabels;
  readonly loading: boolean;
  readonly formatTimestamp: (iso: string | null) => string;
}

function renderMessagesWithDayDividers(
  messages: readonly WhatsappMessageRow[],
  labels: WhatsappInboxLabels,
  formatTimestamp: (iso: string | null) => string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastDay: string | null = null;
  for (const message of messages) {
    const day = dayKey(message.sentAt);
    if (day !== null && day !== lastDay) {
      lastDay = day;
      nodes.push(<DayDivider key={`day-${day}-${message.id}`} label={dayDividerLabel(message.sentAt, labels)} />);
    }
    nodes.push(<MessageBubble key={message.id} message={message} labels={labels} formatTimestamp={formatTimestamp} />);
  }
  return nodes;
}

function ThreadBody({ messages, labels, loading, formatTimestamp }: Readonly<ThreadBodyProps>) {
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
  return <>{renderMessagesWithDayDividers(messages, labels, formatTimestamp)}</>;
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
  return (
    <Stack sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ p: 2, alignItems: "center", borderBottom: theme => `1px solid ${theme.palette.outlineVariant}` }}
      >
        {onBack && (
          <IconButton onClick={onBack} aria-label={labels.back} size="small">
            <ArrowBackOutlined sx={theme => ({ transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)" })} />
          </IconButton>
        )}
        <Box>
          <Typography variant="titleLg">{title}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
      <Stack
        spacing={2}
        sx={{ pt: 2, px: 2, pb: 3, minHeight: 240, maxHeight: 520, overflowY: "auto" }}
        component="section"
      >
        <ThreadBody messages={messages} labels={labels} loading={loading} formatTimestamp={formatTimestamp} />
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
    </Stack>
  );
}
