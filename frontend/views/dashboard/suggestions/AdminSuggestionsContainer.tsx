"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useAdminSuggestionsStore } from "@/frontend/stores/adminSuggestionsStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { AdminSuggestionsView } from "./AdminSuggestionsView";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";
import { filterSuggestionsByTab } from "./utils/suggestionFilters";

export function AdminSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const permissions = useUserStore(state => state.permissions);

  const summary = useAdminSuggestionsStore(state => state.summary);
  const rows = useAdminSuggestionsStore(state => state.rows);
  const searchQuery = useAdminSuggestionsStore(state => state.searchQuery);
  const activeTab = useAdminSuggestionsStore(state => state.activeTab);
  const setSearchQuery = useAdminSuggestionsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminSuggestionsStore(state => state.setActiveTab);
  const markReviewed = useAdminSuggestionsStore(state => state.markReviewed);

  const canManage = permissions.includes("suggestions-manage");

  const filteredRows = useMemo(
    () => filterSuggestionsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  if (!canManage) {
    return null;
  }

  const labels = buildSuggestionsLabels(t);

  return (
    <AdminSuggestionsView
      labels={labels.admin}
      summary={summary}
      rows={filteredRows}
      searchQuery={searchQuery}
      activeTab={activeTab}
      canManage={canManage}
      onSearchChange={setSearchQuery}
      onTabChange={setActiveTab}
      onMarkReviewed={markReviewed}
    />
  );
}
