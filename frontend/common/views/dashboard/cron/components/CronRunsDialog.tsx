"use client";

import { Chip, Dialog, DialogContent, DialogTitle, Stack, Tooltip, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";
import { CronRunStatus, CronTriggerSource } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CronRunFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { safeEnum, safeString } from "@/frontend/common/views/dashboard/cron/utils";
import {
  getCronRunStatusColor,
  getCronRunStatusLabel,
  getCronTriggerSourceLabel,
} from "@/frontend/common/views/dashboard/cron/utils/cron-status-utils";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export interface CronRunsDialogProps {
  readonly open: boolean;
  readonly scheduleName: string | null;
  readonly labels: CronLabels;
  readonly runs: readonly CronRunFieldsFragment[];
  readonly loading: boolean;
  readonly onClose: () => void;
}

export function CronRunsDialog({ open, scheduleName, labels, runs, loading, onClose }: Readonly<CronRunsDialogProps>) {
  const rowsCopy = useMemo(() => [...runs], [runs]);

  const fallbackRowIds = useMemo(() => {
    const map = new WeakMap<object, string>();
    runs.forEach((run, index) => {
      map.set(run, `row-${index}`);
    });
    return map;
  }, [runs]);

  const getRowId = useCallback(
    (row: CronRunFieldsFragment): string => {
      const explicitId = row.id;
      if (typeof explicitId === "string" && explicitId.length > 0) {
        return explicitId;
      }
      const fallback = fallbackRowIds.get(row);
      return typeof fallback === "string" ? fallback : "";
    },
    [fallbackRowIds]
  );

  const columns = useMemo<GridColDef<CronRunFieldsFragment>[]>(
    () => [
      {
        field: "triggerSource",
        headerName: labels.colTriggerSource,
        width: 150,
        valueFormatter: (value: unknown) => {
          if (value == null) {
            return "—";
          }
          const source = safeEnum(value, Object.values(CronTriggerSource));
          return source ? getCronTriggerSourceLabel(source, labels) : safeString(value);
        },
      },
      {
        field: "status",
        headerName: labels.colStatus,
        width: 130,
        renderCell: ({ value }) => {
          const status = safeEnum(value, Object.values(CronRunStatus)) ?? CronRunStatus.Pending;
          return (
            <Chip size="small" color={getCronRunStatusColor(status)} label={getCronRunStatusLabel(status, labels)} />
          );
        },
      },
      {
        field: "attempt",
        headerName: labels.colAttempt,
        width: 90,
        valueFormatter: (value: unknown) => {
          if (value == null) {
            return "—";
          }
          return safeString(value);
        },
      },
      {
        field: "startedAt",
        headerName: labels.colStartedAt,
        width: 180,
        valueFormatter: (value: unknown) => {
          if (value == null) {
            return "—";
          }
          const dateStr = safeString(value);
          return new Date(dateStr).toLocaleString();
        },
      },
      {
        field: "durationMs",
        headerName: labels.colDuration,
        width: 110,
        valueFormatter: (value: unknown) => {
          if (value == null) {
            return "—";
          }
          return `${safeString(value)}ms`;
        },
      },
      {
        field: "errorMessage",
        headerName: labels.colErrorMessage,
        flex: 1,
        minWidth: 200,
        renderCell: ({ value }) => {
          if (value == null) return <Typography variant="bodyMd">—</Typography>;
          const text = safeString(value);
          return (
            <Tooltip title={text}>
              <Typography
                variant="bodyMd"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </Typography>
            </Tooltip>
          );
        },
      },
    ],
    [labels]
  );

  const dialogContent = useMemo(() => {
    if (loading) {
      return (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <Chip label={labels.runsTitle} />
        </Stack>
      );
    }
    if (runs.length === 0) {
      return (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <Chip label={labels.emptyMessage} />
        </Stack>
      );
    }
    return (
      <DataGrid<CronRunFieldsFragment>
        rows={rowsCopy}
        columns={columns}
        getRowId={getRowId}
        loading={loading}
        autoHeight
        hideFooter
        disableRowSelectionOnClick
      />
    );
  }, [loading, runs.length, rowsCopy, columns, labels, getRowId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{scheduleName ? labels.dialogRunsTitle(scheduleName) : labels.runsTitle}</DialogTitle>
      <DialogContent>{dialogContent}</DialogContent>
    </Dialog>
  );
}
