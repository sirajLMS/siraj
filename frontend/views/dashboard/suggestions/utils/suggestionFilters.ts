import type {
  AdminSuggestionRow,
  SuggestionStatus,
} from "@/frontend/views/dashboard/suggestions/types/suggestions.types";

export function filterSuggestionsByTab(
  rows: readonly AdminSuggestionRow[],
  activeTab: SuggestionStatus,
  searchQuery: string
): AdminSuggestionRow[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rows.filter(row => {
    if (row.status !== activeTab) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return (
      row.parentName.toLowerCase().includes(normalizedQuery) ||
      row.suggestionPreview.toLowerCase().includes(normalizedQuery)
    );
  });
}
