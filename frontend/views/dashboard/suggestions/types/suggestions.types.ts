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

export interface AdminSuggestionsSummary {
  readonly pending: number;
  readonly reviewed: number;
  readonly duplicateCount: number;
  readonly avgResponseHours: string;
}

export interface AdminSuggestionRow {
  readonly id: string;
  readonly parentName: string;
  readonly suggestionPreview: string;
  readonly status: SuggestionStatus;
  readonly submittedAt: string;
  readonly adminResponse: string | null;
  readonly duplicateOfBody: string | null;
  readonly duplicateOfSubmitterName: string | null;
  readonly responseCount: number | null;
}

export interface AdminSuggestionsState {
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly markingReviewedId: string;
  readonly isMarkingReviewed: boolean;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  readonly deleteDialogOpen: boolean;
  readonly deletingId: string;
  readonly isDeleting: boolean;
  readonly duplicateDialogOpen: boolean;
  readonly markingDuplicateId: string;
  readonly isMarkingDuplicate: boolean;
  readonly respondDialogOpen: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionStatus) => void;
  setMarkingReviewedId: (id: string) => void;
  setIsMarkingReviewed: (value: boolean) => void;
  resetMarkingReviewed: () => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  setIsDeleting: (value: boolean) => void;
  openDuplicateDialog: (id: string) => void;
  closeDuplicateDialog: () => void;
  setMarkingDuplicateId: (id: string) => void;
  setIsMarkingDuplicate: (value: boolean) => void;
  resetMarkingDuplicate: () => void;
  openRespondDialog: (id: string) => void;
  closeRespondDialog: () => void;
}
