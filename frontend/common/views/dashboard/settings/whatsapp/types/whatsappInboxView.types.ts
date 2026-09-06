import type {
  WhatsappConversationFieldsFragment,
  WhatsappMessageFieldsFragment,
  WhatsappSyncStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

export type WhatsappConversationRow = WhatsappConversationFieldsFragment & { readonly id: string };
export type WhatsappMessageRow = WhatsappMessageFieldsFragment & { readonly id: string };

/** Single entry of the account filter select (coexistence numbers). */
export interface WhatsappInboxAccountOption {
  readonly id: string;
  /** Display label — prefers the display phone number, then the localized name. */
  readonly label: string;
  /** History-sync status of the account; drives the declined-sync banner. */
  readonly syncStatus: WhatsappSyncStatus | null;
}

/**
 * View model for the read-only WhatsApp inbox tab. Query results flow through
 * here; tier files (`InboxTab.desktop/.mobile`) render from these props only.
 */
export interface WhatsappInboxViewModel {
  readonly labels: WhatsappInboxLabels;
  readonly accounts: readonly WhatsappInboxAccountOption[];
  readonly conversations: readonly WhatsappConversationRow[];
  readonly totalCount: number;
  readonly loading: boolean;
  readonly queryError: boolean;
  /** True when the filtered account failed history sync by declining it. */
  readonly historyDeclined: boolean;
  readonly accountFilter: string | null;
  readonly search: string;
  readonly page: number;
  readonly pageSize: number;
  readonly selectedConversation: WhatsappConversationRow | null;
  readonly threadMessages: readonly WhatsappMessageRow[];
  readonly threadLoading: boolean;
  readonly threadError: boolean;
  readonly onAccountFilterChange: (accountId: string | null) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onCloseThread: () => void;
  readonly onRetry: () => void;
  /** Locale-aware timestamp formatter (medium date + short time). */
  readonly formatTimestamp: (iso: string | null) => string;
  /** Localized label for an account's routing purpose (raw value when unknown). */
  readonly purposeLabel: (purpose: string | null) => string;
}
