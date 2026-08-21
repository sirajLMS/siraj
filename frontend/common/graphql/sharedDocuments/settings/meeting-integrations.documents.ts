import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdminRevokeMeetingProviderTokenMutation,
  AdminRevokeMeetingProviderTokenMutationVariables,
  MeetingIntegrationConnectedAccountsQuery,
  MeetingIntegrationConnectedAccountsQueryVariables,
  MeetingIntegrationProvidersQuery,
  TestMeetingProviderConnectionMutation,
  TestMeetingProviderConnectionMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const MEETING_INTEGRATION_PROVIDER_FIELDS = gql`
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

export const meetingIntegrationProvidersQueryDocument = gql`
  ${MEETING_INTEGRATION_PROVIDER_FIELDS}
  query meetingIntegrationProviders {
    meetingIntegrationProviders {
      ...MeetingIntegrationProviderFields
    }
  }
` as TypedDocumentNode<MeetingIntegrationProvidersQuery>;

export const meetingIntegrationConnectedAccountsQueryDocument = gql`
  ${MEETING_INTEGRATION_CONNECTED_ACCOUNT_FIELDS}
  query meetingIntegrationConnectedAccounts($providerSlug: String!) {
    meetingIntegrationConnectedAccounts(providerSlug: $providerSlug) {
      ...MeetingIntegrationConnectedAccountFields
    }
  }
` as TypedDocumentNode<MeetingIntegrationConnectedAccountsQuery, MeetingIntegrationConnectedAccountsQueryVariables>;

export const testMeetingProviderConnectionMutationDocument = gql`
  ${TEST_MEETING_CONNECTION_RESULT_FIELDS}
  mutation testMeetingProviderConnection($input: TestMeetingConnectionInput!) {
    testMeetingProviderConnection(input: $input) {
      ...TestMeetingConnectionResultFields
    }
  }
` as TypedDocumentNode<TestMeetingProviderConnectionMutation, TestMeetingProviderConnectionMutationVariables>;

export const adminRevokeMeetingProviderTokenMutationDocument = gql`
  ${ADMIN_REVOKE_TOKEN_RESULT_FIELDS}
  mutation adminRevokeMeetingProviderToken($input: AdminRevokeTokenInput!) {
    adminRevokeMeetingProviderToken(input: $input) {
      ...AdminRevokeTokenResultFields
    }
  }
` as TypedDocumentNode<AdminRevokeMeetingProviderTokenMutation, AdminRevokeMeetingProviderTokenMutationVariables>;
