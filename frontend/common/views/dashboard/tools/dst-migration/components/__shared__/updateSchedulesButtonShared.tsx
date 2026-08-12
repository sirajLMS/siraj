"use client";

import { CheckCircleOutlined, SyncOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { MigrationStatus } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

export interface UpdateSchedulesButtonSharedProps {
  readonly labels: DstMigrationLabels;
  readonly status: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

export interface UpdateSchedulesButtonSharedOptions {
  readonly variant: (isComplete: boolean) => "contained" | "outlined";
  readonly fullWidth: boolean;
  readonly buttonSx: (theme: Theme, isComplete: boolean, isRunning: boolean) => Record<string, unknown>;
}

function getButtonLabel(status: MigrationStatus, labels: DstMigrationLabels): string {
  if (status === MigrationStatus.RUNNING) return labels.actions.migrating;
  if (status === MigrationStatus.COMPLETE) return labels.actions.migrationComplete;
  return labels.actions.updateSchedules;
}

function getStartIcon(status: MigrationStatus) {
  if (status === MigrationStatus.COMPLETE) return <CheckCircleOutlined />;
  return <SyncOutlined />;
}

export function UpdateSchedulesButtonShared({
  labels,
  status,
  onUpdate,
  dstOffsetDetected,
  options,
}: Readonly<UpdateSchedulesButtonSharedProps & { readonly options: UpdateSchedulesButtonSharedOptions }>) {
  const isRunning = status === MigrationStatus.RUNNING;
  const isComplete = status === MigrationStatus.COMPLETE;

  return (
    <Button
      variant={options.variant(isComplete)}
      disabled={isRunning || !dstOffsetDetected}
      onClick={onUpdate}
      fullWidth={options.fullWidth}
      startIcon={getStartIcon(status)}
      sx={theme => options.buttonSx(theme, isComplete, isRunning)}
    >
      {getButtonLabel(status, labels)}
    </Button>
  );
}
