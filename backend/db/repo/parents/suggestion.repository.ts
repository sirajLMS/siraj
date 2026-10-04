import {
  deleteByParentIdImpl,
  insertManySuggestionsImpl,
  insertSuggestionImpl,
  markAsDuplicateImpl,
  markSuggestionReviewedImpl,
  respondToSuggestionImpl,
  submitSuggestionImpl,
} from "@/backend/db/repo/parents/suggestion.repository.commands";
import {
  getContributorStatsImpl,
  getSuggestionMetricsImpl,
} from "@/backend/db/repo/parents/suggestion.repository.metrics";
import {
  getAdminSuggestionQueueImpl,
  getSuggestionByIdImpl,
  getSuggestionsByParentImpl,
  type SuggestionDetailRow as SuggestionDetailRowImpl,
  searchSuggestionsImpl,
} from "@/backend/db/repo/parents/suggestion.repository.queries";

export namespace SuggestionRepository {
  export type SuggestionDetailRow = SuggestionDetailRowImpl;

  export const insertSuggestion = insertSuggestionImpl;
  export const insertManySuggestions = insertManySuggestionsImpl;
  export const submitSuggestion = submitSuggestionImpl;
  export const getSuggestionsByParent = getSuggestionsByParentImpl;
  export const getAdminSuggestionQueue = getAdminSuggestionQueueImpl;
  export const getSuggestionById = getSuggestionByIdImpl;
  export const markSuggestionReviewed = markSuggestionReviewedImpl;
  export const respondToSuggestion = respondToSuggestionImpl;
  export const markAsDuplicate = markAsDuplicateImpl;
  export const searchSuggestions = searchSuggestionsImpl;
  export const getSuggestionMetrics = getSuggestionMetricsImpl;
  export const getContributorStats = getContributorStatsImpl;
  export const deleteByParentId = deleteByParentIdImpl;
}
