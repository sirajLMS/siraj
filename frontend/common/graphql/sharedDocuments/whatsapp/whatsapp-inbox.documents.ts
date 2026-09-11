import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  UpdateWhatsappAccountPurposeMutation,
  UpdateWhatsappAccountPurposeMutationVariables,
  WhatsappConversationMessagesQuery,
  WhatsappConversationMessagesQueryVariables,
  WhatsappConversationsQuery,
  WhatsappConversationsQueryVariables,
  WhatsappSyncStatusQuery,
  WhatsappSyncStatusQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * WhatsApp inbox read surface documents (conversations, threads, sync
 * overview) plus the purpose-assignment mutation. Every object selection
 * includes `id` for Apollo cache normalization.
 */

export const WHATSAPP_CONVERSATION_FIELDS = gql`
  fragment WhatsappConversationFields on WhatsappConversation {
    id
    accountId
    waId
    userId
    username
    displayName
    lastMessageAt
    lastMessagePreview
    accountPurpose
    createdAt
    updatedAt
  }
`;

export const whatsappConversationsQueryDocument: TypedDocumentNode<
  WhatsappConversationsQuery,
  WhatsappConversationsQueryVariables
> = gql`
  ${WHATSAPP_CONVERSATION_FIELDS}
  query WhatsappConversations($accountId: String, $pagination: PaginationArgs) {
    whatsappConversations(accountId: $accountId, pagination: $pagination) {
      id
      rows {
        ...WhatsappConversationFields
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
export const WHATSAPP_MESSAGE_FIELDS = gql`
  fragment WhatsappMessageFields on WhatsappMessage {
    id
    conversationId
    accountId
    wamid
    direction
    type
    content
    status
    mediaPlaceholder
    mediaId
    mediaMime
    mediaSha256
    phase
    chunkOrder
    sentAt
    editedAt
    revokedAt
    createdAt
  }
`;

export const whatsappConversationMessagesQueryDocument: TypedDocumentNode<
  WhatsappConversationMessagesQuery,
  WhatsappConversationMessagesQueryVariables
> = gql`
  ${WHATSAPP_MESSAGE_FIELDS}
  query WhatsappConversationMessages($conversationId: String!, $pagination: PaginationArgs) {
    whatsappConversationMessages(conversationId: $conversationId, pagination: $pagination) {
      id
      rows {
        ...WhatsappMessageFields
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
export const whatsappSyncStatusQueryDocument: TypedDocumentNode<
  WhatsappSyncStatusQuery,
  WhatsappSyncStatusQueryVariables
> = gql`
  query WhatsappSyncStatus($accountId: String!) {
    whatsappSyncStatus(accountId: $accountId) {
      id
      accountId
      syncStatus
      syncPhase
      syncProgress
      syncDeadlineAt
      syncFailureReason
      requests {
        id
        accountId
        syncType
        requestId
        status
        requestedAt
        completedAt
      }
    }
  }
`;

export const updateWhatsappAccountPurposeMutationDocument: TypedDocumentNode<
  UpdateWhatsappAccountPurposeMutation,
  UpdateWhatsappAccountPurposeMutationVariables
> = gql`
  mutation UpdateWhatsappAccountPurpose($accountId: String!, $purpose: WhatsappAccountPurpose!) {
    updateWhatsappAccountPurpose(accountId: $accountId, purpose: $purpose) {
      id
      wabaId
      displayPhoneNumber
      isActive
      purpose
    }
  }
`;
