"use client";

import { CheckCircleOutlined, SyncOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useTranslations } from "next-intl";
import type { MigrationStatus } from "@/frontend/stores/dstMigrationStore";

interface Props {
  readonly status: MigrationStatus;
  readonly onUpdate: () => void;
  readonly fullWidth?: boolean;
}

function getButtonLabel(status: MigrationStatus, t: (key: string) => string): string {
  if (status === "running") return t("actions.migrating");
  if (status === "complete") return t("actions.migrationComplete");
  return t("actions.updateSchedules");
}

function getStartIcon(status: MigrationStatus) {
  if (status === "complete") return <CheckCircleOutlined />;
  return <SyncOutlined />;
}

export function UpdateSchedulesButton({ status, onUpdate, fullWidth = false }: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");
  const isRunning = status === "running";
  const isComplete = status === "complete";

  return (
    <Button
      variant={isComplete ? "contained" : "outlined"}
      disabled={isRunning}
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
              bgcolor: theme.palette.success.main,
              color: theme.palette.onSuccess,
              borderColor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
            }
          : {
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.main, color: theme.palette.onPrimary },
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

export function UpdateSchedulesButtonMobile({ status, onUpdate }: Readonly<Omit<Props, "fullWidth">>) {
  const t = useTranslations("dashboard.dstMigration");
  const isRunning = status === "running";
  const isComplete = status === "complete";
  const label = getButtonLabel(status, t);
  const Icon = isComplete ? CheckCircleOutlined : SyncOutlined;

  return (
    <Button
      variant="contained"
      disabled={isRunning}
      onClick={onUpdate}
      fullWidth
      startIcon={<Icon />}
      sx={theme => ({
        py: 2,
        borderRadius: 99,
        fontWeight: 700,
        letterSpacing: "0.1em",
        bgcolor: isComplete ? theme.palette.success.main : theme.palette.primary.main,
        color: theme.palette.onPrimary,
        "&:hover": { bgcolor: isComplete ? theme.palette.success.dark : theme.palette.primary.dark },
        "& .MuiButton-startIcon .MuiSvgIcon-root": isRunning
          ? { animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }
          : undefined,
      })}
    >
      {label}
    </Button>
  );
}
