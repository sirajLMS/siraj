"use client";

import {
  DeleteOutlined,
  EditOutlined,
  FlashOnOutlined,
  HistoryOutlined,
  PauseOutlined,
  PlayArrowOutlined,
} from "@mui/icons-material";
import { Alert, Box, Chip, IconButton, Stack } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import { type CronScheduleFieldsFragment, CronScheduleStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";
import { getCronStatusLabel } from "@/frontend/common/views/dashboard/cron/utils/cron-status-utils";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";

type CronRow = CronScheduleFieldsFragment;

interface MobileScheduleRowProps {
  readonly row: CronRow;
  readonly labels: CronViewProps["labels"];
  readonly canManage: boolean;
  readonly onEdit: (row: CronRow) => void;
  readonly onDelete: (row: CronRow) => void;
  readonly onPause: (row: CronRow) => void;
  readonly onResume: (row: CronRow) => void;
  readonly onTrigger: (row: CronRow) => void;
  readonly onRuns: (row: CronRow) => void;
}

export function MobileScheduleRow({
  row,
  labels,
  canManage,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onTrigger,
  onRuns,
}: MobileScheduleRowProps) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ p: 2, width: "100%", overflow: "hidden" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ typography: "titleLg", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.name}
              </Box>
              <Box sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                {row.cronExpression}
              </Box>
            </Box>
            <StatusBadge
              category="cronScheduleStatus"
              status={row.status ?? CronScheduleStatus.Disabled}
              label={getCronStatusLabel(row.status ?? CronScheduleStatus.Disabled, labels)}
              size="small"
            />
          </Stack>

          {row.description ? (
            <Box sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>{row.description}</Box>
          ) : null}

          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            <Chip size="small" variant="outlined" label={`${labels.colJobKind}: ${row.jobKind ?? ""}`} />
            {row.nextRunAt ? (
              <Chip
                size="small"
                variant="outlined"
                label={`${labels.colNextRun}: ${new Date(row.nextRunAt).toLocaleString()}`}
              />
            ) : null}
          </Stack>

          {canManage ? (
            <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
              <IconButton size="small" aria-label={labels.actionEdit} onClick={() => onEdit(row)}>
                <EditOutlined fontSize="small" />
              </IconButton>
              {row.status === CronScheduleStatus.Active ? (
                <IconButton size="small" aria-label={labels.actionPause} onClick={() => onPause(row)}>
                  <PauseOutlined fontSize="small" />
                </IconButton>
              ) : (
                <IconButton size="small" aria-label={labels.actionResume} onClick={() => onResume(row)}>
                  <PlayArrowOutlined fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" aria-label={labels.actionTrigger} onClick={() => onTrigger(row)}>
                <FlashOnOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={labels.runsTitle} onClick={() => onRuns(row)}>
                <HistoryOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={labels.actionDelete} onClick={() => onDelete(row)}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </MobileCardListItem>
  );
}

export function CronMobileQueueAlerts({
  queueStats,
  queueStatsLoading,
  loading,
  rows,
  labels,
}: {
  readonly queueStats: CronViewProps["queueStats"];
  readonly queueStatsLoading: CronViewProps["queueStatsLoading"];
  readonly loading: CronViewProps["loading"];
  readonly rows: CronViewProps["rows"];
  readonly labels: CronViewProps["labels"];
}) {
  return (
    <>
      {queueStats && !queueStatsLoading ? (
        <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
          {labels.queueStatsTitle} ({queueStats.backend}): {labels.queueStatsPending} = {queueStats.pending},{" "}
          {labels.queueStatsInFlight} = {queueStats.inFlight}, {labels.queueStatsFailed} = {queueStats.failed}
        </Alert>
      ) : null}

      {!loading && rows.length === 0 ? (
        <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
          {labels.pageSubtitle}
        </Alert>
      ) : null}
    </>
  );
}
