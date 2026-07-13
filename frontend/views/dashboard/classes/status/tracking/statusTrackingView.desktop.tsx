"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { StatusTrackingDataGrid } from "@/frontend/views/dashboard/classes/status/tracking/StatusTrackingDataGrid";
import { SuspensionAnalytics } from "@/frontend/views/dashboard/classes/status/tracking/SuspensionAnalytics";
import type { DesktopLayoutProps } from "@/frontend/views/dashboard/classes/status/tracking/types";

const StyledTotalSessionsBadge = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(0.5),
  backgroundColor: theme.palette.action.selected,
  borderRadius: 10,
  fontSize: theme.typography.labelMd.fontSize,
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamily,
  fontWeight: 500,
}));

const StyledDesktopFab = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: 32,
  right: 32,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "scale(1.1)",
  },
  transition: "transform 0.15s ease, background-color 0.15s ease",
  "&:active": { transform: "scale(0.95)" },
}));

/**
 * Desktop variant of the Status Tracking dashboard view.
 *
 * Tier-specific presentation component — receives a fully-resolved view model
 * via props. Must NEVER import `useMediaQuery` or `useViewport` (viewport tier
 * is decided by the parent switcher `StatusTrackingView.tsx`).
 */
export function StatusTrackingDesktopView({
  metrics,
  rows,
  totalSessions,
  suspendedCount,
  labels,
  analyticsLabels,
  onActivate,
  onReschedule,
  onVerify,
  onNewReport,
  onOpenAuditLogs,
}: Readonly<DesktopLayoutProps>) {
  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <>
            <FilterButton id="status-filters-btn" startIcon={<FilterListOutlined />}>
              {labels.filters}
            </FilterButton>
            <PrimaryPageAction id="status-new-report-btn" startIcon={<AddOutlined />} onClick={onNewReport}>
              {labels.newReport}
            </PrimaryPageAction>
          </>
        }
      />

      <MetricCardGrid metrics={metrics} size={{ md: 6, lg: "grow" }} />

      <SectionPanel
        title={labels.todaysClassSchedule}
        actions={
          <StyledTotalSessionsBadge>
            {labels.totalSessions.replace("{total}", String(totalSessions))}
          </StyledTotalSessionsBadge>
        }
      >
        <StatusTrackingDataGrid
          rows={rows}
          labels={{
            studentClass: labels.studentClass,
            teacher: labels.teacher,
            schedule: labels.schedule,
            status: labels.status,
            actions: labels.actions,
            joinSession: labels.joinSession,
            activate: labels.activate,
            reschedule: labels.reschedule,
            verifyDocuments: labels.verifyDocuments,
            administrativeHold: labels.administrativeHold,
            holdDescription: labels.holdDescription,
            regular: labels.regular,
            suspendedPending: labels.suspendedPending,
            onLeave: labels.onLeave,
            pendingVerification: labels.pendingVerification,
            sessionEnded: labels.sessionEnded,
            noEntries: labels.noEntries,
          }}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />
      </SectionPanel>

      <SuspensionAnalytics labels={analyticsLabels} suspendedCount={suspendedCount} onOpenAuditLogs={onOpenAuditLogs} />

      <StyledDesktopFab id="status-desktop-fab-btn" aria-label={labels.newReport} onClick={onNewReport}>
        <AddOutlined />
      </StyledDesktopFab>
    </PageContainer>
  );
}
