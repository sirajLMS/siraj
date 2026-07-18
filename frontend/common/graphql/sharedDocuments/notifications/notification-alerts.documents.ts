import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const notificationAlertsQueryDocument: TypedDocumentNode<Operations.NotificationAlertsQuery> = gql`
  query notificationAlerts {
    notificationAlerts {
      id
      totalCount
      unreadCount
      alerts {
        id
        deliveryId
        type
        eventType
        channel
        metadata
        title
        body
        createdAt
        severity
        readAt
      }
    }
  }
`;

export const markNotificationsReadMutationDocument: TypedDocumentNode<Operations.MarkNotificationsReadMutation> = gql`
  mutation MarkNotificationsRead {
    markNotificationsRead
  }
`;

export const markNotificationReadMutationDocument: TypedDocumentNode<
  Operations.MarkNotificationReadMutation,
  Types.MutationMarkNotificationReadArgs
> = gql`
  mutation MarkNotificationRead($deliveryId: ID!) {
    markNotificationRead(deliveryId: $deliveryId)
  }
`;
