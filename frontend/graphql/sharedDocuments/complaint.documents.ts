import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Query: parentComplaints ────────────────────────────────────────────────

export const parentComplaintsQueryDocument: TypedDocumentNode<Operations.ParentComplaintsQuery> = gql`
  query ParentComplaints {
    parentComplaints {
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
  }
`;

// ─── Query: adminComplaintQueue ─────────────────────────────────────────────

export const adminComplaintQueueQueryDocument: TypedDocumentNode<
  Operations.AdminComplaintQueueQuery,
  Types.QueryAdminComplaintQueueArgs
> = gql`
  query AdminComplaintQueue($filter: ComplaintQueueFilter!) {
    adminComplaintQueue(filter: $filter) {
      id
      rows {
        id
        parentId
        studentId
        category
        submitterEmail
        body
        status
        createdAt
        parentName
        studentName
      }
      metrics {
        id
        unanswered
        answered
        avgResolutionTime
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
