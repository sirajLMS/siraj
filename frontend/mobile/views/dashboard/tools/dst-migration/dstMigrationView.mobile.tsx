"use client";

import { ReportProblemOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { ConflictErrorsPanel } from "@/frontend/common/views/dashboard/tools/dst-migration/components/ConflictErrorsPanel";
import { DstMigrationMetricsRow } from "@/frontend/common/views/dashboard/tools/dst-migration/components/DstMigrationMetricsRow";
import { UpdatedSessionsCardList } from "@/frontend/common/views/dashboard/tools/dst-migration/components/UpdatedSessionsCardList";
import { UpdateSchedulesButtonMobile } from "@/frontend/common/views/dashboard/tools/dst-migration/components/UpdateSchedulesButton";
import type {
  ConflictGroup,
  DstMigrationMetrics,
  MigrationStatus,
  UpdatedSession,
} from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { useAppTranslation } from "@/shared/locale/client";

interface Props {
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly migrationStatus: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

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

  return <SectionPanel title={t.sections.conflictsDetected} />;
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
    <PageContainer>
      <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      <Box sx={{ mb: 3 }}>
        <UpdateSchedulesButtonMobile
          status={migrationStatus}
          onUpdate={onUpdate}
          dstOffsetDetected={dstOffsetDetected}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <DstMigrationMetricsRow metrics={metrics} />
      </Box>

      <Stack spacing={4}>
        <Box>
          <MobileConflictsHeader />
          <ConflictErrorsPanel conflictGroups={conflictGroups} />
        </Box>
        <Box>
          <MobileUpdatedHeader />
          <UpdatedSessionsCardList sessions={updatedSessions} successfulCount={metrics.successful} />
        </Box>
        <MobileInactiveNote />
      </Stack>
    </PageContainer>
  );
}
