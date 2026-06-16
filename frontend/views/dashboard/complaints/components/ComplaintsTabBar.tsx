"use client";

import type { ComplaintTab } from "@/frontend/stores/adminComplaintsStore";
import { AdminQueueTabBar, formatAdminQueueTabLabel } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import type { ComplaintsAdminLabels } from "@/shared/messages/types/dashboard/complaints/main";

interface ComplaintsTabBarProps {
  readonly activeTab: ComplaintTab;
  readonly unansweredCount: number;
  readonly answeredCount: number;
  readonly labels: ComplaintsAdminLabels;
  readonly onTabChange: (tab: ComplaintTab) => void;
}

export function ComplaintsTabBar({
  activeTab,
  unansweredCount,
  answeredCount,
  labels,
  onTabChange,
}: Readonly<ComplaintsTabBarProps>) {
  const tabs = [
    { key: "unanswered" as const, label: formatAdminQueueTabLabel(labels.tabs.unanswered, unansweredCount) },
    { key: "answered" as const, label: formatAdminQueueTabLabel(labels.tabs.answered, answeredCount) },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
