import type { SxProps, Theme } from "@mui/material";

import type { TeacherAvailabilityInsights } from "@/frontend/common/views/dashboard/teachers/availability/types";

export interface AvailabilityInsightsLayoutProps {
  readonly insights: TeacherAvailabilityInsights;
  readonly layoutSx: SxProps<Theme>;
  readonly peakLoadCard: React.ReactNode;
  readonly availableStaffCard: React.ReactNode;
  readonly timezoneInsightCard: React.ReactNode;
}
