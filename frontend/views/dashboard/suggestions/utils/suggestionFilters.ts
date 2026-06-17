import type { AdminSuggestionRow, SuggestionTab } from "@/frontend/stores/mockAdminSuggestionsStore";

export function filterSuggestionsByTab(
  rows: readonly AdminSuggestionRow[],
  activeTab: SuggestionTab,
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
