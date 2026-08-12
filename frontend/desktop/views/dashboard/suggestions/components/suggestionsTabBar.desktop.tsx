"use client";

import { SuggestionsTabBarShared } from "@/frontend/common/views/dashboard/suggestions/components/__shared__/suggestionsTabBarShared";
import type { SuggestionsTabBarProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionsTabBarDesktop({
  activeTab,
  pendingCount,
  reviewedCount,
  duplicateCount,
  labels,
  onTabChange,
}: Readonly<SuggestionsTabBarProps>) {
  return (
    <SuggestionsTabBarShared
      activeTab={activeTab}
      pendingCount={pendingCount}
      reviewedCount={reviewedCount}
      duplicateCount={duplicateCount}
      labels={labels}
      onTabChange={onTabChange}
    />
  );
}
