"use client";

import type { ReactNode } from "react";
import type { ServerListPaginationOptions } from "@/frontend/common/components/ui/filter";
import { ConversationListRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListRow.parts";
import {
  ConversationListEmptyState,
  ConversationListSkeleton,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListStates.parts";
import { ConversationListToolbar } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListToolbar.parts";
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
      <ConversationListToolbar
        labels={labels}
        accounts={accounts}
        accountId={accountId}
        onAccountChange={onAccountChange}
        search={search}
        onSearchChange={onSearchChange}
      />
    ),
    skeleton: showSkeleton ? <ConversationListSkeleton /> : null,
    empty: showEmpty ? <ConversationListEmptyState labels={labels} /> : null,
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
