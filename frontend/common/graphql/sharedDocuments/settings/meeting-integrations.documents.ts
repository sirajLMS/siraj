import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdminRevokeMeetingProviderTokenMutation,
  AdminRevokeMeetingProviderTokenMutationVariables,
  MeetingIntegrationConnectedAccountsQuery,
  MeetingIntegrationConnectedAccountsQueryVariables,
  MeetingIntegrationProviderFieldsFragment,
  MeetingIntegrationProvidersQuery,
  TestMeetingProviderConnectionMutation,
  TestMeetingProviderConnectionMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const MEETING_INTEGRATION_PROVIDER_FIELDS: TypedDocumentNode<MeetingIntegrationProviderFieldsFragment> = gql`
  fragment MeetingIntegrationProviderFields on MeetingIntegrationProvider {
    id
    slug
    kind
    credentialsHealthy
    lastTestedAt
    connectedTeacherCount
    reauthNeededCount
    endpoints
  }
`;

const MEETING_INTEGRATION_CONNECTED_ACCOUNT_FIELDS = gql`
  fragment MeetingIntegrationConnectedAccountFields on MeetingIntegrationConnectedAccount {
    id
    userId
    name
    email
    connectedAt
    expiresAt
    lastRefreshedAt
    status
    scopes
  }
`;

const TEST_MEETING_CONNECTION_RESULT_FIELDS = gql`
  fragment TestMeetingConnectionResultFields on TestMeetingConnectionResult {
    id
    ok
    latencyMs
    mode
    testJoinUrl
    deleted
    upstreamResponseSummary
    errorCode
    errorMessage
    rawUpstreamPayload
    requiredScopes
    grantedScopes
  }
`;

const ADMIN_REVOKE_TOKEN_RESULT_FIELDS = gql`
  fragment AdminRevokeTokenResultFields on AdminRevokeTokenResult {
    id
    providerSlug
    userId
    revoked
  }
`;

export const meetingIntegrationProvidersQueryDocument: TypedDocumentNode<MeetingIntegrationProvidersQuery> = gql`
  ${MEETING_INTEGRATION_PROVIDER_FIELDS}
  query meetingIntegrationProviders {
    meetingIntegrationProviders {
      ...MeetingIntegrationProviderFields
    }
  }
`;

export const meetingIntegrationConnectedAccountsQueryDocument: TypedDocumentNode<
  MeetingIntegrationConnectedAccountsQuery,
  MeetingIntegrationConnectedAccountsQueryVariables
> = gql`
  ${MEETING_INTEGRATION_CONNECTED_ACCOUNT_FIELDS}
  query meetingIntegrationConnectedAccounts($providerSlug: String!) {
    meetingIntegrationConnectedAccounts(providerSlug: $providerSlug) {
      ...MeetingIntegrationConnectedAccountFields
    }
  }
`;

export const testMeetingProviderConnectionMutationDocument: TypedDocumentNode<
  TestMeetingProviderConnectionMutation,
  TestMeetingProviderConnectionMutationVariables
> = gql`
  ${TEST_MEETING_CONNECTION_RESULT_FIELDS}
  mutation testMeetingProviderConnection($input: TestMeetingConnectionInput!) {
    testMeetingProviderConnection(input: $input) {
      ...TestMeetingConnectionResultFields
    }
  }
`;

export const adminRevokeMeetingProviderTokenMutationDocument: TypedDocumentNode<
  AdminRevokeMeetingProviderTokenMutation,
  AdminRevokeMeetingProviderTokenMutationVariables
> = gql`
  ${ADMIN_REVOKE_TOKEN_RESULT_FIELDS}
  mutation adminRevokeMeetingProviderToken($input: AdminRevokeTokenInput!) {
    adminRevokeMeetingProviderToken(input: $input) {
      ...AdminRevokeTokenResultFields
    }
  }
`;
