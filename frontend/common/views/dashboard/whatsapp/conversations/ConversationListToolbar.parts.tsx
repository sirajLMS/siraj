"use client";

import { Stack } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { WhatsappAccountSelect } from "@/frontend/common/views/dashboard/whatsapp/components";
import type { ConversationListSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListShared";

type ConversationListToolbarProps = Readonly<
  Pick<
    ConversationListSharedProps,
    "labels" | "accounts" | "accountId" | "onAccountChange" | "search" | "onSearchChange"
  >
>;

export function ConversationListToolbar({
  labels,
  accounts,
  accountId,
  onAccountChange,
  search,
  onSearchChange,
}: ConversationListToolbarProps) {
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <WhatsappAccountSelect
        label={labels.accountSelectorLabel}
        accounts={accounts}
        value={accountId}
        onChange={onAccountChange}
      />
      <SearchBarField value={search} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
    </Stack>
  );
}
