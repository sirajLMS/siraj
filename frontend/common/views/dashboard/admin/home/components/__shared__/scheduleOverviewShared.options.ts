import type * as React from "react";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { ScheduleOverviewLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/scheduleOverview.types";

export interface ScheduleOverviewFilterSectionProps
  extends Pick<ScheduleOverviewViewModel, "dateValue" | "onDateChange"> {
  readonly filters: ScheduleOverviewLabelsBySection["filters"];
  readonly teacherSelect: React.ReactNode;
}
