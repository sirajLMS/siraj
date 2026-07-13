"use client";

import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { SuggestionsDataGrid } from "@/frontend/views/dashboard/suggestions/components/SuggestionsDataGrid";
import { SuggestionsMetricsRow } from "@/frontend/views/dashboard/suggestions/components/SuggestionsMetricsRow";
import { SuggestionsSearchBar } from "@/frontend/views/dashboard/suggestions/components/SuggestionsSearchBar";
import { SuggestionsTabBar } from "@/frontend/views/dashboard/suggestions/components/SuggestionsTabBar";
import type { AdminSuggestionsViewModel } from "@/frontend/views/dashboard/suggestions/useAdminSuggestionsViewModel";

export function AdminSuggestionsDesktopView({
  labels,
  summary,
  rows,
  searchQuery,
  loading,
  activeTab,
  canManage,
  canDelete,
  onSearchChange,
  onTabChange,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: Readonly<AdminSuggestionsViewModel>) {
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
          duplicateCount={summary.duplicateCount}
          labels={labels}
          onTabChange={onTabChange}
        />
        <SuggestionsDataGrid
          rows={rows}
          labels={labels}
          canManage={canManage}
          canDelete={canDelete}
          onMarkReviewed={onMarkReviewed}
          onRespond={onRespond}
          onMarkDuplicate={onMarkDuplicate}
          onDelete={onDelete}
          loading={loading}
        />
      </SectionPanel>
    </PageContainer>
  );
}
