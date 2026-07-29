"use client";

import { CheckCircleOutlined, SyncOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { MigrationStatus } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly status: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

function getButtonLabel(status: MigrationStatus, labels: DstMigrationLabels): string {
  if (status === MigrationStatus.RUNNING) return labels.actions.migrating;
  if (status === MigrationStatus.COMPLETE) return labels.actions.migrationComplete;
  return labels.actions.updateSchedules;
}

export function UpdateSchedulesButtonMobile({ labels, status, onUpdate, dstOffsetDetected }: Readonly<Props>) {
  const isRunning = status === MigrationStatus.RUNNING;
  const isComplete = status === MigrationStatus.COMPLETE;
  const label = getButtonLabel(status, labels);
  const Icon = isComplete ? CheckCircleOutlined : SyncOutlined;

  return (
    <Button
      variant="contained"
      disabled={isRunning || !dstOffsetDetected}
      onClick={onUpdate}
      fullWidth
      startIcon={<Icon />}
      sx={theme => ({
        py: 2,
        borderRadius: 99,
        fontWeight: 700,
        letterSpacing: "0.1em",
        backgroundColor: isComplete ? theme.palette.success.main : theme.palette.primary.main,
        color: theme.palette.onPrimary,
        "&:hover": { backgroundColor: isComplete ? theme.palette.success.dark : theme.palette.primary.dark },
        "& .MuiButton-startIcon .MuiSvgIcon-root": isRunning
          ? { animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }
          : undefined,
      })}
    >
      {label}
    </Button>
  );
}
