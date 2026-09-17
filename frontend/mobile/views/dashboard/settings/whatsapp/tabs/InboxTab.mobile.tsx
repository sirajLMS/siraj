"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Avatar, Box, ButtonBase, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { ConversationThread } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread";
import { InboxTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/InboxTabContent";
import { textDirection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/textDirection";
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
  const contact = conversation.displayName ?? conversation.username ?? conversation.waId ?? "";
  return (
    <MobileCardListItem interactive accentBorder={{ color: "primary", side: "inline-start" }}>
      <ButtonBase
        type="button"
        onClick={() => vm.onSelectConversation(conversation.id)}
        aria-label={vm.labels.openThread}
        sx={theme => ({
          all: "unset",
          display: "flex",
          gap: 1.5,
          width: "100%",
          cursor: "pointer",
          alignItems: "center",
          borderRadius: 1,
          "&:hover": { backgroundColor: theme.palette.action.hover },
          "&:focus-visible": { backgroundColor: theme.palette.action.hover },
        })}
      >
        <Avatar sx={{ width: 40, height: 40 }}>{contact.slice(0, 2) || "?"}</Avatar>
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
        </Box>
        <Stack spacing={0.5} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
          <Typography
            variant="bodyMd"
            dir="auto"
            sx={{
              color: theme => theme.palette.text.secondary,
              unicodeBidi: "isolate",
              whiteSpace: "nowrap",
            }}
          >
            {vm.formatTimestamp(conversation.lastMessageAt)}
          </Typography>
          <StatusBadge category={badge.category} status={badge.status} label={purposeLabel} />
        </Stack>
        <ChevronRightOutlined
          sx={theme => ({
            color: theme.palette.text.secondary,
            flexShrink: 0,
            transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
          })}
        />
      </ButtonBase>
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
