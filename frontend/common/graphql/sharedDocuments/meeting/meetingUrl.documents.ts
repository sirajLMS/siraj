import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ConnectMeetingProviderOAuthMutation,
  ConnectMeetingProviderOAuthMutationVariables,
  DisconnectMeetingProviderOAuthMutation,
  DisconnectMeetingProviderOAuthMutationVariables,
  GenerateMeetingUrlMutation,
  GenerateMeetingUrlMutationVariables,
  MyConnectedMeetingProvidersQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const EFFECTIVE_MEETING_FIELDS = gql`
  fragment EffectiveMeetingFields on EffectiveMeeting {
    id
    joinUrl
    providerSlug
    providerName
    logoUrl
    meetingId
    source
    configId
    providerId
    supportsAutoGeneration
  }
`;

export const generateMeetingUrlMutationDocument: TypedDocumentNode<
  GenerateMeetingUrlMutation,
  GenerateMeetingUrlMutationVariables
> = gql`
  mutation generateMeetingUrl($input: GenerateMeetingUrlInput!) {
    generateMeetingUrl(input: $input) {
      joinUrl
      meetingId
      expiresAt
    }
  }
`;

export const connectMeetingProviderOAuthMutationDocument: TypedDocumentNode<
  ConnectMeetingProviderOAuthMutation,
  ConnectMeetingProviderOAuthMutationVariables
> = gql`
  mutation connectMeetingProviderOAuth($input: ConnectMeetingProviderOAuthInput!) {
    connectMeetingProviderOAuth(input: $input) {
      id
      authorizeUrl
      state
    }
  }
`;

export const disconnectMeetingProviderOAuthMutationDocument: TypedDocumentNode<
  DisconnectMeetingProviderOAuthMutation,
  DisconnectMeetingProviderOAuthMutationVariables
> = gql`
  mutation disconnectMeetingProviderOAuth($input: DisconnectMeetingProviderOAuthInput!) {
    disconnectMeetingProviderOAuth(input: $input) {
      id
      ok
      providerSlug
    }
  }
`;

export const myConnectedMeetingProvidersQueryDocument: TypedDocumentNode<MyConnectedMeetingProvidersQuery> = gql`
  query myConnectedMeetingProviders {
    myConnectedMeetingProviders {
      id
      providerSlug
      email
      connectedAt
      expiresAt
    }
  }
`;
