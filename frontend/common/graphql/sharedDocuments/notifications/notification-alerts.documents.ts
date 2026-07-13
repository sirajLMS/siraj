import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const notificationAlertsQueryDocument: TypedDocumentNode<Operations.NotificationAlertsQuery> = gql`
  query notificationAlerts {
    notificationAlerts {
      id
      totalCount
      unreadCount
      alerts {
        id
        type
        title
        body
        createdAt
        severity
      }
    }
  }
`;
