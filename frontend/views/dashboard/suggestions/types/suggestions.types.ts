import { SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export type {
  AdminSuggestionResult,
  SubmitSuggestionInput,
  Suggestion,
  SuggestionFilter,
  SuggestionMetrics,
} from "@/frontend/graphql/generated/gql/graphql-types";

export { SuggestionStatus };

export type SearchResult = Operations.SearchSuggestionsQuery_searchSuggestions_SuggestionSearchResult;

export type { AdminSuggestionsState } from "@/frontend/stores/adminSuggestionsStore";

export interface AdminSuggestionsSummary {
  readonly pending: number;
  readonly reviewed: number;
  readonly duplicateCount: number;
  readonly avgResponseHours: string;
}

export interface AdminSuggestionRow {
  readonly id: string;
  readonly parentId: string | null;
  readonly parentName: string;
  readonly suggestionPreview: string;
  readonly status: SuggestionStatus;
  readonly submittedAt: string;
  readonly adminResponse: string | null;
  readonly duplicateOfBody: string | null;
  readonly duplicateOfSubmitterName: string | null;
  readonly responseCount: number | null;
}
