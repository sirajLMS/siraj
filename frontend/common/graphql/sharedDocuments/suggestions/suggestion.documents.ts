import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdminSuggestionsQuery,
  AdminSuggestionsQueryVariables,
  DeleteSuggestionMutation,
  DeleteSuggestionMutationVariables,
  MarkSuggestionDuplicateMutation,
  MarkSuggestionDuplicateMutationVariables,
  MarkSuggestionReviewedMutation,
  MarkSuggestionReviewedMutationVariables,
  RespondToSuggestionMutation,
  RespondToSuggestionMutationVariables,
  SubmitSuggestionMutation,
  SubmitSuggestionMutationVariables,
  SuggestionContributorStatsQuery,
  SuggestionContributorStatsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Query: adminSuggestions ────────────────────────────────────────────────

export const adminSuggestionsQueryDocument: TypedDocumentNode<AdminSuggestionsQuery, AdminSuggestionsQueryVariables> =
  gql`
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

// ─── Mutation: submitSuggestion ─────────────────────────────────────────────

export const submitSuggestionMutationDocument: TypedDocumentNode<
  SubmitSuggestionMutation,
  SubmitSuggestionMutationVariables
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
  MarkSuggestionReviewedMutation,
  MarkSuggestionReviewedMutationVariables
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
  RespondToSuggestionMutation,
  RespondToSuggestionMutationVariables
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
  MarkSuggestionDuplicateMutation,
  MarkSuggestionDuplicateMutationVariables
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
  DeleteSuggestionMutation,
  DeleteSuggestionMutationVariables
> = gql`
  mutation DeleteSuggestion($suggestionId: String!) {
    deleteSuggestion(suggestionId: $suggestionId)
  }
`;

// ─── Query: suggestionContributorStats ────────────────────────────────────────

export const suggestionContributorStatsQueryDocument: TypedDocumentNode<
  SuggestionContributorStatsQuery,
  SuggestionContributorStatsQueryVariables
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
