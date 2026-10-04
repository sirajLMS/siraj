"use client";

import { Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar";
import { FilterChip } from "@/frontend/common/components/ui/filter";
import { textDirection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/textDirection";
import { ListRowButton } from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import type {
  WhatsappConversationListLabels,
  WhatsappConversationRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

interface ConversationListRowProps {
  readonly conversation: WhatsappConversationRow;
  readonly labels: WhatsappConversationListLabels;
  readonly selected: boolean;
  readonly showAccountChip: boolean;
  readonly accountLabel: string | null;
  readonly isTestNumber: boolean;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
}

function contactName(row: WhatsappConversationRow): string {
  return row.displayName ?? row.username ?? row.waId ?? "";
}

export function ConversationListRow({
  conversation,
  labels,
  selected,
  showAccountChip,
  accountLabel,
  isTestNumber,
  onSelectConversation,
  formatTimestamp,
}: Readonly<ConversationListRowProps>) {
  const contact = contactName(conversation);
  return (
    <ListRowButton selected={selected} onClick={() => onSelectConversation(conversation.id)}>
      <UserAvatar label={contact} sx={{ width: 40, height: 40 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="titleLg"
          dir={textDirection(contact)}
          sx={{
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            unicodeBidi: "isolate",
            textAlign: "start",
          }}
        >
          {contact}
        </Typography>
        <Typography
          variant="bodyMd"
          dir="auto"
          sx={{
            color: theme => theme.palette.text.secondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            unicodeBidi: "isolate",
            textAlign: "start",
          }}
        >
          {conversation.lastMessagePreview ?? ""}
        </Typography>
        {(showAccountChip || isTestNumber) && (
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: "wrap" }}>
            {showAccountChip && accountLabel !== null && (
              <FilterChip label={accountLabel ?? ""} dir="auto" sx={{ maxWidth: 220 }} />
            )}
            {isTestNumber && <StatusBadge category="syncStatus" status="partial" label={labels.testNumberBadge} />}
          </Stack>
        )}
      </Box>
      <Typography
        variant="bodyMd"
        dir="auto"
        sx={{
          color: theme => theme.palette.text.secondary,
          unicodeBidi: "isolate",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {formatTimestamp(conversation.lastMessageAt)}
      </Typography>
    </ListRowButton>
  );
}
