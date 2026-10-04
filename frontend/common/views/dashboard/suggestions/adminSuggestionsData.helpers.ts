import {
  type AdminSuggestionsQuery_adminSuggestions_metrics,
  type AdminSuggestionsQuery_adminSuggestions_rows,
  SuggestionStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
} from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";

export function buildAdminSuggestionsSummary(
  metrics: AdminSuggestionsQuery_adminSuggestions_metrics | null | undefined
): AdminSuggestionsSummary {
  return {
    pending: metrics?.pending ?? 0,
    reviewed: metrics?.reviewed ?? 0,
    duplicateCount: metrics?.duplicate ?? 0,
    avgResponseHours: metrics?.avgResponseTime ?? "0.0 Hours",
  };
}

export function mapAdminSuggestionRows(
  rows: AdminSuggestionsQuery_adminSuggestions_rows[] | null | undefined
): readonly AdminSuggestionRow[] {
  if (!rows) return [];
  return rows.map(row => ({
    id: row.id ?? "",
    parentId: row.parentId ?? null,
    parentUserId: row.parentUserId ?? null,
    parentName: row.parentName ?? "",
    suggestionPreview: row.body ?? "",
    status: row.status ?? SuggestionStatus.Pending,
    submittedAt: row.createdAt ?? "",
    adminResponse: row.adminResponse ?? null,
    duplicateOfBody: row.duplicateOfBody ?? null,
    duplicateOfSubmitterName: row.duplicateOfSubmitterName ?? null,
    responseCount: row.responseCount ?? null,
  }));
}
