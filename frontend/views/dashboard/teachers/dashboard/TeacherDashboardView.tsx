"use client";

import { AddOutlined, PrintOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import type {
  MissedClassAlert,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
} from "@/frontend/stores/mockTeacherDashboardTypes";
import { ParentSupportFab } from "@/frontend/views/dashboard/parents/dashboard/components/ParentSupportFab";
import { ActivationPolicyPanel } from "./components/ActivationPolicyPanel";
import { MissedClassAlertBanner } from "./components/MissedClassAlertBanner";
import { TeacherDashboardMetricsRow } from "./components/TeacherDashboardMetricsRow";
import { TeacherScheduleCardList } from "./components/TeacherScheduleCardList";
import { TeacherScheduleDataGrid } from "./components/TeacherScheduleDataGrid";
import type { TeacherDashboardLabels } from "./types/teacherDashboardLabels";

interface TeacherDashboardViewProps {
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly missedAlert: MissedClassAlert | null;
  readonly scheduleDateLabel: string;
  readonly totalScheduledToday: number;
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly canManualEntry: boolean;
  readonly canPrintSchedule: boolean;
  readonly onPrintSchedule: () => void;
  readonly onManualEntry: () => void;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
  readonly onSupport: () => void;
}

function buildHeaderActions({
  labels,
  canManualEntry,
  canPrintSchedule,
  onPrintSchedule,
  onManualEntry,
}: {
  readonly labels: TeacherDashboardLabels;
  readonly canManualEntry: boolean;
  readonly canPrintSchedule: boolean;
  readonly onPrintSchedule: () => void;
  readonly onManualEntry: () => void;
}) {
  const actions: ReactNode[] = [];

  if (canPrintSchedule) {
    actions.push(
      <Button key="print" startIcon={<PrintOutlined />} onClick={onPrintSchedule} sx={{ typography: "labelUppercase" }}>
        {labels.actions.printSchedule}
      </Button>
    );
  }

  if (canManualEntry) {
    actions.push(
      <PrimaryPageAction key="manual" startIcon={<AddOutlined />} onClick={onManualEntry}>
        {labels.actions.manualEntry}
      </PrimaryPageAction>
    );
  }

  if (actions.length === 0) {
    return undefined;
  }

  return (
    <Stack direction="row" spacing={1.5}>
      {actions}
    </Stack>
  );
}

function formatShowingText(template: string, shown: number, total: number): string {
  return template.replace("{shown}", String(shown)).replace("{total}", String(total));
}

export function TeacherDashboardView({
  metrics,
  scheduleRows,
  missedAlert,
  scheduleDateLabel,
  totalScheduledToday,
  labels,
  canActivate,
  canManualEntry,
  canPrintSchedule,
  onPrintSchedule,
  onManualEntry,
  onJoinVideo,
  onActivate,
  onDownloadHandbook,
  onContactCoordinator,
  onSupport,
}: Readonly<TeacherDashboardViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const headerActions = buildHeaderActions({
    labels,
    canManualEntry,
    canPrintSchedule,
    onPrintSchedule,
    onManualEntry,
  });

  return (
    <>
      {missedAlert && !isMobile && <MissedClassAlertBanner alert={missedAlert} labels={labels.alert} fixed />}

      <PageContainer sx={missedAlert && !isMobile ? { pt: 10 } : undefined}>
        {missedAlert && isMobile && <MissedClassAlertBanner alert={missedAlert} labels={labels.alert} />}

        {isMobile ? (
          <Typography sx={{ typography: "titleLg", color: theme.palette.primary.main, mb: 2 }}>
            {labels.overviewTitle}
          </Typography>
        ) : (
          <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} actions={headerActions} />
        )}

        <Box sx={{ mb: 4 }}>
          <TeacherDashboardMetricsRow metrics={metrics} labels={labels.metrics} isMobile={isMobile} />
        </Box>

        {isMobile ? (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ typography: "titleLg", color: theme.palette.primary.main }}>
                {labels.schedule.title}
              </Typography>
              <Chip
                label={labels.todayChip}
                size="small"
                sx={theme => ({
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.onSecondary,
                })}
              />
            </Box>
            <TeacherScheduleCardList
              rows={scheduleRows}
              labels={labels}
              canActivate={canActivate}
              onJoinVideo={onJoinVideo}
              onActivate={onActivate}
            />
          </Box>
        ) : (
          <SectionPanel title={labels.schedule.title} subTitle={scheduleDateLabel} sx={{ mb: 4 }}>
            <TeacherScheduleDataGrid
              rows={scheduleRows}
              labels={labels}
              canActivate={canActivate}
              emptyMessage={labels.schedule.noEntries}
              onJoinVideo={onJoinVideo}
              onActivate={onActivate}
            />
            <Typography sx={{ typography: "labelMd", color: theme.palette.text.secondary, mt: 2 }}>
              {formatShowingText(labels.schedule.showing, scheduleRows.length, totalScheduledToday)}
            </Typography>
          </SectionPanel>
        )}

        <ActivationPolicyPanel
          labels={labels.policy}
          compact={isMobile}
          onDownloadHandbook={onDownloadHandbook}
          onContactCoordinator={onContactCoordinator}
          actionLabels={labels.actions}
        />

        {!isMobile && <ParentSupportFab label={labels.support.liveSupport} onClick={onSupport} />}
      </PageContainer>
    </>
  );
}
