"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Fab, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StatusTrackingCardList } from "./StatusTrackingCardList";
import { StatusTrackingDataGrid } from "./StatusTrackingDataGrid";
import { SuspensionAnalytics, type SuspensionAnalyticsLabels } from "./SuspensionAnalytics";
import type { StatusTrackingRow } from "./types";

// Primary-colored fixed FAB used on mobile to create a new report
const StyledMobileFab = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: 88,
  right: 24,
  bgcolor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  "&:hover": { bgcolor: theme.palette.primary.dark },
}));

// Selected-action pill badge showing the total-sessions count in the section header
const StyledTotalSessionsBadge = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(0.5),
  bgcolor: theme.palette.action.selected,
  borderRadius: 10,
  fontSize: "12px",
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamily,
  fontWeight: 500,
}));

// Primary-colored fixed FAB used on desktop to create a new report (scales on hover/active)
const StyledDesktopFab = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: 32,
  right: 32,
  bgcolor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  "&:hover": {
    bgcolor: theme.palette.primary.dark,
    transform: "scale(1.1)",
  },
  transition: "transform 0.15s ease, background-color 0.15s ease",
  "&:active": { transform: "scale(0.95)" },
}));

export interface StatusTrackingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filters: string;
  readonly newReport: string;
  readonly todaysClassSchedule: string;
  readonly totalSessions: string;
  readonly studentClass: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly status: string;
  readonly actions: string;
  readonly showingOf: string;
  readonly previous: string;
  readonly next: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  // Metric sub-labels
  readonly regularSubLabel: string;
  readonly pendingSubLabel: string;
  readonly suspendedSubLabel: string;
  readonly onLeaveSubLabel: string;
  // Analytics
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly noEntries: string;
  readonly days: readonly string[];
}

interface StatusTrackingViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StatusTrackingRow[];
  readonly totalSessions: number;
  readonly suspendedCount: number;
  readonly labels: StatusTrackingLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly onNewReport: () => void;
}

type CardListLabels = {
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
};

interface MobileLayoutProps extends Omit<StatusTrackingViewProps, "suspendedCount" | "onNewReport"> {
  readonly cardListLabels: CardListLabels;
}

interface DesktopLayoutProps extends StatusTrackingViewProps {
  readonly analyticsLabels: SuspensionAnalyticsLabels;
}

function MobileLayout({
  metrics,
  rows,
  totalSessions,
  labels,
  cardListLabels,
  onActivate,
  onReschedule,
  onVerify,
}: MobileLayoutProps) {
  return (
    <PageContainer>
      <Box sx={{ pb: 10 }}>
        <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

        <MetricCardGrid metrics={metrics} />

        {/* Mobile card list */}
        <StatusTrackingCardList
          rows={rows}
          totalSessions={totalSessions}
          labels={cardListLabels}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />

        {/* Mobile FAB */}
        <StyledMobileFab id="status-fab-btn" aria-label={labels.newReport}>
          <AddOutlined />
        </StyledMobileFab>
      </Box>
    </PageContainer>
  );
}

function DesktopLayout({
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
}: DesktopLayoutProps) {
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
            noEntries: labels.noEntries,
          }}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />
      </SectionPanel>

      <SuspensionAnalytics labels={analyticsLabels} suspendedCount={suspendedCount} />

      {/* Desktop FAB */}
      <StyledDesktopFab id="status-desktop-fab-btn" aria-label={labels.newReport} onClick={onNewReport}>
        <AddOutlined />
      </StyledDesktopFab>
    </PageContainer>
  );
}

export function StatusTrackingView(props: StatusTrackingViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { labels } = props;

  const cardListLabels: CardListLabels = {
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    sessionLocked: labels.sessionLocked,
    seeAll: labels.seeAll,
    todaysSchedule: labels.todaysSchedule,
    regular: labels.regular,
    suspendedPending: labels.suspendedPending,
    onLeave: labels.onLeave,
    pendingVerification: labels.pendingVerification,
  };

  const analyticsLabels: SuspensionAnalyticsLabels = {
    suspensionAnalytics: labels.suspensionAnalytics,
    analyticsNote: labels.analyticsNote,
    urgentTask: labels.urgentTask,
    accountsLocked: labels.accountsLocked,
    auditDescription: labels.auditDescription,
    openAuditLogs: labels.openAuditLogs,
    suspended: labels.suspendedPending,
    days: labels.days,
  };

  if (isMobile) {
    return <MobileLayout {...props} cardListLabels={cardListLabels} />;
  }

  return <DesktopLayout {...props} analyticsLabels={analyticsLabels} />;
}
