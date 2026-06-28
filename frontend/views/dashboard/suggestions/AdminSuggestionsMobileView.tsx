"use client";

import { Box } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { SuggestionsCardList } from "./components/SuggestionsCardList";
import { SuggestionsMetricsRow } from "./components/SuggestionsMetricsRow";
import { SuggestionsSearchBar } from "./components/SuggestionsSearchBar";
import { SuggestionsTabBar } from "./components/SuggestionsTabBar";
import type { AdminSuggestionsViewProps } from "./types/suggestionsViewTypes";

export function AdminSuggestionsMobileView({
  labels,
  summary,
  rows,
  searchQuery,
  activeTab,
  canManage,
  canDelete,
  onSearchChange,
  onTabChange,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: Readonly<AdminSuggestionsViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

      <SuggestionsMetricsRow summary={summary} labels={labels} compact />

      <Box sx={{ mb: 2 }}>
        <SuggestionsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
      </Box>

      <SuggestionsTabBar
        activeTab={activeTab}
        pendingCount={summary.pending}
        reviewedCount={summary.reviewed}
        duplicateCount={summary.duplicateCount}
        labels={labels}
        onTabChange={onTabChange}
      />

      <Box sx={{ pt: 2 }}>
        <SuggestionsCardList
          rows={rows}
          labels={labels}
          canManage={canManage}
          canDelete={canDelete}
          onMarkReviewed={onMarkReviewed}
          onRespond={onRespond}
          onMarkDuplicate={onMarkDuplicate}
          onDelete={onDelete}
        />
      </Box>
    </PageContainer>
  );
}
