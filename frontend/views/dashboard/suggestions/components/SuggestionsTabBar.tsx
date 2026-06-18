"use client";

import type { SuggestionTab } from "@/frontend/stores/mockAdminSuggestionsStore";
import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/views/dashboard/shared/utils";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";

interface SuggestionsTabBarProps {
  readonly activeTab: SuggestionTab;
  readonly pendingCount: number;
  readonly reviewedCount: number;
  readonly labels: SuggestionsAdminLabels;
  readonly onTabChange: (tab: SuggestionTab) => void;
}

export function SuggestionsTabBar({
  activeTab,
  pendingCount,
  reviewedCount,
  labels,
  onTabChange,
}: Readonly<SuggestionsTabBarProps>) {
  const tabs = [
    { key: "pending" as const, label: formatAdminQueueTabLabel(labels.tabs.pending, pendingCount) },
    { key: "reviewed" as const, label: formatAdminQueueTabLabel(labels.tabs.reviewed, reviewedCount) },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
