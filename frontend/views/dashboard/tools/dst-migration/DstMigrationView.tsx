"use client";

import { InfoOutlined, ReportProblemOutlined } from "@mui/icons-material";
import { Box, Grid, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { FormSuccessSnackbar, PageContainer, PageHeader } from "@/frontend/components/ui";
import type {
  CheckedEmptyItem,
  ConflictGroup,
  DstMigrationMetrics,
  MigrationStatus,
  UpdatedSession,
} from "@/frontend/stores/dstMigrationStore";
import { CheckedEmptyPanel } from "./components/CheckedEmptyPanel";
import { ConflictErrorsPanel } from "./components/ConflictErrorsPanel";
import { DstMigrationMetricsRow } from "./components/DstMigrationMetricsRow";
import { UpdatedSessionsCardList } from "./components/UpdatedSessionsCardList";
import { UpdatedSessionsSection } from "./components/UpdatedSessionsSection";
import { UpdateSchedulesButton, UpdateSchedulesButtonMobile } from "./components/UpdateSchedulesButton";

interface Props {
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
  readonly migrationStatus: MigrationStatus;
  readonly showSuccess: boolean;
  readonly onUpdate: () => void;
  readonly onDismissSuccess: () => void;
}

function MobileInactiveNote() {
  const t = useTranslations("dashboard.dstMigration");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <InfoOutlined sx={theme => ({ color: theme.palette.warning.main })} />
        <Typography variant="titleLg">{t("sections.inactiveVerified")}</Typography>
      </Stack>
      <Box
        sx={theme => ({
          p: 2,
          borderRadius: 3,
          bgcolor: theme.palette.surfaceContainerLow,
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

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
      <ReportProblemOutlined sx={theme => ({ color: theme.palette.error.main })} />
      <Typography variant="titleLg">{t("sections.conflictsDetected")}</Typography>
    </Stack>
  );
}

function MobileUpdatedHeader() {
  const t = useTranslations("dashboard.dstMigration");

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
      <Typography variant="titleLg">{t("sections.successfullyUpdated")}</Typography>
    </Stack>
  );
}

export function DstMigrationView({
  metrics,
  updatedSessions,
  conflictGroups,
  checkedEmptyItems,
  migrationStatus,
  showSuccess,
  onUpdate,
  onDismissSuccess,
}: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const headerActions = isMobile ? undefined : <UpdateSchedulesButton status={migrationStatus} onUpdate={onUpdate} />;

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} actions={headerActions} />

      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <UpdateSchedulesButtonMobile status={migrationStatus} onUpdate={onUpdate} />
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

      <FormSuccessSnackbar open={showSuccess} message={t("actions.successMessage")} onClose={onDismissSuccess} />
    </PageContainer>
  );
}
