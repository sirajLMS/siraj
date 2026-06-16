"use client";

import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { SuggestionsDataGrid } from "./components/SuggestionsDataGrid";
import { SuggestionsMetricsRow } from "./components/SuggestionsMetricsRow";
import { SuggestionsSearchBar } from "./components/SuggestionsSearchBar";
import { SuggestionsTabBar } from "./components/SuggestionsTabBar";
import type { AdminSuggestionsViewProps } from "./types/suggestionsViewTypes";

export function AdminSuggestionsDesktopView({
  labels,
  summary,
  rows,
  searchQuery,
  activeTab,
  canManage,
  onSearchChange,
  onTabChange,
  onMarkReviewed,
}: Readonly<AdminSuggestionsViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <SuggestionsMetricsRow summary={summary} labels={labels} />

      <SectionPanel
        actions={
          <SuggestionsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
        }
      >
        <SuggestionsTabBar
          activeTab={activeTab}
          pendingCount={summary.pending}
          reviewedCount={summary.reviewed}
          labels={labels}
          onTabChange={onTabChange}
        />
        <SuggestionsDataGrid rows={rows} labels={labels} canManage={canManage} onMarkReviewed={onMarkReviewed} />
      </SectionPanel>
    </PageContainer>
  );
}
