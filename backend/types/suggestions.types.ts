import type { suggestions } from "@/backend/db/schema";

export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type SubmitSuggestionInputType = Pick<SuggestionInsertType, "submitterName" | "body">;

export type AdminSuggestionResultType = {
  suggestions: ReadonlyArray<SuggestionSelectType>;
  totalCount: number;
  pendingCount: number;
  reviewedCount: number;
};

export type AdminSuggestionOptions = {
  readonly limit: number;
  readonly offset: number;
  readonly status?: string | null;
  readonly search?: string | null;
};
