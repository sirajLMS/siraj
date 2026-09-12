import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ApproveWhatsappGroupJoinRequestsMutation,
  ApproveWhatsappGroupJoinRequestsMutationVariables,
  CreateWhatsappGroupMutation,
  CreateWhatsappGroupMutationVariables,
  DeleteWhatsappGroupMutation,
  DeleteWhatsappGroupMutationVariables,
  PinWhatsappGroupMessageMutation,
  PinWhatsappGroupMessageMutationVariables,
  RejectWhatsappGroupJoinRequestsMutation,
  RejectWhatsappGroupJoinRequestsMutationVariables,
  RemoveWhatsappGroupParticipantsMutation,
  RemoveWhatsappGroupParticipantsMutationVariables,
  ResetWhatsappGroupInviteLinkMutation,
  ResetWhatsappGroupInviteLinkMutationVariables,
  SendWhatsappGroupMessageMutation,
  SendWhatsappGroupMessageMutationVariables,
  SyncWhatsappGroupsMutation,
  SyncWhatsappGroupsMutationVariables,
  UnpinWhatsappGroupMessageMutation,
  UnpinWhatsappGroupMessageMutationVariables,
  UpdateWhatsappGroupSettingsMutation,
  UpdateWhatsappGroupSettingsMutationVariables,
  WhatsappGroupInviteLinkMutation,
  WhatsappGroupInviteLinkMutationVariables,
  WhatsappGroupJoinRequestsQuery,
  WhatsappGroupJoinRequestsQueryVariables,
  WhatsappGroupMessagesQuery,
  WhatsappGroupMessagesQueryVariables,
  WhatsappGroupQuery,
  WhatsappGroupQueryVariables,
  WhatsappGroupsQuery,
  WhatsappGroupsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * WhatsApp Groups workspace documents: the paginated groups list, a single
 * group, its paginated message thread, pending join requests, and the
 * management mutations (settings, sync, invite link, join-request approval,
 * participant removal, send, pin/unpin). Every object selection includes
 * `id` for Apollo cache normalization.
 */

const WHATSAPP_GROUP_FIELDS = gql`
  fragment WhatsappGroupFields on WhatsappGroup {
    id
    accountId
    groupJid
    subject
    description
    joinApprovalMode
    inviteLink
    suspended
    totalParticipantCount
    pendingJoinRequestCount
    creationTimestamp
    syncedAt
    createdAt
    updatedAt
  }
`;

const WHATSAPP_GROUP_MESSAGE_FIELDS = gql`
  fragment WhatsappGroupMessageFields on WhatsappGroupMessage {
    id
    groupId
    accountId
    wamid
    direction
    type
    content
    status
    fromWaId
    mediaId
    mediaMime
    pinnedAt
    pinExpiresAt
    sentAt
    createdAt
  }
`;

const WHATSAPP_GROUP_JOIN_REQUEST_FIELDS = gql`
  fragment WhatsappGroupJoinRequestFields on WhatsappGroupJoinRequest {
    id
    joinRequestId
    waId
    creationTimestamp
  }
`;

export const whatsappGroupsQueryDocument: TypedDocumentNode<WhatsappGroupsQuery, WhatsappGroupsQueryVariables> = gql`
  ${WHATSAPP_GROUP_FIELDS}
  query WhatsappGroups($accountId: String, $search: String, $pagination: PaginationArgs) {
    whatsappGroups(accountId: $accountId, search: $search, pagination: $pagination) {
      id
      rows {
        ...WhatsappGroupFields
      }
      totalCount
      pageInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`;

export const whatsappGroupQueryDocument: TypedDocumentNode<WhatsappGroupQuery, WhatsappGroupQueryVariables> = gql`
  ${WHATSAPP_GROUP_FIELDS}
  query WhatsappGroup($groupId: String!) {
    whatsappGroup(groupId: $groupId) {
      ...WhatsappGroupFields
    }
  }
`;

export const whatsappGroupMessagesQueryDocument: TypedDocumentNode<
  WhatsappGroupMessagesQuery,
  WhatsappGroupMessagesQueryVariables
> = gql`
  ${WHATSAPP_GROUP_MESSAGE_FIELDS}
  query WhatsappGroupMessages($groupId: String!, $pagination: PaginationArgs) {
    whatsappGroupMessages(groupId: $groupId, pagination: $pagination) {
      id
      rows {
        ...WhatsappGroupMessageFields
      }
      totalCount
      pageInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`;

export const whatsappGroupJoinRequestsQueryDocument: TypedDocumentNode<
  WhatsappGroupJoinRequestsQuery,
  WhatsappGroupJoinRequestsQueryVariables
> = gql`
  ${WHATSAPP_GROUP_JOIN_REQUEST_FIELDS}
  query WhatsappGroupJoinRequests($groupId: String!) {
    whatsappGroupJoinRequests(groupId: $groupId) {
      ...WhatsappGroupJoinRequestFields
    }
  }
`;

