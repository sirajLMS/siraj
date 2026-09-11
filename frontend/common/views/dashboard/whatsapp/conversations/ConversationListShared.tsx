"use client";

import { ForumOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { PaginationControls } from "@/frontend/common/components/ui/filter";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { textDirection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/textDirection";
import type {
  WhatsappConversationListLabels,
  WhatsappConversationRow,
  WhatsappConversationsAccountOption,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export interface ConversationListSharedProps {
  readonly labels: WhatsappConversationListLabels;
  readonly accounts: readonly WhatsappConversationsAccountOption[];
  readonly accountId: string | null;
  readonly onAccountChange: (accountId: string) => void;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly conversations: readonly WhatsappConversationRow[];
  readonly loading: boolean;
  readonly selectedConversationId: string | null;
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly accountLabel: (accountId: string | null) => string | null;
  readonly accountIsTestNumber: (accountId: string | null) => boolean;
}

function contactName(row: WhatsappConversationRow): string {
  return row.displayName ?? row.username ?? row.waId ?? "";
}

const LIST_SKELETON_KEYS = ["list-row-a", "list-row-b", "list-row-c"];

function ListToolbar({
  labels,
  accounts,
  accountId,
  onAccountChange,
  search,
  onSearchChange,
}: Readonly<
  Pick<
    ConversationListSharedProps,
    "labels" | "accounts" | "accountId" | "onAccountChange" | "search" | "onSearchChange"
  >
>) {
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <FormControl size="small" fullWidth>
        <InputLabel id="whatsapp-conversations-account-select">{labels.accountSelectorLabel}</InputLabel>
        <Select
          labelId="whatsapp-conversations-account-select"
          value={accountId ?? ""}
          label={labels.accountSelectorLabel}
          onChange={event => {
            if (event.target.value !== "") {
              onAccountChange(event.target.value);
            }
          }}
        >
          {accounts.map(account => (
            <MenuItem
              key={account.id}
              value={account.id}
              dir={textDirection(account.label)}
              sx={{ unicodeBidi: "isolate" }}
            >
              {account.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <SearchBarField value={search} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
    </Stack>
  );
}

function ListEmptyState({ labels }: Readonly<{ labels: WhatsappConversationListLabels }>) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", px: 2, py: 6 }}>
      <ForumOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.noConversations}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.emptyStateDescription}
      </Typography>
    </Stack>
  );
}

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

function ConversationListRow({
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
    <Box
      component="button"
      type="button"
      onClick={() => onSelectConversation(conversation.id)}
      aria-pressed={selected}
      sx={theme => ({
        all: "unset",
        display: "flex",
        gap: 1.5,
        width: "100%",
        boxSizing: "border-box",
        px: 2,
        py: 1.5,
        cursor: "pointer",
        alignItems: "center",
        backgroundColor: selected ? theme.palette.action.selected : "transparent",
        borderRadius: 1,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&:focus-visible": { backgroundColor: theme.palette.action.hover },
      })}
    >
      <Avatar sx={{ width: 40, height: 40, flexShrink: 0 }}>{contact.slice(0, 2) || "?"}</Avatar>
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
              <Chip size="small" variant="outlined" dir="auto" label={accountLabel} sx={{ maxWidth: 220 }} />
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
    </Box>
  );
}

/**
 * Shared conversation list panel for the `/whatsapp` workspace: number
 * selector + contact search toolbar, bordered row list with contact preview
 * and the owning account chip, and server-driven pagination. Used verbatim by
 * both tiers — there are no viewport-specific code paths inside.
 */
export function ConversationListShared({
  labels,
  accounts,
  accountId,
  onAccountChange,
  search,
  onSearchChange,
  conversations,
  loading,
  selectedConversationId,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSelectConversation,
  formatTimestamp,
  accountLabel,
  accountIsTestNumber,
}: Readonly<ConversationListSharedProps>) {
  const showSkeleton = loading && conversations.length === 0;
  const showEmpty = !loading && conversations.length === 0;
  const showAccountChip = accounts.length > 1;
  return (
    <Stack sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      <ListToolbar
        labels={labels}
        accounts={accounts}
        accountId={accountId}
        onAccountChange={onAccountChange}
        search={search}
        onSearchChange={onSearchChange}
      />
      {showSkeleton && (
        <Stack spacing={1} sx={{ px: 2, pb: 2 }} aria-busy>
          {LIST_SKELETON_KEYS.map(key => (
            <Skeleton key={key} variant="rounded" height={64} />
          ))}
        </Stack>
      )}
      {showEmpty && <ListEmptyState labels={labels} />}
      {!showSkeleton && !showEmpty && (
        <Stack aria-label={labels.columnContact}>
          {conversations.map(conversation => (
            <ConversationListRow
              key={conversation.id}
              conversation={conversation}
              labels={labels}
              selected={conversation.id === selectedConversationId}
              showAccountChip={showAccountChip}
              accountLabel={accountLabel(conversation.accountId)}
              isTestNumber={accountIsTestNumber(conversation.accountId)}
              onSelectConversation={onSelectConversation}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </Stack>
      )}
      <PaginationControls
        page={page}
        pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
        rowCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Stack>
  );
}
