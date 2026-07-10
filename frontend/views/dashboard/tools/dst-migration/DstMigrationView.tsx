"use client";

import { ReportProblemOutlined } from "@mui/icons-material";
import { Box, Grid, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { CheckedEmptyPanel } from "@/frontend/views/dashboard/tools/dst-migration/components/CheckedEmptyPanel";
import { ConflictErrorsPanel } from "@/frontend/views/dashboard/tools/dst-migration/components/ConflictErrorsPanel";
import { DstMigrationMetricsRow } from "@/frontend/views/dashboard/tools/dst-migration/components/DstMigrationMetricsRow";
import { UpdatedSessionsCardList } from "@/frontend/views/dashboard/tools/dst-migration/components/UpdatedSessionsCardList";
import { UpdatedSessionsSection } from "@/frontend/views/dashboard/tools/dst-migration/components/UpdatedSessionsSection";
import {
  UpdateSchedulesButton,
  UpdateSchedulesButtonMobile,
} from "@/frontend/views/dashboard/tools/dst-migration/components/UpdateSchedulesButton";
import type {
  CheckedEmptyItem,
  ConflictGroup,
  DstMigrationMetrics,
  MigrationStatus,
  UpdatedSession,
} from "@/frontend/views/dashboard/tools/dst-migration/dst-migration.types";

interface Props {
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
  readonly migrationStatus: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

function MobileInactiveNote() {
  const t = useTranslations("dashboard.dstMigration");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SectionPanel title={t("sections.inactiveVerified")} />
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
          {t("checkedEmpty.inactiveNote")}
        </Typography>
      </Box>
    </Box>
  );
}

function MobileConflictsHeader() {
  const t = useTranslations("dashboard.dstMigration");

  return <SectionPanel title={t("sections.conflictsDetected")} />;
}

function MobileUpdatedHeader() {
  const t = useTranslations("dashboard.dstMigration");

  return <SectionPanel title={t("sections.successfullyUpdated")} />;
}

export function DstMigrationView({
  metrics,
  updatedSessions,
  conflictGroups,
  checkedEmptyItems,
  migrationStatus,
  onUpdate,
  dstOffsetDetected,
}: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const headerActions = isMobile ? undefined : (
    <UpdateSchedulesButton status={migrationStatus} onUpdate={onUpdate} dstOffsetDetected={dstOffsetDetected} />
  );

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} actions={headerActions} />

      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <UpdateSchedulesButtonMobile
            status={migrationStatus}
            onUpdate={onUpdate}
            dstOffsetDetected={dstOffsetDetected}
          />
        </Box>
      )}

      {isMobile && (
        <Box sx={{ mb: 4 }}>
          <DstMigrationMetricsRow metrics={metrics} />
        </Box>
      )}

      {isMobile ? (
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
      ) : (
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
      )}

      {!isMobile && <DstMigrationMetricsRow metrics={metrics} />}
    </PageContainer>
  );
}
