"use client";

import { Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  type CronRunFieldsFragment,
  CronRunStatus,
  CronTriggerSource,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { safeEnum, safeString } from "@/frontend/common/views/dashboard/cron/utils";
import {
  getCronRunStatusLabel,
  getCronTriggerSourceLabel,
} from "@/frontend/common/views/dashboard/cron/utils/cron-status-utils";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export function buildCronRunsColumns(labels: CronLabels): GridColDef<CronRunFieldsFragment>[] {
  return [
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
          <StatusBadge
            category="cronRunStatus"
            status={status}
            label={getCronRunStatusLabel(status, labels)}
            size="small"
          />
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
  ];
}
