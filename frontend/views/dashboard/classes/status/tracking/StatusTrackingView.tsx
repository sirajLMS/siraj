"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Fab, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { StatusTrackingCardList } from "./StatusTrackingCardList";
import { StatusTrackingDataGrid } from "./StatusTrackingDataGrid";
import { SuspensionAnalytics } from "./SuspensionAnalytics";
import type {
  CardListLabels,
  DesktopLayoutProps,
  MobileLayoutProps,
  StatusTrackingViewProps,
  SuspensionAnalyticsLabels,
} from "./types";

const StyledMobileFab = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: 88,
  right: 24,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
}));

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

function MobileLayout({
  metrics,
  rows,
  totalSessions,
  labels,
  cardListLabels,
  onActivate,
  onVerify,
  onJoin,
  onNewReport,
  onSeeAll,
}: MobileLayoutProps) {
  return (
    <PageContainer>
      <Box sx={{ pb: 10 }}>
        <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

        <MetricCardGrid metrics={metrics} />

        <StatusTrackingCardList
          rows={rows}
          totalSessions={totalSessions}
          labels={cardListLabels}
          onActivate={onActivate}
          onVerify={onVerify}
          onJoin={onJoin}
          onSeeAll={onSeeAll}
        />

        <StyledMobileFab id="status-fab-btn" aria-label={labels.newReport} onClick={onNewReport}>
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
  onJoin,
  onNewReport,
  onOpenAuditLogs,
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
          onJoin={onJoin}
        />
      </SectionPanel>

      <SuspensionAnalytics labels={analyticsLabels} suspendedCount={suspendedCount} onOpenAuditLogs={onOpenAuditLogs} />

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
