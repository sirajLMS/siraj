import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const notificationPreferencesQueryDocument: TypedDocumentNode<Operations.NotificationPreferencesQuery> = gql`
  query NotificationPreferences {
    notificationPreferences {
      id
      channel
      eventType
      enabled
    }
  }
`;

export const updateNotificationPreferencesMutationDocument: TypedDocumentNode<
  Operations.UpdateNotificationPreferencesMutation,
  Types.MutationUpdateNotificationPreferencesArgs
> = gql`
  mutation UpdateNotificationPreferences($input: [NotificationPreferenceInput!]!) {
    updateNotificationPreferences(input: $input) {
      id
      channel
      eventType
      enabled
    }
  }
`;
