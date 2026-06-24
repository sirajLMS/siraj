"use client";

import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/views/dashboard/shared/utils";
import { SuggestionStatus } from "@/shared/lib/enum";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";

interface SuggestionsTabBarProps {
  readonly activeTab: SuggestionStatus;
  readonly pendingCount: number;
  readonly reviewedCount: number;
  readonly labels: SuggestionsAdminLabels;
  readonly onTabChange: (tab: SuggestionStatus) => void;
}

export function SuggestionsTabBar({
  activeTab,
  pendingCount,
  reviewedCount,
  labels,
  onTabChange,
}: Readonly<SuggestionsTabBarProps>) {
  const tabs = [
    { key: SuggestionStatus.PENDING, label: formatAdminQueueTabLabel(labels.tabs.pending, pendingCount) },
    { key: SuggestionStatus.REVIEWED, label: formatAdminQueueTabLabel(labels.tabs.reviewed, reviewedCount) },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
