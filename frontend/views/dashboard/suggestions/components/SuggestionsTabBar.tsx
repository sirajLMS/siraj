"use client";

import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/views/dashboard/shared/utils";
import type { SuggestionsTabBarProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionsTabBar({
  activeTab,
  pendingCount,
  reviewedCount,
  duplicateCount,
  labels,
  onTabChange,
}: Readonly<SuggestionsTabBarProps>) {
  const tabs = [
    { key: SuggestionStatus.Pending, label: formatAdminQueueTabLabel(labels.tabs.pending, pendingCount) },
    { key: SuggestionStatus.Reviewed, label: formatAdminQueueTabLabel(labels.tabs.reviewed, reviewedCount) },
    { key: SuggestionStatus.Duplicate, label: formatAdminQueueTabLabel(labels.tabs.duplicate, duplicateCount) },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
