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

function getStartIcon(status: MigrationStatus) {
  if (status === MigrationStatus.COMPLETE) return <CheckCircleOutlined />;
  return <SyncOutlined />;
}

export function UpdateSchedulesButtonDesktop({ labels, status, onUpdate, dstOffsetDetected }: Readonly<Props>) {
  const isRunning = status === MigrationStatus.RUNNING;
  const isComplete = status === MigrationStatus.COMPLETE;

  return (
    <Button
      variant={isComplete ? "contained" : "outlined"}
      disabled={isRunning || !dstOffsetDetected}
      onClick={onUpdate}
      startIcon={getStartIcon(status)}
      sx={theme => ({
        px: 4,
        py: 1.5,
        borderRadius: 99,
        fontWeight: 700,
        letterSpacing: "0.1em",
        borderWidth: 2,
        ...(isComplete
          ? {
              backgroundColor: theme.palette.success.main,
              color: theme.palette.onSuccess,
              borderColor: theme.palette.success.main,
              "&:hover": { backgroundColor: theme.palette.success.dark },
            }
          : {
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              "&:hover": { backgroundColor: theme.palette.primary.main, color: theme.palette.onPrimary },
            }),
        "& .MuiButton-startIcon .MuiSvgIcon-root": isRunning
          ? { animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }
          : undefined,
      })}
    >
      {getButtonLabel(status, labels)}
    </Button>
  );
}
