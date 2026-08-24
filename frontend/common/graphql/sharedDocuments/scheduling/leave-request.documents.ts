import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  MyLeaveRequestsQuery,
  MyLeaveRequestsQueryVariables,
  RequestSessionCancelMutation,
  RequestSessionCancelMutationVariables,
  RequestSessionDelayMutation,
  RequestSessionDelayMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Query: myLeaveRequests ─────────────────────────────────────────────────

export const myLeaveRequestsQueryDocument: TypedDocumentNode<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables> = gql`
  query MyLeaveRequests {
    myLeaveRequests {
      id
      classInstanceId
      requestedByUserId
      requesterType
      requestType
      proposedStartAt
      reason
      status
      createdAt
      processedAt
      processedByUserId
    }
  }
`;

// ─── Mutation: requestSessionDelay ──────────────────────────────────────────

export const requestSessionDelayMutationDocument: TypedDocumentNode<
  RequestSessionDelayMutation,
  RequestSessionDelayMutationVariables
> = gql`
  mutation RequestSessionDelay($input: RequestSessionDelayInput!) {
    requestSessionDelay(input: $input) {
      id
      classInstanceId
      requesterType
      requestType
      proposedStartAt
      reason
      status
      createdAt
    }
  }
`;

// ─── Mutation: requestSessionCancel ──────────────────────────────────────────

export const requestSessionCancelMutationDocument: TypedDocumentNode<
  RequestSessionCancelMutation,
  RequestSessionCancelMutationVariables
> = gql`
  mutation RequestSessionCancel($input: RequestSessionCancelInput!) {
    requestSessionCancel(input: $input) {
      id
      classInstanceId
      requesterType
      requestType
      reason
      status
      createdAt
    }
  }
`;
