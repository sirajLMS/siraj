import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  MarkNotificationReadMutation,
  MarkNotificationReadMutationVariables,
  MarkNotificationsReadMutation,
  NotificationAlertsQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const notificationAlertsQueryDocument: TypedDocumentNode<NotificationAlertsQuery> = gql`
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

export const markNotificationsReadMutationDocument: TypedDocumentNode<MarkNotificationsReadMutation> = gql`
  mutation MarkNotificationsRead {
    markNotificationsRead
  }
`;

export const markNotificationReadMutationDocument: TypedDocumentNode<
  MarkNotificationReadMutation,
  MarkNotificationReadMutationVariables
> = gql`
  mutation MarkNotificationRead($deliveryId: ID!) {
    markNotificationRead(deliveryId: $deliveryId)
  }
`;
