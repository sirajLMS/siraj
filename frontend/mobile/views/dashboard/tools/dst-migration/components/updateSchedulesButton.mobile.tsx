"use client";

import { CheckCircleOutlined, SyncOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { MigrationStatus } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { type DstMigrationLabels, useAppTranslation } from "@/shared/locale";

interface Props {
  readonly status: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

function getButtonLabel(status: MigrationStatus, t: DstMigrationLabels): string {
  if (status === MigrationStatus.RUNNING) return t.actions.migrating;
  if (status === MigrationStatus.COMPLETE) return t.actions.migrationComplete;
  return t.actions.updateSchedules;
}

export function UpdateSchedulesButtonMobile({ status, onUpdate, dstOffsetDetected }: Readonly<Props>) {
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
