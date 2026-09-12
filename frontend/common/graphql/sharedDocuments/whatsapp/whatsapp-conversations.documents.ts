import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AddWhatsappTestRecipientMutation,
  AddWhatsappTestRecipientMutationVariables,
  RemoveWhatsappTestRecipientMutation,
  RemoveWhatsappTestRecipientMutationVariables,
  SendWhatsappConversationMessageMutation,
  SendWhatsappConversationMessageMutationVariables,
  VerifyWhatsappTestRecipientMutation,
  VerifyWhatsappTestRecipientMutationVariables,
  WhatsappAccountTemplatesQuery,
  WhatsappAccountTemplatesQueryVariables,
  WhatsappConversationsListQuery,
  WhatsappConversationsListQueryVariables,
  WhatsappConversationThreadQuery,
  WhatsappConversationThreadQueryVariables,
  WhatsappTestRecipientsQuery,
  WhatsappTestRecipientsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  WHATSAPP_CONVERSATION_FIELDS,
  WHATSAPP_MESSAGE_FIELDS,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-inbox.documents";

/**
 * WhatsApp Conversations workspace documents: the per-account conversations
 * list, a single conversation thread with its paginated messages, the
 * test-recipient registry, and the send/verify mutations. Every object
 * selection includes `id` for Apollo cache normalization.
 */

const WHATSAPP_CONVERSATION_THREAD_FIELDS = gql`
  fragment WhatsappConversationThreadFields on WhatsappConversationThread {
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

const WHATSAPP_TEST_RECIPIENT_FIELDS = gql`
  fragment WhatsappTestRecipientFields on WhatsappTestRecipient {
    id
    accountId
    phoneNumber
    status
    note
    lastCheckedAt
    lastErrorCode
    createdAt
    updatedAt
  }
`;

export const whatsappConversationsListQueryDocument: TypedDocumentNode<
  WhatsappConversationsListQuery,
  WhatsappConversationsListQueryVariables
> = gql`
  ${WHATSAPP_CONVERSATION_FIELDS}
  query WhatsappConversationsList($accountId: String, $pagination: PaginationArgs) {
    whatsappConversationThreads(accountId: $accountId, pagination: $pagination) {
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

export const whatsappConversationThreadQueryDocument: TypedDocumentNode<
  WhatsappConversationThreadQuery,
  WhatsappConversationThreadQueryVariables
> = gql`
  ${WHATSAPP_CONVERSATION_THREAD_FIELDS}
  ${WHATSAPP_MESSAGE_FIELDS}
  query WhatsappConversationThread($id: String!, $pagination: PaginationArgs) {
    whatsappConversationThread(id: $id, pagination: $pagination) {
      ...WhatsappConversationThreadFields
      messages {
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
  }
`;

export const whatsappTestRecipientsQueryDocument: TypedDocumentNode<
  WhatsappTestRecipientsQuery,
  WhatsappTestRecipientsQueryVariables
> = gql`
  ${WHATSAPP_TEST_RECIPIENT_FIELDS}
  query WhatsappTestRecipients($accountId: String!) {
    whatsappTestRecipients(accountId: $accountId) {
      ...WhatsappTestRecipientFields
    }
  }
`;

export const whatsappAccountTemplatesQueryDocument: TypedDocumentNode<
  WhatsappAccountTemplatesQuery,
  WhatsappAccountTemplatesQueryVariables
> = gql`
  query WhatsappAccountTemplates($accountId: String!) {
    whatsappAccountTemplates(accountId: $accountId) {
      id
      name
      language
      status
      category
      bodyText
      bodyParamsCount
      lastSyncedAt
    }
  }
`;

export const sendWhatsappConversationMessageMutationDocument: TypedDocumentNode<
  SendWhatsappConversationMessageMutation,
  SendWhatsappConversationMessageMutationVariables
> = gql`
  ${WHATSAPP_MESSAGE_FIELDS}
  mutation SendWhatsappConversationMessage($input: WhatsappConversationSendInput!) {
    sendWhatsappConversationMessage(input: $input) {
      id
      message {
        ...WhatsappMessageFields
      }
    }
  }
`;

export const addWhatsappTestRecipientMutationDocument: TypedDocumentNode<
  AddWhatsappTestRecipientMutation,
  AddWhatsappTestRecipientMutationVariables
> = gql`
  ${WHATSAPP_TEST_RECIPIENT_FIELDS}
  mutation AddWhatsappTestRecipient($input: WhatsappTestRecipientAddInput!) {
    addWhatsappTestRecipient(input: $input) {
      ...WhatsappTestRecipientFields
    }
  }
`;

export const removeWhatsappTestRecipientMutationDocument: TypedDocumentNode<
  RemoveWhatsappTestRecipientMutation,
  RemoveWhatsappTestRecipientMutationVariables
> = gql`
  mutation RemoveWhatsappTestRecipient($recipientId: String!) {
    removeWhatsappTestRecipient(recipientId: $recipientId)
  }
`;

export const verifyWhatsappTestRecipientMutationDocument: TypedDocumentNode<
  VerifyWhatsappTestRecipientMutation,
  VerifyWhatsappTestRecipientMutationVariables
> = gql`
  ${WHATSAPP_TEST_RECIPIENT_FIELDS}
  mutation VerifyWhatsappTestRecipient($recipientId: String!) {
    verifyWhatsappTestRecipient(recipientId: $recipientId) {
      ...WhatsappTestRecipientFields
    }
  }
`;
