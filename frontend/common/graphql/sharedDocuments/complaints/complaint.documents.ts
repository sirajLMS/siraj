import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

// ─── Query: parentComplaints ────────────────────────────────────────────────

export const parentComplaintsQueryDocument: TypedDocumentNode<
  Operations.ParentComplaintsQuery,
  Types.QueryParentComplaintsArgs
> = gql`
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
  Operations.AdminComplaintQueueQuery,
  Types.QueryAdminComplaintQueueArgs
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
  Operations.SubmitComplaintMutation,
  Types.MutationSubmitComplaintArgs
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
  Operations.RespondToComplaintMutation,
  Types.MutationRespondToComplaintArgs
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
  Operations.DeleteComplaintMutation,
  Types.MutationDeleteComplaintArgs
> = gql`
  mutation DeleteComplaint($complaintId: String!) {
    deleteComplaint(complaintId: $complaintId)
  }
`;
