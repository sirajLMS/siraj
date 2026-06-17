"use client";

import { FileDownloadOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { ExportButton, FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { TrackingRow } from "@/frontend/stores/mockRescheduleTrackingStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { RescheduleTrackingCardList } from "./RescheduleTrackingCardList";
import { RescheduleTrackingDataGrid } from "./RescheduleTrackingDataGrid";

interface RescheduleTrackingViewLabels {
  readonly pageTitle: string;
  readonly sectionTitle: string;
  readonly exportData: string;
  readonly filter: string;
  readonly teacherName: string;
  readonly studentClass: string;
  readonly scheduledDate: string;
  readonly timeSlot: string;
  readonly classStatus: string;
  readonly action: string;
  readonly newDate: string;
  readonly leaveRequest: string;
  readonly rescheduled: string;
  readonly pendingLeave: string;
  readonly viewDetails: string;
  readonly approveLeave: string;
  readonly rejectLeave: string;
  readonly showingOf: string;
  readonly noEntries: string;
}

interface RescheduleTrackingViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly TrackingRow[];
  readonly totalItems: number; //NoSonar
  readonly labels: RescheduleTrackingViewLabels;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly onExport: () => void;
}

export function RescheduleTrackingView({
  metrics,
  rows,
  labels,
  onApprove,
  onReject,
  onView,
  onExport,
}: RescheduleTrackingViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const tableHeaders = {
    teacherName: labels.teacherName,
    studentClass: labels.studentClass,
    scheduledDate: labels.scheduledDate,
    timeSlot: labels.timeSlot,
    classStatus: labels.classStatus,
    action: labels.action,
  };

  const tableLabels = {
    newDate: labels.newDate,
    leaveRequest: labels.leaveRequest,
    rescheduled: labels.rescheduled,
    pendingLeave: labels.pendingLeave,
    viewDetails: labels.viewDetails,
    approveLeave: labels.approveLeave,
    rejectLeave: labels.rejectLeave,
    noEntries: labels.noEntries,
  };

  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} />

      <MetricCardGrid metrics={metrics} size={{ md: 4, lg: "grow" }} />

      <SectionPanel
        title={labels.sectionTitle}
        actions={
          isMobile ? (
            <FilterButton id="tracking-filter-btn" startIcon={<FilterListOutlined />} size="small">
              {labels.filter}
            </FilterButton>
          ) : (
            <ExportButton id="tracking-export-btn" startIcon={<FileDownloadOutlined />} onClick={onExport}>
              {labels.exportData}
            </ExportButton>
          )
        }
      >
        {isMobile ? (
          <Box sx={{ p: 2 }}>
            <RescheduleTrackingCardList rows={rows} labels={tableLabels} onView={onView} />
          </Box>
        ) : (
          <RescheduleTrackingDataGrid
            rows={rows}
            headers={tableHeaders}
            labels={tableLabels}
            onApprove={onApprove}
            onReject={onReject}
            onView={onView}
          />
        )}
      </SectionPanel>
    </PageContainer>
  );
}
