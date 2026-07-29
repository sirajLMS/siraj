"use client";

import { Grid, Stack } from "@mui/material";
import type { DstMigrationViewModel } from "@/frontend/common/views/dashboard/tools/dst-migration/useDstMigrationViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { CheckedEmptyPanelDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/checkedEmptyPanel.desktop";
import { ConflictErrorsPanelDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/conflictErrorsPanel.desktop";
import { DstMigrationMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/dstMigrationMetricsRow.desktop";
import { UpdatedSessionsSectionDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/updatedSessionsSection.desktop";
import { UpdateSchedulesButtonDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/updateSchedulesButton.desktop";

type Props = Pick<
  DstMigrationViewModel,
  | "labels"
  | "metrics"
  | "updatedSessions"
  | "conflictGroups"
  | "checkedEmptyItems"
  | "migrationStatus"
  | "onUpdate"
  | "dstOffsetDetected"
>;

export function DstMigrationViewDesktop({
  labels,
  metrics,
  updatedSessions,
  conflictGroups,
  checkedEmptyItems,
  migrationStatus,
  onUpdate,
  dstOffsetDetected,
}: Readonly<Props>) {
  const headerActions = (
    <UpdateSchedulesButtonDesktop
      labels={labels}
      status={migrationStatus}
      onUpdate={onUpdate}
      dstOffsetDetected={dstOffsetDetected}
    />
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} actions={headerActions} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <UpdatedSessionsSectionDesktop
            labels={labels}
            sessions={updatedSessions}
            successfulCount={metrics.successful}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} sx={{ alignItems: "stretch" }}>
            <ConflictErrorsPanelDesktop labels={labels} conflictGroups={conflictGroups} />
            <CheckedEmptyPanelDesktop labels={labels} items={checkedEmptyItems} />
          </Stack>
        </Grid>
      </Grid>

      <DstMigrationMetricsRowDesktop labels={labels} metrics={metrics} />
    </DesktopPageContainer>
  );
}
