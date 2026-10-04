import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

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
