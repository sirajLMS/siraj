import type {
  AdminSuggestionResult,
  SubmitSuggestionInput,
  Suggestion,
  SuggestionFilter,
  SuggestionMetrics,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { SuggestionStatus } from "@/shared/lib/enum";


// Re-export generated GQL types
export type { AdminSuggestionResult, SubmitSuggestionInput, Suggestion, SuggestionFilter, SuggestionMetrics, SuggestionStatus};

export interface AdminSuggestionsSummary {
  readonly pending: number;
  readonly reviewed: number;
  readonly avgResponseHours: string;
}

export interface AdminSuggestionRow {
  readonly id: string;
  readonly parentName: string;
  readonly suggestionPreview: string;
  readonly status: SuggestionStatus;
  readonly submittedAt: string;
}
