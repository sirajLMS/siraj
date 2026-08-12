import { SearchOutlined } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import type * as React from "react";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { ScheduleOverviewLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/scheduleOverview.types";

export const SharedSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

export interface ScheduleOverviewFilterSectionProps
  extends Pick<ScheduleOverviewViewModel, "dateValue" | "onDateChange"> {
  readonly filters: ScheduleOverviewLabelsBySection["filters"];
  readonly teacherSelect: React.ReactNode;
}

export function buildScheduleOverviewPageCount(totalCount: number | undefined, pageSize: number): number {
  if (totalCount === undefined) return 0;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
