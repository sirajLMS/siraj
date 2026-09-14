"use client";

import { ForumOutlined } from "@mui/icons-material";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar";
import { FilterChip, type ServerListPaginationOptions } from "@/frontend/common/components/ui/filter";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { textDirection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/textDirection";
import { WhatsappAccountSelect } from "@/frontend/common/views/dashboard/whatsapp/components";
import type {
  WhatsappConversationListLabels,
  WhatsappConversationRow,
  WhatsappConversationsAccountOption,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

/**
 * Everything the tier shell owns: the scaffold hands the toolbar, the
 * loading/empty branches, the prepared rows with their renderer, the server
 * pagination config, and the list's aria label — the shell decides the panel
 * chrome, the row container, and the pager.
 */
export interface ConversationListShellArgs {
  readonly toolbar: ReactNode;
  readonly skeleton: ReactNode | null;
  readonly empty: ReactNode | null;
  readonly rows: readonly WhatsappConversationRow[];
  readonly renderRow: (row: WhatsappConversationRow) => ReactNode;
  readonly paginationOptions: ServerListPaginationOptions;
  readonly rowsAriaLabel: string;
}

export type ConversationListShell = (args: ConversationListShellArgs) => ReactNode;

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
  readonly paginationOptions: ServerListPaginationOptions;
  readonly listShell: ConversationListShell;
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

function ListSkeleton() {
  return (
    <Stack spacing={1} sx={{ px: 2, pb: 2 }} aria-busy>
      {LIST_SKELETON_KEYS.map(key => (
        <Skeleton key={key} variant="rounded" height={64} />
      ))}
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
    </Box>
  );
}

/**
 * Tier-neutral conversation list scaffold for the `/whatsapp` workspace:
 * account selector + contact search toolbar, contact rows with preview and
 * the owning account chip, and the loading/empty branches. The tier-specific
 * shell (panel chrome, row container, pager) is injected via `listShell` —
 * desktop renders a `SectionPanel` with sibling pagination controls, mobile a
 * `MobileSectionPanel` wrapping an edge-to-edge `MobileCardList`.
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
  paginationOptions,
  listShell,
  onSelectConversation,
  formatTimestamp,
  accountLabel,
  accountIsTestNumber,
}: Readonly<ConversationListSharedProps>) {
  const showSkeleton = loading && conversations.length === 0;
  const showEmpty = !loading && conversations.length === 0;
  const showAccountChip = accounts.length > 1;

  return listShell({
    toolbar: (
      <ListToolbar
        labels={labels}
        accounts={accounts}
        accountId={accountId}
        onAccountChange={onAccountChange}
        search={search}
        onSearchChange={onSearchChange}
      />
    ),
    skeleton: showSkeleton ? <ListSkeleton /> : null,
    empty: showEmpty ? <ListEmptyState labels={labels} /> : null,
    rows: conversations,
    renderRow: conversation => (
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
    ),
    paginationOptions,
    rowsAriaLabel: labels.columnContact,
  });
}
