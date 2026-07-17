"use client";

import { Box, Button } from "@mui/material";
import {
  ComplaintStatus,
  type ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { AdminQueueTab } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import { formatAdminQueueTabLabel } from "@/frontend/common/views/dashboard/shared/utils";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintsTabBarMobileProps {
  readonly activeTab: ComplaintTab;
  readonly unansweredCount: number;
  readonly answeredCount: number;
  readonly labels: ComplaintsAdminLabels;
  readonly onTabChange: (tab: ComplaintTab) => void;
}

export function ComplaintsTabBarMobile({
  activeTab,
  unansweredCount,
  answeredCount,
  labels,
  onTabChange,
}: Readonly<ComplaintsTabBarMobileProps>) {
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

  return (
    <Box
      sx={theme => ({
        display: "flex",
        gap: 1,
        overflowX: "auto",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        pb: 0.5,
        WebkitOverflowScrolling: "touch",
      })}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <Button
            key={tab.key}
            onClick={() => {
              onTabChange(tab.key);
            }}
            sx={theme => ({
              px: 2,
              py: 1,
              borderRadius: 999,
              flexShrink: 0,
              backgroundColor: isActive ? theme.palette.primary.main : "transparent",
              color: isActive ? theme.palette.onPrimary : theme.palette.text.secondary,
              fontWeight: 700,
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              border: isActive ? "none" : `1px solid ${theme.palette.outlineVariant}`,
            })}
          >
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}