export const createWhatsappGroupMutationDocument: TypedDocumentNode<
  CreateWhatsappGroupMutation,
  CreateWhatsappGroupMutationVariables
> = gql`
  ${WHATSAPP_GROUP_FIELDS}
  mutation CreateWhatsappGroup($input: WhatsappGroupCreateInput!) {
    createWhatsappGroup(input: $input) {
      ...WhatsappGroupFields
    }
  }
`;

export const deleteWhatsappGroupMutationDocument: TypedDocumentNode<
  DeleteWhatsappGroupMutation,
  DeleteWhatsappGroupMutationVariables
> = gql`
  mutation DeleteWhatsappGroup($groupId: String!) {
    deleteWhatsappGroup(groupId: $groupId)
  }
`;

export const updateWhatsappGroupSettingsMutationDocument: TypedDocumentNode<
  UpdateWhatsappGroupSettingsMutation,
  UpdateWhatsappGroupSettingsMutationVariables
> = gql`
  ${WHATSAPP_GROUP_FIELDS}
  mutation UpdateWhatsappGroupSettings($input: WhatsappGroupSettingsUpdateInput!) {
    updateWhatsappGroupSettings(input: $input) {
      ...WhatsappGroupFields
    }
  }
`;

export const syncWhatsappGroupsMutationDocument: TypedDocumentNode<
  SyncWhatsappGroupsMutation,
  SyncWhatsappGroupsMutationVariables
> = gql`
  mutation SyncWhatsappGroups($accountId: String) {
    syncWhatsappGroups(accountId: $accountId)
  }
`;

export const getWhatsappGroupInviteLinkMutationDocument: TypedDocumentNode<
  WhatsappGroupInviteLinkMutation,
  WhatsappGroupInviteLinkMutationVariables
> = gql`
  mutation WhatsappGroupInviteLink($groupId: String!) {
    getWhatsappGroupInviteLink(groupId: $groupId)
  }
`;

export const resetWhatsappGroupInviteLinkMutationDocument: TypedDocumentNode<
  ResetWhatsappGroupInviteLinkMutation,
  ResetWhatsappGroupInviteLinkMutationVariables
> = gql`
  mutation ResetWhatsappGroupInviteLink($groupId: String!) {
    resetWhatsappGroupInviteLink(groupId: $groupId)
  }
`;

export const approveWhatsappGroupJoinRequestsMutationDocument: TypedDocumentNode<
  ApproveWhatsappGroupJoinRequestsMutation,
  ApproveWhatsappGroupJoinRequestsMutationVariables
> = gql`
  mutation ApproveWhatsappGroupJoinRequests($input: WhatsappGroupIdsInput!) {
    approveWhatsappGroupJoinRequests(input: $input) {
      id
      approved
      failed {
        id
        joinRequestId
        errors {
          code
          message
        }
      }
    }
  }
`;

export const rejectWhatsappGroupJoinRequestsMutationDocument: TypedDocumentNode<
  RejectWhatsappGroupJoinRequestsMutation,
  RejectWhatsappGroupJoinRequestsMutationVariables
> = gql`
  mutation RejectWhatsappGroupJoinRequests($input: WhatsappGroupIdsInput!) {
    rejectWhatsappGroupJoinRequests(input: $input) {
      id
      approved
      failed {
        id
        joinRequestId
        errors {
          code
          message
        }
      }
    }
  }
`;

export const removeWhatsappGroupParticipantsMutationDocument: TypedDocumentNode<
  RemoveWhatsappGroupParticipantsMutation,
  RemoveWhatsappGroupParticipantsMutationVariables
> = gql`
  mutation RemoveWhatsappGroupParticipants($input: WhatsappGroupParticipantsInput!) {
    removeWhatsappGroupParticipants(input: $input) {
      id
      removed
      failed {
        id
        input
        errors {
          code
          message
        }
      }
    }
  }
`;

export const sendWhatsappGroupMessageMutationDocument: TypedDocumentNode<
  SendWhatsappGroupMessageMutation,
  SendWhatsappGroupMessageMutationVariables
> = gql`
  mutation SendWhatsappGroupMessage($input: WhatsappGroupSendInput!) {
    sendWhatsappGroupMessage(input: $input) {
      id
      groupId
      providerMessageId
    }
  }
`;

export const pinWhatsappGroupMessageMutationDocument: TypedDocumentNode<
  PinWhatsappGroupMessageMutation,
  PinWhatsappGroupMessageMutationVariables
> = gql`
  mutation PinWhatsappGroupMessage($input: WhatsappGroupPinInput!) {
    pinWhatsappGroupMessage(input: $input)
  }
`;

export const unpinWhatsappGroupMessageMutationDocument: TypedDocumentNode<
  UnpinWhatsappGroupMessageMutation,
  UnpinWhatsappGroupMessageMutationVariables
> = gql`
  mutation UnpinWhatsappGroupMessage($input: WhatsappGroupPinInput!) {
    unpinWhatsappGroupMessage(input: $input)
  }
`;
