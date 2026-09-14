import type {
  WhatsappConversationSendMode,
  WhatsappTemplateCategory,
  WhatsappTestRecipientFieldsFragment,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  WhatsappConversationRow,
  WhatsappMessageRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

export type { WhatsappConversationRow, WhatsappMessageRow };

/** Registry row with a non-null id after Apollo normalization. */
export type WhatsappTestRecipientRow = WhatsappTestRecipientFieldsFragment & { readonly id: string };

export type WhatsappConversationShellLabels = Pick<
  WhatsappConversationsLabels,
  "title" | "subtitle" | "noAccountsTitle" | "noAccountsDescription" | "readOnlyBadge" | "newConversation"
>;

export type WhatsappConversationListLabels = Pick<
  WhatsappConversationsLabels,
  | "accountSelectorLabel"
  | "searchPlaceholder"
  | "noConversations"
  | "emptyStateDescription"
  | "loadErrorDescription"
  | "retry"
  | "testNumberBadge"
  | "columnContact"
>;

type WhatsappConversationThreadLabels = Pick<
  WhatsappConversationsLabels,
  "threadHeading" | "threadMessagesEmpty" | "lastMessageAt"
>;

export type WhatsappComposerLabels = Pick<
  WhatsappConversationsLabels,
  | "composerModeLabel"
  | "composerModeText"
  | "composerModeTemplate"
  | "composerTextPlaceholder"
  | "composerTemplatePlaceholder"
  | "composerRecipientLabel"
  | "composerRecipientPlaceholder"
  | "templateLanguageLabel"
  | "templateLanguagePlaceholder"
  | "templatePickerLabel"
  | "templatePickerPlaceholder"
  | "templatePickerEmpty"
  | "templatePickerError"
  | "templatePickerRetry"
  | "sendButton"
  | "windowOpenHint"
  | "windowClosedHint"
  | "sendErrorTitle"
  | "newConversationTitle"
  | "newConversationSubtitle"
>;

export type WhatsappTestNumberBannerLabels = Pick<
  WhatsappConversationsLabels,
  "testNumberBannerTitle" | "testNumberBannerBody" | "metaDashboardLinkText"
>;

export type WhatsappRecipientPanelLabels = Pick<
  WhatsappConversationsLabels,
  | "recipientsTitle"
  | "recipientsEmptyTitle"
  | "recipientsEmptyDescription"
  | "recipientAdd"
  | "recipientRemove"
  | "recipientVerify"
  | "recipientStatusPending"
  | "recipientStatusAllowed"
  | "recipientLastChecked"
  | "recipientErrorCode"
  | "recipientAddFailed"
  | "addRecipientDialogTitle"
  | "recipientPhoneLabel"
  | "recipientPhonePlaceholder"
  | "recipientNoteLabel"
  | "recipientNotePlaceholder"
  | "dialogCancel"
  | "dialogSave"
  | "removeRecipientDialogTitle"
  | "removeRecipientConfirm"
>;

export interface WhatsappConversationsLabelsBySection {
  readonly shell: WhatsappConversationShellLabels;
  readonly list: WhatsappConversationListLabels;
  readonly thread: WhatsappConversationThreadLabels;
  readonly composer: WhatsappComposerLabels;
  readonly banner: WhatsappTestNumberBannerLabels;
  readonly recipients: WhatsappRecipientPanelLabels;
}

/** One entry of the account selector; only active accounts enter the list. */
export interface WhatsappConversationsAccountOption {
  readonly id: string;
  readonly label: string;
  readonly isActive: boolean;
  readonly isTestNumber: boolean;
}

/**
 * One APPROVED Meta template pre-shaped for the composer picker. `key`
 * (`name|language`) distinguishes the same template across languages;
 * `paramsCount > 0` marks templates whose variables the composer cannot fill.
 */
export interface WhatsappTemplateOption {
  readonly key: string;
  readonly name: string;
  readonly language: string;
  readonly category: WhatsappTemplateCategory | null;
  readonly bodyText: string;
  readonly paramsCount: number;
}

/**
 * Registry row pre-shaped for presentation: status copy, formatted last-check
 * line, and the Meta error line are already localized/interpolated by the VM.
 */
export interface WhatsappRecipientViewRow {
  readonly id: string;
  readonly phoneNumber: string;
  readonly note: string | null;
  readonly status: WhatsappTestRecipientStatus;
  readonly statusLabel: string;
  readonly statusBadgeStatus: string;
  readonly lastCheckedText: string | null;
  readonly errorText: string | null;
}

/**
 * View model for the `/whatsapp` conversations workspace. Tier views render
 * from this shape only; handlers and state stay flat, copy is grouped under
 * `labelsBySection`. Message-chrome copy (direction labels, revoked/media
 * markers) comes from the shared inbox namespace via `inboxLabels`.
 */
export interface WhatsappConversationsViewModel {
  readonly labelsBySection: WhatsappConversationsLabelsBySection;
  readonly inboxLabels: WhatsappInboxLabels;
  readonly canManage: boolean;

  readonly accounts: readonly WhatsappConversationsAccountOption[];
  readonly accountsLoading: boolean;
  readonly accountId: string | null;
  readonly selectedAccount: WhatsappConversationsAccountOption | null;
  readonly onAccountChange: (accountId: string) => void;

  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly conversations: readonly WhatsappConversationRow[];
  readonly conversationsLoading: boolean;
  readonly conversationsError: boolean;
  readonly conversationsPage: number;
  readonly conversationsPageSize: number;
  readonly conversationsTotalCount: number;
  readonly onConversationsPageChange: (page: number) => void;
  readonly onRetryConversations: () => void;

  readonly selectedConversation: WhatsappConversationRow | null;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onCloseThread: () => void;
  /** True after the new-conversation action fires until a thread opens. */
  readonly isInitiating: boolean;
  /** Closes any open thread and resets the composer, defaulting initiation to template mode. */
  readonly onStartNewConversation: () => void;

  readonly threadMessages: readonly WhatsappMessageRow[];
  readonly threadLoading: boolean;
  readonly threadError: boolean;
  readonly threadLastActivityText: string;

  readonly composerMode: WhatsappConversationSendMode;
  readonly onComposerModeChange: (mode: WhatsappConversationSendMode) => void;
  readonly textBody: string;
  readonly onTextBodyChange: (value: string) => void;
  readonly templateName: string;
  readonly onTemplateNameChange: (value: string) => void;
  readonly templateLanguage: string;
  readonly onTemplateLanguageChange: (value: string) => void;
  /** APPROVED templates of the selected account, live from Meta. */
  readonly templateOptions: readonly WhatsappTemplateOption[];
  readonly templatesLoading: boolean;
  readonly templatesError: boolean;
  readonly onRetryTemplates: () => void;
  /** Applies a picked template to the composer; `null` clears name + language. */
  readonly onTemplateSelect: (option: WhatsappTemplateOption | null) => void;
  /** Note shown on picker rows whose variables the composer cannot fill. */
  readonly templateParamsUnsupportedText: string;
  /** True while no conversation is open — the composer must resolve a target. */
  readonly showRecipientPicker: boolean;
  /** On a test account, new-conversation targets come from the registry only. */
  readonly registryTargetOnly: boolean;
  readonly registryTargetPhones: readonly string[];
  readonly recipientSelection: string;
  readonly onRecipientSelectionChange: (value: string) => void;
  readonly customRecipient: string;
  readonly onCustomRecipientChange: (value: string) => void;
  readonly windowOpen: boolean;
  readonly windowStatusHint: string;
  readonly sendBlockReason: string | null;
  readonly sendDisabled: boolean;
  readonly sendError: string | null;
  readonly sending: boolean;
  readonly onSend: () => void;

  readonly isTestAccount: boolean;
  readonly recipientRows: readonly WhatsappRecipientViewRow[];
  readonly recipientsLoading: boolean;
  readonly recipientLimitReached: boolean;
  readonly recipientsNotice: string | null;
  readonly addRecipientOpen: boolean;
  readonly addRecipientPhone: string;
  /** True once the entered add-dialog number parses to a valid E.164 value. */
  readonly addRecipientPhoneValid: boolean;
  readonly addRecipientNote: string;
  readonly addRecipientError: string | null;
  readonly registryBusy: boolean;
  readonly removeDialogRecipient: WhatsappRecipientViewRow | null;
  readonly removeRecipientConfirmText: string;
  readonly verifyingRecipientId: string | null;
  readonly onOpenAddRecipient: () => void;
  readonly onCloseAddRecipient: () => void;
  readonly onAddRecipientPhoneChange: (value: string) => void;
  readonly onAddRecipientNoteChange: (value: string) => void;
  readonly onSubmitAddRecipient: () => void;
  readonly onAskRemoveRecipient: (recipientId: string) => void;
  readonly onCloseRemoveRecipient: () => void;
  readonly onConfirmRemoveRecipient: () => void;
  readonly onVerifyRecipient: (recipientId: string) => void;

  readonly formatTimestamp: (iso: string | null) => string;
  readonly accountLabel: (accountId: string | null) => string | null;
  readonly accountIsTestNumber: (accountId: string | null) => boolean;
}
