import type { suggestions } from "@/backend/db/schema";
import type { SuggestionStatus } from "@/backend/enum";
export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type SuggestionReturnType = Omit<SuggestionSelectType, "deletedAt"> & {
  status: SuggestionStatus;
  parentName?: string | null;
  parentUserId?: string | null;
  reviewedByUserName?: string | null;
  duplicateOfBody?: string | null;
  duplicateOfSubmitterName?: string | null;
  responseCount?: number | null;
};

export type SuggestionSubmitInput = Omit<
  SuggestionInsertType,
  | "status"
  | "createdAt"
  | "deletedAt"
  | "reviewedAt"
  | "reviewedByUserId"
  | "duplicateOfId"
  | "parentId"
  | "adminResponse"
  | "emailSentAt"
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
  avgResponseTime: string | null;
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

export type SuggestionSearchResultType = {
  id: string;
  parentId: string;
  submitterName: string;
  body: string;
  status: SuggestionStatus;
  createdAt: Date;
  parentName: string;
};

export type SuggestionContributor = {
  readonly id: string;
  readonly name: string;
  readonly suggestionCount: number;
};

export type SuggestionContributorStats = {
  readonly id: string;
  readonly uniqueContributorCount: number;
  readonly contributors: ReadonlyArray<SuggestionContributor>;
};
