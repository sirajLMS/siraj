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

// NOTE (specs.md S7 task F2): the canonical
// `Operations.MarkNotificationsReadMutation` type is produced by GraphQL
// Code Generator from the `markNotificationsRead` Pothos mutation
// registered in
// `backend/graphql/mutation/notifications/mark-notifications-read.mutation.ts`.
// Wave 2 runs `bun run generate:gqlSchema && bun codegen` to refresh
// `operations.ts`. Until then, `Operations.MarkNotificationsReadMutation`
// does not exist — that is a NON-BLOCKING CROSS-FILE DEPENDENCY on the
// codegen step. We use a temporary local type mirroring the codegen output
// shape so this file compiles without blocking Wave 1 on the codegen cycle.
// NOTIFICATION-SPEC: codegen-pending — replace with
// `Operations.MarkNotificationsReadMutation` after Wave 2 regenerates
// `operations.ts` (tracked in §11 report).
interface MarkNotificationsReadMutationShape {
  markNotificationsRead: number | null;
}

export const markNotificationsReadMutationDocument: TypedDocumentNode<MarkNotificationsReadMutationShape> = gql`
  mutation MarkNotificationsRead {
    markNotificationsRead
  }
`;
