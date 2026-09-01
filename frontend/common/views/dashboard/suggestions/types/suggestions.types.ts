import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export { SuggestionStatus };

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
