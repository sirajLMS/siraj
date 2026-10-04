import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateMeetingProviderMutation,
  CreateMeetingProviderMutationVariables,
  DeleteMeetingProviderMutation,
  DeleteMeetingProviderMutationVariables,
  MeetingProviderQuery,
  MeetingProviderQueryVariables,
  MeetingProvidersQuery,
  MeetingProvidersQueryVariables,
  UpdateMeetingProviderMutation,
  UpdateMeetingProviderMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { MEETING_PROVIDER_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meetingFragments.documents";

export const meetingProvidersQueryDocument: TypedDocumentNode<MeetingProvidersQuery, MeetingProvidersQueryVariables> =
  gql`
  ${MEETING_PROVIDER_FIELDS}
  query meetingProviders($activeOnly: Boolean) {
    meetingProviders(activeOnly: $activeOnly) {
      ...MeetingProviderFields
    }
  }
`;

export const meetingProviderQueryDocument: TypedDocumentNode<MeetingProviderQuery, MeetingProviderQueryVariables> = gql`
  ${MEETING_PROVIDER_FIELDS}
  query meetingProvider($id: ID!) {
    meetingProvider(id: $id) {
      ...MeetingProviderFields
    }
  }
`;

export const createMeetingProviderMutationDocument: TypedDocumentNode<
  CreateMeetingProviderMutation,
  CreateMeetingProviderMutationVariables
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  mutation createMeetingProvider($input: MeetingProviderCreateInput!) {
    createMeetingProvider(input: $input) {
      ...MeetingProviderFields
    }
  }
`;

export const updateMeetingProviderMutationDocument: TypedDocumentNode<
  UpdateMeetingProviderMutation,
  UpdateMeetingProviderMutationVariables
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  mutation updateMeetingProvider($id: ID!, $input: MeetingProviderUpdateInput!) {
    updateMeetingProvider(id: $id, input: $input) {
      ...MeetingProviderFields
    }
  }
`;

export const deleteMeetingProviderMutationDocument: TypedDocumentNode<
  DeleteMeetingProviderMutation,
  DeleteMeetingProviderMutationVariables
> = gql`
  mutation deleteMeetingProvider($id: ID!) {
    deleteMeetingProvider(id: $id)
  }
`;
