"use client";

import { Grid, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { CheckedEmptyPanel } from "@/frontend/common/views/dashboard/tools/dst-migration/components/CheckedEmptyPanel";
import { ConflictErrorsPanel } from "@/frontend/common/views/dashboard/tools/dst-migration/components/ConflictErrorsPanel";
import { DstMigrationMetricsRow } from "@/frontend/common/views/dashboard/tools/dst-migration/components/DstMigrationMetricsRow";
import { UpdatedSessionsSection } from "@/frontend/common/views/dashboard/tools/dst-migration/components/UpdatedSessionsSection";
import { UpdateSchedulesButton } from "@/frontend/common/views/dashboard/tools/dst-migration/components/UpdateSchedulesButton";
import type {
  CheckedEmptyItem,
  ConflictGroup,
  DstMigrationMetrics,
  MigrationStatus,
  UpdatedSession,
} from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";

interface Props {
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
  readonly migrationStatus: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

export function DstMigrationViewDesktop({
  metrics,
  updatedSessions,
  conflictGroups,
  checkedEmptyItems,
  migrationStatus,
  onUpdate,
  dstOffsetDetected,
}: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");

  const headerActions = (
    <UpdateSchedulesButton status={migrationStatus} onUpdate={onUpdate} dstOffsetDetected={dstOffsetDetected} />
  );

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} actions={headerActions} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <UpdatedSessionsSection sessions={updatedSessions} successfulCount={metrics.successful} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <ConflictErrorsPanel conflictGroups={conflictGroups} />
            <CheckedEmptyPanel items={checkedEmptyItems} />
          </Stack>
        </Grid>
      </Grid>

      <DstMigrationMetricsRow metrics={metrics} />
    </PageContainer>
  );
}
