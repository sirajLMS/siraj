"use client";

import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/views/dashboard/shared/utils";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import type { SuggestionStatus } from "../types/suggestions.types";

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
    { key: "PENDING" as const, label: formatAdminQueueTabLabel(labels.tabs.pending, pendingCount) },
    { key: "REVIEWED" as const, label: formatAdminQueueTabLabel(labels.tabs.reviewed, reviewedCount) },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
