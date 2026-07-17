"use client";

import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import type { AdminSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsViewModel";
import { SuggestionsDataGridDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionsDataGrid.desktop";
import { SuggestionsMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionsMetricsRow.desktop";
import { SuggestionsSearchBarDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionsSearchBar.desktop";
import { SuggestionsTabBarDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionsTabBar.desktop";

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

      <SuggestionsMetricsRowDesktop summary={summary} labels={labels} />

      <SectionPanel
        actions={
          <SuggestionsSearchBarDesktop
            value={searchQuery}
            placeholder={labels.searchPlaceholder}
            onChange={onSearchChange}
          />
        }
      >
        <SuggestionsTabBarDesktop
          activeTab={activeTab}
          pendingCount={summary.pending}
          reviewedCount={summary.reviewed}
          duplicateCount={summary.duplicateCount}
          labels={labels}
          onTabChange={onTabChange}
        />
        <SuggestionsDataGridDesktop
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
