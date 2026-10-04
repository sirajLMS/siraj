"use client";

import type { AdminSuggestionRow } from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import type { AdminSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobileEmptyState,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { SuggestionCardItem } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionAdminCard.mobile";
import { SuggestionsMetricsRowMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionsMetricsRow.mobile";
import { SuggestionsSearchBarMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionsSearchBar.mobile";
import { SuggestionsTabBarMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionsTabBar.mobile";

interface SuggestionCardListSectionProps {
  readonly rows: readonly AdminSuggestionRow[];
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly labels: SuggestionsAdminLabels;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function SuggestionCardListSection({
  rows,
  canManage,
  canDelete,
  labels,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: SuggestionCardListSectionProps) {
  if (rows.length === 0) {
    return <MobileEmptyState title={labels.table.noEntries} />;
  }

  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      gap={1.5}
      layout="rounded"
      paginationOptions={{ mode: "client" }}
      renderItem={row => (
        <SuggestionCardItem
          row={row}
          canManage={canManage}
          canDelete={canDelete}
          labels={labels}
          onMarkReviewed={onMarkReviewed}
          onRespond={onRespond}
          onMarkDuplicate={onMarkDuplicate}
          onDelete={onDelete}
        />
      )}
    />
  );
}

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
}: Readonly<AdminSuggestionsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={2} paddingBottom={4}>
        <SuggestionsMetricsRowMobile summary={summary} labels={labels} />

        <SuggestionsSearchBarMobile
          value={searchQuery}
          placeholder={labels.searchPlaceholder}
          onChange={onSearchChange}
        />

        <SuggestionsTabBarMobile
          activeTab={activeTab}
          pendingCount={summary.pending}
          reviewedCount={summary.reviewed}
          duplicateCount={summary.duplicateCount}
          labels={labels}
          onTabChange={onTabChange}
        />

        <SuggestionCardListSection
          rows={rows}
          canManage={canManage}
          canDelete={canDelete}
          labels={labels}
          onMarkReviewed={onMarkReviewed}
          onRespond={onRespond}
          onMarkDuplicate={onMarkDuplicate}
          onDelete={onDelete}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
