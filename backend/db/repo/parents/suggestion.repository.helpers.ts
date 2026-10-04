import { suggestions, users } from "@/backend/db/schema";
import { SuggestionStatus } from "@/backend/enum";

export function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (Object.values(SuggestionStatus) as readonly string[]).includes(value);
}

export const commonSuggestionColumns = {
  parentName: users.name,
  submitterName: suggestions.submitterName,
  body: suggestions.body,
  status: suggestions.status,
  adminResponse: suggestions.adminResponse,
  duplicateOfId: suggestions.duplicateOfId,
  reviewedByUserId: suggestions.reviewedByUserId,
  reviewedAt: suggestions.reviewedAt,
  createdAt: suggestions.createdAt,
};

export type SuggestionInsertInput = {
  parentId: string;
  submitterName: string;
  body: string;
  status: SuggestionStatus;
  adminResponse?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
  createdAt?: Date;
};

/** Normalizes the optional insert fields of a suggestion row to their persisted form. */
export function buildSuggestionInsertValues(input: SuggestionInsertInput, now: Date) {
  return {
    parentId: input.parentId,
    submitterName: input.submitterName,
    body: input.body,
    status: input.status,
    adminResponse: input.adminResponse ?? null,
    reviewedByUserId: input.reviewedByUserId ?? null,
    reviewedAt: input.reviewedAt ?? null,
    createdAt: input.createdAt ?? now,
  };
}
