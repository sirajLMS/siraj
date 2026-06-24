"use client";

import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/views/dashboard/shared/utils";
import type { ComplaintsAdminLabels } from "@/shared/messages/types/dashboard/complaints/main";
import { type ComplaintTab, ComplaintStatus } from "../types/complaints.types";

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
    { key: ComplaintStatus.Unanswered, label: formatAdminQueueTabLabel(labels.tabs.unanswered, unansweredCount) },
    { key: ComplaintStatus.Answered, label: formatAdminQueueTabLabel(labels.tabs.answered, answeredCount) },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
