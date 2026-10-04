import type {
  WhatsappGroupFieldsFragment,
  WhatsappGroupJoinApprovalMode,
  WhatsappGroupJoinRequestFieldsFragment,
  WhatsappGroupMessageFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappGroupsLabelsBySection } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsLabels.types";
import type { CommonLabels } from "@/shared/locale/types/common";

export type {
  WhatsappGroupsCreateLabels,
  WhatsappGroupsDetailLabels,
  WhatsappGroupsListLabels,
  WhatsappGroupsMessagesLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsLabels.types";

/** Group row with a non-null id after Apollo normalization. */
export type WhatsappGroupRow = WhatsappGroupFieldsFragment & { readonly id: string };

/** Group message row with a non-null id after Apollo normalization. */
export type WhatsappGroupMessageRow = WhatsappGroupMessageFieldsFragment & { readonly id: string };

/** Join-request row with a non-null id after Apollo normalization. */
export type WhatsappGroupJoinRequestRow = WhatsappGroupJoinRequestFieldsFragment & { readonly id: string };

/** One entry of the connected-numbers pool; the create action needs an owner. */
export interface WhatsappGroupsAccountOption {
  readonly id: string;
  readonly label: string;
  readonly isActive: boolean;
}

/**
 * View model for the `/whatsapp` groups workspace. Tier views render from this
 * shape only; handlers and state stay flat, copy is grouped under
 * `labelsBySection`. Dialog chrome (cancel) comes from the shared common
 * namespace via `commonLabels`.
 */
export interface WhatsappGroupsViewModel {
  readonly labelsBySection: WhatsappGroupsLabelsBySection;
  readonly commonLabels: Pick<CommonLabels, "cancel">;
  readonly canManage: boolean;

  readonly accounts: readonly WhatsappGroupsAccountOption[];
  readonly accountsLoading: boolean;
  readonly accountId: string | null;
  readonly accountLabel: (accountId: string | null) => string | null;

  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly groups: readonly WhatsappGroupRow[];
  readonly groupsLoading: boolean;
  readonly groupsError: boolean;
  readonly groupsPage: number;
  readonly groupsPageSize: number;
  readonly groupsTotalCount: number;
  readonly onGroupsPageChange: (page: number) => void;
  readonly onRetryGroups: () => void;

  readonly selectedGroupId: string | null;
  readonly onSelectGroup: (groupId: string) => void;
  readonly onCloseGroup: () => void;
  readonly selectedGroup: WhatsappGroupRow | null;
  readonly selectedGroupLoading: boolean;
  readonly selectedGroupError: boolean;
  readonly selectedGroupApprovalModeLabel: string;
  readonly onRefreshGroup: () => void;

  readonly inviteLink: string | null;
  readonly copied: boolean;
  readonly onCopyInviteLink: () => void;
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly onAskResetInviteLink: () => void;
  readonly onCloseReset: () => void;
  readonly onConfirmResetInviteLink: () => void;

  readonly groupMessages: readonly WhatsappGroupMessageRow[];
  readonly messagesLoading: boolean;
  readonly messagesError: boolean;
  readonly messageDraft: string;
  readonly onMessageDraftChange: (value: string) => void;
  readonly sendDisabled: boolean;
  readonly sending: boolean;
  readonly messageError: string | null;
  readonly onSendMessage: () => void;
  readonly onPinMessage: (messageId: string) => void;
  readonly onUnpinMessage: (messageId: string) => void;
  readonly pinningMessageId: string | null;

  readonly joinRequests: readonly WhatsappGroupJoinRequestRow[];
  readonly joinRequestsLoading: boolean;
  readonly joinRequestsError: boolean;
  readonly joinRequestBusyId: string | null;
  readonly onApproveJoinRequest: (requestId: string) => void;
  readonly onRejectJoinRequest: (requestId: string) => void;

  readonly removeParticipantWaId: string;
  readonly onRemoveParticipantWaIdChange: (value: string) => void;
  readonly removeParticipantValid: boolean;
  readonly removeParticipantOpen: boolean;
  readonly removingParticipant: boolean;
  readonly onAskRemoveParticipant: () => void;
  readonly onCloseRemoveParticipant: () => void;
  readonly onConfirmRemoveParticipant: () => void;

  readonly createOpen: boolean;
  readonly onOpenCreate: () => void;
  readonly onCloseCreate: () => void;
  readonly createSubject: string;
  readonly onCreateSubjectChange: (value: string) => void;
  readonly createDescription: string;
  readonly onCreateDescriptionChange: (value: string) => void;
  readonly createApprovalMode: WhatsappGroupJoinApprovalMode;
  readonly onCreateApprovalModeChange: (mode: WhatsappGroupJoinApprovalMode) => void;
  readonly createSubmitDisabled: boolean;
  readonly creating: boolean;
  readonly createError: string | null;
  readonly onSubmitCreate: () => void;

  readonly syncing: boolean;
  readonly onSyncGroups: () => void;

  readonly deleteOpen: boolean;
  readonly deleting: boolean;
  readonly onAskDeleteGroup: () => void;
  readonly onCloseDelete: () => void;
  readonly onConfirmDeleteGroup: () => void;

  readonly notice: string | null;
  readonly noticeSeverity: "success" | "error";
  readonly onDismissNotice: () => void;

  readonly formatTimestamp: (iso: string | null) => string;
}
