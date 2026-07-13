import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const welcomeMessageQueryDocument: TypedDocumentNode<
  Operations.WelcomeMessageQuery,
  Operations.WelcomeMessageQueryVariables
> = gql`
  query welcomeMessage {
    welcomeMessage
  }
`;

export const translatedMessageQueryDocument: TypedDocumentNode<
  Operations.TranslatedMessageQuery,
  Operations.TranslatedMessageQueryVariables
> = gql`
  query translatedMessage($key: String!, $namespace: String!) {
    translatedMessage(key: $key, namespace: $namespace)
  }
`;
