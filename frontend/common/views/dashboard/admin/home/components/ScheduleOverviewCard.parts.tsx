"use client";

import { HistoryOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import type * as React from "react";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import {
  ScheduleSessionCardMetaBar,
  ScheduleSessionCardPersonCell,
  type ScheduleSessionMetaStatItem,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import { StyledScheduleSessionCardActions } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import type { ScheduleOverviewDataHeaders } from "@/frontend/common/views/dashboard/types/dashboard";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

type MetaStatItem = ScheduleSessionMetaStatItem;

export function ScheduleMetaStatBar({ items }: { readonly items: readonly MetaStatItem[] }) {
  return <ScheduleSessionCardMetaBar items={items} />;
}

export function PersonCell(props: React.ComponentProps<typeof ScheduleSessionCardPersonCell>) {
  return <ScheduleSessionCardPersonCell {...props} />;
}

interface ScheduleCardActionsProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewDataHeaders;
  readonly detailsLabel: string;
  readonly studentId: string | undefined;
  readonly classId: string;
}

export function ScheduleCardActions({ row, headers, detailsLabel, studentId, classId }: ScheduleCardActionsProps) {
  const isJoinable = isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
  const joinUrl = isJoinable ? row.meetingJoinUrl : undefined;
  const meeting = isJoinable ? row.effectiveMeeting : undefined;

  return (
    <StyledScheduleSessionCardActions>
      <MeetingJoinAction
        variant="icon"
        joinUrl={joinUrl}
        meeting={meeting}
        label={headers.joinVideo}
        emptyRole="class"
      />
      {studentId ? (
        <Tooltip title={headers.history}>
          <ActionIconLink href={studentProfileTabHref(studentId, "history")} aria-label={headers.history}>
            <HistoryOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
      {classId ? (
        <Tooltip title={detailsLabel}>
          <ActionIconLink href={`/classes/${classId}`} aria-label={detailsLabel}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
    </StyledScheduleSessionCardActions>
  );
}
