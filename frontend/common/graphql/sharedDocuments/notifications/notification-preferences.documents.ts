import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  NotificationPreferencesQuery,
  UpdateNotificationPreferencesMutation,
  UpdateNotificationPreferencesMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const notificationPreferencesQueryDocument: TypedDocumentNode<NotificationPreferencesQuery> = gql`
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
  UpdateNotificationPreferencesMutation,
  UpdateNotificationPreferencesMutationVariables
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
