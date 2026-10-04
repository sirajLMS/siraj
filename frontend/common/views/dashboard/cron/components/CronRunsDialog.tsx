"use client";

import { CircularProgress, Dialog, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";
import type { CronRunFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { buildCronRunsColumns } from "@/frontend/common/views/dashboard/cron/components/CronRunsDialog.columns";
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

  const columns = useMemo(() => buildCronRunsColumns(labels), [labels]);

  const dialogContent = useMemo(() => {
    if (loading) {
      return (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <CircularProgress aria-label={labels.runsTitle} />
        </Stack>
      );
    }
    if (runs.length === 0) {
      return (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.emptyMessage}
          </Typography>
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
