"use client";

import { CheckCircleOutlined, SyncOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { MigrationStatus } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { useAppTranslation } from "@/shared/locale/client";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly status: MigrationStatus;
  readonly onUpdate: () => void;
  readonly fullWidth?: boolean;
  readonly dstOffsetDetected: boolean;
}

function getButtonLabel(status: MigrationStatus, t: DstMigrationLabels): string {
  if (status === MigrationStatus.RUNNING) return t.actions.migrating;
  if (status === MigrationStatus.COMPLETE) return t.actions.migrationComplete;
  return t.actions.updateSchedules;
}

function getStartIcon(status: MigrationStatus) {
  if (status === MigrationStatus.COMPLETE) return <CheckCircleOutlined />;
  return <SyncOutlined />;
}

export function UpdateSchedulesButton({ status, onUpdate, fullWidth = false, dstOffsetDetected }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration;
  const isRunning = status === MigrationStatus.RUNNING;
  const isComplete = status === MigrationStatus.COMPLETE;

  return (
    <Button
      variant={isComplete ? "contained" : "outlined"}
      disabled={isRunning || !dstOffsetDetected}
      onClick={onUpdate}
      startIcon={getStartIcon(status)}
      fullWidth={fullWidth}
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
      {getButtonLabel(status, t)}
    </Button>
  );
}

export function UpdateSchedulesButtonMobile({
  status,
  onUpdate,
  dstOffsetDetected,
}: Readonly<Omit<Props, "fullWidth">>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration;
  const isRunning = status === MigrationStatus.RUNNING;
  const isComplete = status === MigrationStatus.COMPLETE;
  const label = getButtonLabel(status, t);
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
