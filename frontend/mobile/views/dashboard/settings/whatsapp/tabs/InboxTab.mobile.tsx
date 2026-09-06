"use client";

import { Avatar, Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { ConversationThread } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread";
import { InboxTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/InboxTabContent";
import type {
  WhatsappConversationRow,
  WhatsappInboxViewModel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getWhatsappPurposeBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

interface ConversationCardProps {
  readonly conversation: WhatsappConversationRow;
  readonly vm: WhatsappInboxViewModel;
}

function ConversationCard({ conversation, vm }: Readonly<ConversationCardProps>) {
  const badge = getWhatsappPurposeBadgeConfig(conversation.accountPurpose);
  const purposeLabel = vm.purposeLabel(conversation.accountPurpose);
  return (
    <MobileCardListItem interactive accentBorder={{ color: "primary", side: "inline-start" }}>
      <Box
        component="button"
        type="button"
        onClick={() => vm.onSelectConversation(conversation.id)}
        aria-label={vm.labels.openThread}
        sx={{
          all: "unset",
          display: "flex",
          gap: 1.5,
          width: "100%",
          cursor: "pointer",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ width: 40, height: 40 }}>{(conversation.displayName ?? "?").slice(0, 2)}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="titleLg"
            sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {conversation.displayName ?? conversation.username ?? conversation.waId}
          </Typography>
          <Typography
            variant="bodyMd"
            sx={{
              color: theme => theme.palette.text.secondary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {conversation.lastMessagePreview ?? ""}
          </Typography>
        </Box>
        <Stack spacing={0.5} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {vm.formatTimestamp(conversation.lastMessageAt)}
          </Typography>
          <StatusBadge category={badge.category} status={badge.status} label={purposeLabel} />
        </Stack>
      </Box>
    </MobileCardListItem>
  );
}
/**
 * Mobile inbox tab: card list of conversations; selecting one swaps the list
 * for the full-width read-only thread with a back button.
 */
export function InboxTabMobile(vm: Readonly<WhatsappInboxViewModel>) {
  if (vm.selectedConversation !== null) {
    return (
      <InboxTabContent {...vm}>
        <ConversationThread
          title={vm.selectedConversation.displayName ?? vm.selectedConversation.waId ?? ""}
          subtitle={vm.selectedConversation.waId ?? ""}
          messages={vm.threadMessages}
          labels={vm.labels}
          loading={vm.threadLoading}
          formatTimestamp={vm.formatTimestamp}
          onBack={vm.onCloseThread}
        />
      </InboxTabContent>
    );
  }

  return (
    <InboxTabContent {...vm}>
      <MobileCardList
        rows={vm.conversations}
        getKey={row => row.id}
        loading={vm.loading}
        emptyMessage={vm.labels.noConversations}
        renderItem={row => <ConversationCard conversation={row} vm={vm} />}
        paginationOptions={{
          mode: "server",
          page: vm.page,
          pageSize: vm.pageSize,
          totalCount: vm.totalCount,
          onPageChange: vm.onPageChange,
        }}
      />
    </InboxTabContent>
  );
}
