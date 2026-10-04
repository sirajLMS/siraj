import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

type WhatsappGroupsShellLabels = Pick<
  WhatsappGroupsLabels,
  "title" | "subtitle" | "noAccountsState" | "createGroup" | "syncGroups" | "permissionDenied"
>;

export type WhatsappGroupsListLabels = Pick<
  WhatsappGroupsLabels,
  | "listTitle"
  | "listSubtitle"
  | "searchPlaceholder"
  | "emptyState"
  | "pendingBadge"
  | "createdAtLabel"
  | "suspendedBadge"
  | "activeBadge"
  | "refresh"
  | "errorGeneric"
>;

export type WhatsappGroupsCreateLabels = Pick<
  WhatsappGroupsLabels,
  | "createGroup"
  | "createGroupTitle"
  | "createGroupDescription"
  | "subjectLabel"
  | "subjectPlaceholder"
  | "descriptionLabel"
  | "descriptionPlaceholder"
  | "approvalModeLabel"
  | "approvalModeAuto"
  | "approvalModeRequired"
>;

export type WhatsappGroupsDetailLabels = Pick<
  WhatsappGroupsLabels,
  | "inviteLinkTitle"
  | "inviteLinkEmpty"
  | "copyInviteLink"
  | "copied"
  | "resetInviteLink"
  | "resetInviteLinkConfirm"
  | "resetInviteLinkWarning"
  | "joinRequestsTitle"
  | "joinRequestsEmpty"
  | "approveRequest"
  | "rejectRequest"
  | "participantsTitle"
  | "participantsEmpty"
  | "removeParticipant"
  | "removeParticipantConfirm"
  | "deleteGroup"
  | "deleteGroupConfirm"
  | "deleteGroupWarning"
  | "createdAtLabel"
  | "lastSyncedAtLabel"
  | "suspendedBadge"
  | "activeBadge"
  | "refresh"
  | "errorGeneric"
>;

export type WhatsappGroupsMessagesLabels = Pick<
  WhatsappGroupsLabels,
  | "messagesTitle"
  | "messagesEmpty"
  | "messagePlaceholder"
  | "send"
  | "sending"
  | "pin"
  | "unpin"
  | "pinned"
  | "refresh"
  | "errorGeneric"
>;

export interface WhatsappGroupsLabelsBySection {
  readonly shell: WhatsappGroupsShellLabels;
  readonly list: WhatsappGroupsListLabels;
  readonly create: WhatsappGroupsCreateLabels;
  readonly detail: WhatsappGroupsDetailLabels;
  readonly messages: WhatsappGroupsMessagesLabels;
}
