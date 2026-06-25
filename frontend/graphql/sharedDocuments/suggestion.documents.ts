import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Query: adminSuggestions ────────────────────────────────────────────────

export const adminSuggestionsQueryDocument: TypedDocumentNode<
  Operations.AdminSuggestionsQuery,
  Types.QueryAdminSuggestionsArgs
> = gql`
  query AdminSuggestions($filter: SuggestionFilter!) {
    adminSuggestions(filter: $filter) {
      id
      rows {
        id
        parentId
        submitterName
        body
        status
        emailSentAt
        createdAt
        parentName
      }
      metrics {
        id
        pending
        reviewed
        avgResponseTime
        totalCount
      }
    }
  }
`;

// ─── Mutation: submitSuggestion ─────────────────────────────────────────────

export const submitSuggestionMutationDocument: TypedDocumentNode<
  Operations.SubmitSuggestionMutation,
  Types.MutationSubmitSuggestionArgs
> = gql`
  mutation SubmitSuggestion($input: SubmitSuggestionInput!) {
    submitSuggestion(input: $input) {
      id
      submitterName
      body
      createdAt
    }
  }
`;

// ─── Mutation: markSuggestionReviewed ───────────────────────────────────────

export const markSuggestionReviewedMutationDocument: TypedDocumentNode<
  Operations.MarkSuggestionReviewedMutation,
  Types.MutationMarkSuggestionReviewedArgs
> = gql`
  mutation MarkSuggestionReviewed($suggestionId: String!) {
    markSuggestionReviewed(suggestionId: $suggestionId) {
      id
      emailSentAt
    }
  }
`;
