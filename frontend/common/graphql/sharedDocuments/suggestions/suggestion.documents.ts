import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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
        parentUserId
        submitterName
        body
        status
        adminResponse
        duplicateOfId
        duplicateOfBody
        duplicateOfSubmitterName
        responseCount
        emailSentAt
        createdAt
        parentName
      }
      metrics {
        id
        pending
        reviewed
        duplicate
        avgResponseTime
        totalCount
      }
    }
  }
`;

// ─── Query: searchSuggestions ──────────────────────────────────────────────

export const searchSuggestionsQueryDocument: TypedDocumentNode<
  Operations.SearchSuggestionsQuery,
  Types.QuerySearchSuggestionsArgs
> = gql`
  query SearchSuggestions($query: String!, $excludeId: String!) {
    searchSuggestions(query: $query, excludeId: $excludeId) {
      id
      submitterName
      body
      status
      parentName
      createdAt
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

// ─── Mutation: respondToSuggestion ──────────────────────────────────────────

export const respondToSuggestionMutationDocument: TypedDocumentNode<
  Operations.RespondToSuggestionMutation,
  Types.MutationRespondToSuggestionArgs
> = gql`
  mutation RespondToSuggestion($input: RespondToSuggestionInput!) {
    respondToSuggestion(input: $input) {
      id
      adminResponse
    }
  }
`;

// ─── Mutation: markSuggestionDuplicate ──────────────────────────────────────

export const markSuggestionDuplicateMutationDocument: TypedDocumentNode<
  Operations.MarkSuggestionDuplicateMutation,
  Types.MutationMarkSuggestionDuplicateArgs
> = gql`
  mutation MarkSuggestionDuplicate($input: MarkSuggestionDuplicateInput!) {
    markSuggestionDuplicate(input: $input) {
      id
      duplicateOfId
    }
  }
`;

// ─── Mutation: deleteSuggestion ─────────────────────────────────────────────

export const deleteSuggestionMutationDocument: TypedDocumentNode<
  Operations.DeleteSuggestionMutation,
  Types.MutationDeleteSuggestionArgs
> = gql`
  mutation DeleteSuggestion($suggestionId: String!) {
    deleteSuggestion(suggestionId: $suggestionId)
  }
`;

// ─── Query: suggestionContributorStats ────────────────────────────────────────

export const suggestionContributorStatsQueryDocument: TypedDocumentNode<
  Operations.SuggestionContributorStatsQuery,
  Types.QuerySuggestionContributorStatsArgs
> = gql`
  query SuggestionContributorStats($days: Int!) {
    suggestionContributorStats(days: $days) {
      id
      uniqueContributorCount
      contributors {
        id
        name
        suggestionCount
      }
    }
  }
`;
