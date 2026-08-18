"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { DesktopLayoutProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import {
  DesktopMetricCardGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter";
import { SuspensionAnalytics } from "@/frontend/desktop/views/dashboard/classes/status/tracking/components/suspensionAnalytics.desktop";
import { StatusTrackingDataGridDesktop } from "@/frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop";

const StyledTotalSessionsBadge = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(0.5),
  backgroundColor: theme.palette.action.selected,
  borderRadius: theme.shape.borderRadius,
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
  transition: theme.transitions.create(["transform", "background-color"], { duration: 150, easing: "ease" }),
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
  labelsBySection,
  dateValue,
  onDateChange,
  onActivate,
  onReschedule,
  onVerify,
  onNewReport,
  onOpenAuditLogs,
}: Readonly<DesktopLayoutProps>) {
  const { shell, filters, columns, analytics } = labelsBySection;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.pageTitle}
        subtitle={shell.pageSubtitle}
        actions={
          <DesktopPrimaryPageAction id="status-new-report-btn" startIcon={<AddOutlined />} onClick={onNewReport}>
            {shell.newReport}
          </DesktopPrimaryPageAction>
        }
      />

      <Box sx={{ mb: 3 }}>
        <DateNavigatorDesktop
          dateValue={dateValue}
          todayLabel={filters.dateFilter.today}
          previousDayLabel={filters.dateFilter.previousDay}
          nextDayLabel={filters.dateFilter.nextDay}
          dateLabel={filters.dateFilter.dateLabel}
          onDateChange={onDateChange}
        />
      </Box>

      <DesktopMetricCardGrid metrics={metrics} size={{ md: 6, lg: "grow" }} />

      <DesktopSectionPanel
        contentPadding={false}
        title={shell.todaysClassSchedule}
        actions={<StyledTotalSessionsBadge>{shell.totalSessions(totalSessions)}</StyledTotalSessionsBadge>}
      >
        <StatusTrackingDataGridDesktop
          rows={rows}
          labels={columns}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />
      </DesktopSectionPanel>

      <SuspensionAnalytics labels={analytics} suspendedCount={suspendedCount} onOpenAuditLogs={onOpenAuditLogs} />

      <StyledDesktopFab id="status-desktop-fab-btn" aria-label={shell.newReport} onClick={onNewReport}>
        <AddOutlined />
      </StyledDesktopFab>
    </DesktopPageContainer>
  );
}
