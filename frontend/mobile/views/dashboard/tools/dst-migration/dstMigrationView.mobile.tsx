"use client";

import { ReportProblemOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { DstMigrationViewModel } from "@/frontend/common/views/dashboard/tools/dst-migration/useDstMigrationViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { ConflictErrorsPanelMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/conflictErrorsPanel.mobile";
import { DstMigrationMetricsRowMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/dstMigrationMetricsRow.mobile";
import { UpdatedSessionsSectionMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/updatedSessionsSection.mobile";
import { UpdateSchedulesButtonMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/updateSchedulesButton.mobile";
import { useAppTranslation } from "@/shared/locale";

type Props = Pick<
  DstMigrationViewModel,
  "metrics" | "updatedSessions" | "conflictGroups" | "migrationStatus" | "onUpdate" | "dstOffsetDetected"
>;

function MobileInactiveNote() {
  const t = useAppTranslation().dashboardTranslations.dstMigration;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SectionPanel title={t.sections.inactiveVerified} />
      <Box
        sx={theme => ({
          p: 2,
          borderRadius: 3,
          backgroundColor: theme.palette.surfaceContainerLow,
          border: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          gap: 1.5,
        })}
      >
        <ReportProblemOutlined sx={theme => ({ color: theme.palette.warning.main })} />
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.checkedEmpty.inactiveNote}
        </Typography>
      </Box>
    </Box>
  );
}

function MobileConflictsHeader() {
  const t = useAppTranslation().dashboardTranslations.dstMigration;

  return <MobileSectionPanel title={t.sections.conflictsDetected} />;
}

function MobileUpdatedHeader() {
  const t = useAppTranslation().dashboardTranslations.dstMigration;

  return <SectionPanel title={t.sections.successfullyUpdated} />;
}

export function DstMigrationViewMobile({
  metrics,
  updatedSessions,
  conflictGroups,
  migrationStatus,
  onUpdate,
  dstOffsetDetected,
}: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      <Box sx={{ mb: 3 }}>
        <UpdateSchedulesButtonMobile
          status={migrationStatus}
          onUpdate={onUpdate}
          dstOffsetDetected={dstOffsetDetected}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <DstMigrationMetricsRowMobile metrics={metrics} />
      </Box>

      <MobileContentStack>
        <Box>
          <MobileConflictsHeader />
          <ConflictErrorsPanelMobile conflictGroups={conflictGroups} />
        </Box>
        <Box>
          <MobileUpdatedHeader />
          <UpdatedSessionsSectionMobile sessions={updatedSessions} successfulCount={metrics.successful} />
        </Box>
        <MobileInactiveNote />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
