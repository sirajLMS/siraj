import {
  type SearchSuggestionsQuery_searchSuggestions,
  SuggestionStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";

export type {
  AdminSuggestionsQuery_adminSuggestions as AdminSuggestionResult,
  AdminSuggestionsQuery_adminSuggestions_metrics as SuggestionMetrics,
  AdminSuggestionsQuery_adminSuggestions_rows as Suggestion,
  SubmitSuggestionInput,
  SuggestionFilter,
} from "@/frontend/common/graphql/generated/gql/graphql";

export { SuggestionStatus };

export type SearchResult = SearchSuggestionsQuery_searchSuggestions;

export interface AdminSuggestionsSummary {
  readonly pending: number;
  readonly reviewed: number;
  readonly duplicateCount: number;
  readonly avgResponseHours: string;
}

export interface AdminSuggestionRow {
  readonly id: string;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly parentName: string;
  readonly suggestionPreview: string;
  readonly status: SuggestionStatus;
  readonly submittedAt: string;
  readonly adminResponse: string | null;
  readonly duplicateOfBody: string | null;
  readonly duplicateOfSubmitterName: string | null;
  readonly responseCount: number | null;
}
