"use client";

import {
  ComplaintStatus,
  type ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { type AdminQueueTab, AdminQueueTabBar } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/common/views/dashboard/shared/utils";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintsTabBarDesktopProps {
  readonly activeTab: ComplaintTab;
  readonly unansweredCount: number;
  readonly answeredCount: number;
  readonly labels: ComplaintsAdminLabels;
  readonly onTabChange: (tab: ComplaintTab) => void;
}

export function ComplaintsTabBarDesktop({
  activeTab,
  unansweredCount,
  answeredCount,
  labels,
  onTabChange,
}: Readonly<ComplaintsTabBarDesktopProps>) {
  const tabs: readonly AdminQueueTab<ComplaintTab>[] = [
    {
      key: ComplaintStatus.Unanswered,
      label: formatAdminQueueTabLabel(labels.tabs.unanswered, unansweredCount),
    },
    {
      key: ComplaintStatus.Answered,
      label: formatAdminQueueTabLabel(labels.tabs.answered, answeredCount),
    },
  ];

  return <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={onTabChange} />;
}
