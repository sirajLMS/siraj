import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  TranslatedMessageQuery,
  TranslatedMessageQueryVariables,
  WelcomeMessageQuery,
  WelcomeMessageQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const welcomeMessageQueryDocument: TypedDocumentNode<WelcomeMessageQuery, WelcomeMessageQueryVariables> = gql`
  query welcomeMessage {
    welcomeMessage
  }
`;

export const translatedMessageQueryDocument: TypedDocumentNode<
  TranslatedMessageQuery,
  TranslatedMessageQueryVariables
> = gql`
  query translatedMessage($key: String!, $namespace: String!) {
    translatedMessage(key: $key, namespace: $namespace)
  }
`;
