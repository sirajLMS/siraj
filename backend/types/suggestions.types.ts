import type { suggestions } from "@/backend/db/schema";
import type { SuggestionStatus } from "@/shared/lib/enum";

export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type SuggestionReturnType = Omit<SuggestionSelectType, "deletedAt"> & {
  status: SuggestionStatus;
  parentName?: string | null;
  reviewedByUserName?: string | null;
  duplicateOfBody?: string | null;
  duplicateOfSubmitterName?: string | null;
  responseCount?: number | null;
};

export type SuggestionSubmitInput = Omit<
  SuggestionInsertType,
  "status" | "createdAt" | "deletedAt" | "reviewedAt" | "reviewedByUserId" | "duplicateOfId"
>;

export type SuggestionQueueFilter = {
  search?: string | null;
  status?: SuggestionStatus | null;
  limit: number;
  offset: number;
};

export type SuggestionMetrics = {
  id: string;
  pending: number;
  reviewed: number;
  duplicate: number;
  totalCount: number;
};

export type SuggestionQueueResult = {
  id: string;
  suggestions: ReadonlyArray<SuggestionReturnType>;
  metrics: SuggestionMetrics;
};

export type DuplicateSuggestionInput = {
  readonly suggestionId: string;
  readonly duplicateOfId: string;
};

export type RespondToSuggestionInput = {
  readonly suggestionId: string;
  readonly adminResponse: string;
};

export type ParentSuggestionOptions = {
  readonly limit: number;
  readonly offset: number;
};

export type SubmitSuggestionInputType = {
  readonly submitterName: string;
  readonly body: string;
};
