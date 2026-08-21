import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdminComplaintQueueQuery,
  AdminComplaintQueueQueryVariables,
  DeleteComplaintMutation,
  DeleteComplaintMutationVariables,
  ParentComplaintsQuery,
  ParentComplaintsQueryVariables,
  RespondToComplaintMutation,
  RespondToComplaintMutationVariables,
  SubmitComplaintMutation,
  SubmitComplaintMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Query: parentComplaints ────────────────────────────────────────────────

export const parentComplaintsQueryDocument: TypedDocumentNode<ParentComplaintsQuery, ParentComplaintsQueryVariables> =
  gql`
  query ParentComplaints($paginationArgs: PaginationArgs) {
    parentComplaints(paginationArgs: $paginationArgs) {
      id
      complaints {
        id
        category
        body
        status
        createdAt
        studentName
        responses {
          id
          body
          emailSent
          createdAt
          responderName
        }
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

// ─── Query: adminComplaintQueue ─────────────────────────────────────────────

export const adminComplaintQueueQueryDocument: TypedDocumentNode<
  AdminComplaintQueueQuery,
  AdminComplaintQueueQueryVariables
> = gql`
  query AdminComplaintQueue($filter: ComplaintQueueFilter!, $paginationArgs: PaginationArgs) {
    adminComplaintQueue(filter: $filter, paginationArgs: $paginationArgs) {
      id
      rows {
        id
        category
        body
        status
        createdAt
        parentName
        parentAvatarUrl
        studentName
        responses {
          id
          body
          createdAt
          responderName
          emailSent
        }
      }
      metrics {
        id
        unanswered
        answered
        avgResolutionTime
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

// ─── Mutation: submitComplaint ──────────────────────────────────────────────

export const submitComplaintMutationDocument: TypedDocumentNode<
  SubmitComplaintMutation,
  SubmitComplaintMutationVariables
> = gql`
  mutation SubmitComplaint($input: ComplaintSubmitInput!) {
    submitComplaint(input: $input) {
      id
      category
      body
      status
      createdAt
    }
  }
`;

// ─── Mutation: respondToComplaint ───────────────────────────────────────────

export const respondToComplaintMutationDocument: TypedDocumentNode<
  RespondToComplaintMutation,
  RespondToComplaintMutationVariables
> = gql`
  mutation RespondToComplaint($input: RespondToComplaintInput!) {
    respondToComplaint(input: $input) {
      id
      body
      emailSent
      createdAt
      responderName
    }
  }
`;

// ─── Mutation: deleteComplaint ──────────────────────────────────────────────

export const deleteComplaintMutationDocument: TypedDocumentNode<
  DeleteComplaintMutation,
  DeleteComplaintMutationVariables
> = gql`
  mutation DeleteComplaint($complaintId: String!) {
    deleteComplaint(complaintId: $complaintId)
  }
`;
