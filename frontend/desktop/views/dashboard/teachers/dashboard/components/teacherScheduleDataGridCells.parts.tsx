"use client";

import { AcUnitOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

export function TimeRangeCell({
  row,
  labels,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
}) {
  return (
    <Box sx={{ alignSelf: "center", display: "flex", alignItems: "center", height: "100%" }}>
      <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{row.timeRange}</Typography>
      {row.isCurrent && (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
          {labels.schedule.current}
        </Typography>
      )}
    </Box>
  );
}

function FrozenStatusCell({ labels }: { readonly labels: TeacherDashboardViewLabels }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Tooltip title={labels.schedule.contactAdmin}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AcUnitOutlined sx={theme => ({ fontSize: 16, color: theme.palette.info.main })} />
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.info.main, fontWeight: 700 }}>
            {labels.schedule.frozen}
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}

export function StatusCell({
  row,
  labels,
  instanceStatusLabels,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}) {
  if (row.isFrozen) {
    return <FrozenStatusCell labels={labels} />;
  }
  return (
    <ScheduleInstanceStatusBadge
      outcome={row.outcome}
      executionState={row.executionState}
      scheduledEndAt={row.scheduledEndAt}
      scheduledStartAt={row.scheduledStartAt}
      durationMinutes={row.durationMinutes}
      statusLabels={instanceStatusLabels}
    />
  );
}
