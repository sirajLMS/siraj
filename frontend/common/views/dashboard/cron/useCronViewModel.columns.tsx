"use client";

import {
  DeleteOutlined,
  EditOutlined,
  FlashOnOutlined,
  HistoryOutlined,
  PauseOutlined,
  PlayArrowOutlined,
} from "@mui/icons-material";
import { Chip, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import {
  CronConcurrencyPolicy,
  type CronScheduleFieldsFragment,
  CronScheduleStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { safeEnum, safeString } from "@/frontend/common/views/dashboard/cron/utils";
import { getCronStatusLabel } from "@/frontend/common/views/dashboard/cron/utils/cron-status-utils";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

type CronColumnHandlers = {
  onEdit: (row: CronScheduleFieldsFragment) => void;
  onDelete: (row: CronScheduleFieldsFragment) => void;
  onPause: (row: CronScheduleFieldsFragment) => void;
  onResume: (row: CronScheduleFieldsFragment) => void;
  onTrigger: (row: CronScheduleFieldsFragment) => void;
  onRuns: (row: CronScheduleFieldsFragment) => void;
};

function buildColumns(
  labels: CronLabels,
  canManage: boolean,
  handlers: CronColumnHandlers
): GridColDef<CronScheduleFieldsFragment>[] {
  const cols: GridColDef<CronScheduleFieldsFragment>[] = [
    { field: "name", headerName: labels.colName, flex: 1.2, minWidth: 150 },
    { field: "cronExpression", headerName: labels.colExpression, flex: 1, minWidth: 140 },
    { field: "jobKind", headerName: labels.colJobKind, width: 120 },
    {
      field: "status",
      headerName: labels.colStatus,
      width: 120,
      renderCell: ({ value }) => {
        const status = safeEnum(value, Object.values(CronScheduleStatus)) ?? CronScheduleStatus.Disabled;
        return (
          <StatusBadge
            category="cronScheduleStatus"
            status={status}
            label={getCronStatusLabel(status, labels)}
            size="small"
          />
        );
      },
    },
    {
      field: "nextRunAt",
      headerName: labels.colNextRun,
      width: 180,
      valueFormatter: (value: unknown) => (value ? new Date(safeString(value)).toLocaleString() : "—"),
    },
    {
      field: "lastRunAt",
      headerName: labels.colLastRun,
      width: 180,
      valueFormatter: (value: unknown) => (value ? new Date(safeString(value)).toLocaleString() : "—"),
    },
    {
      field: "concurrencyPolicy",
      headerName: labels.colConcurrencyPolicy,
      width: 140,
      renderCell: ({ value }) => {
        const policy = safeEnum(value, Object.values(CronConcurrencyPolicy));
        if (!policy) return <Typography variant="bodyMd">—</Typography>;
        let label: string;
        if (policy === CronConcurrencyPolicy.Allow) {
          label = labels.concurrencyAllow;
        } else if (policy === CronConcurrencyPolicy.Skip) {
          label = labels.concurrencySkip;
        } else {
          label = labels.concurrencyReplace;
        }
        return <Chip size="small" variant="outlined" label={label} />;
      },
    },
  ];

  if (canManage) {
    cols.push({
      field: "actions",
      headerName: labels.colActions,
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.actionEdit} onClick={() => handlers.onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          {row.status === CronScheduleStatus.Active ? (
            <IconButton size="small" aria-label={labels.actionPause} onClick={() => handlers.onPause(row)}>
              <PauseOutlined fontSize="small" />
            </IconButton>
          ) : (
            <IconButton size="small" aria-label={labels.actionResume} onClick={() => handlers.onResume(row)}>
              <PlayArrowOutlined fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" aria-label={labels.actionTrigger} onClick={() => handlers.onTrigger(row)}>
            <FlashOnOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.runsTitle} onClick={() => handlers.onRuns(row)}>
            <HistoryOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.actionDelete} onClick={() => handlers.onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ),
    });
  }

  return cols;
}

export function useCronColumns(
  labels: CronLabels,
  canManage: boolean,
  handlers: CronColumnHandlers
): GridColDef<CronScheduleFieldsFragment>[] {
  const { onEdit, onDelete, onPause, onResume, onTrigger, onRuns } = handlers;
  return useMemo(
    () => buildColumns(labels, canManage, { onEdit, onDelete, onPause, onResume, onTrigger, onRuns }),
    [labels, canManage, onEdit, onDelete, onPause, onResume, onTrigger, onRuns]
  );
}
