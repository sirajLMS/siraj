import { Box, Typography } from "@mui/material";
import type {
  AcademicClassRow,
  AlertsMetric,
  ScheduleAlert,
  ScheduleAlertsLabels,
} from "@/frontend/common/views/dashboard/schedule/alerts/types";

export interface ScheduleAlertsViewSharedProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: ScheduleAlertsLabels;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly loading?: boolean;
  readonly onDownloadReport: () => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
}

export interface ScheduleAlertsBodyCommonProps<TLabels> {
  readonly loading: boolean | undefined;
  readonly labels: ScheduleAlertsLabels;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly contentLabels: TLabels;
}

export function ScheduleAlertsLoadingIndicator({ loading }: { readonly loading: string }) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        color: theme.palette.text.secondary,
      })}
    >
      <Typography variant="bodyLg">{loading}</Typography>
    </Box>
  );
}
