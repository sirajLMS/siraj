export type SuggestionStatus = "pending" | "reviewed";

export type SuggestionTab = "pending" | "reviewed";

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
