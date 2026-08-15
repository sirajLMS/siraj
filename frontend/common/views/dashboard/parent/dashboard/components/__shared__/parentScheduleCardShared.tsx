import { AcUnitOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function resolveMeetingUrlStatus(row: ParentScheduleRow): "failed" | "generated" | "pending" | null {
  if (row.isFrozen) return "failed";
  if (!row.videoEnabled && !row.meetingJoinUrl) return null;
  if (row.meetingJoinUrl !== null && row.meetingJoinUrl !== undefined) return "generated";
  return "pending";
}

export interface ScheduleCardJoinActionRenderProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
  readonly canJoin: boolean;
  readonly frozenFallback: ReactNode;
}

export interface ParentScheduleCardSharedOptions {
  readonly profileSectionSx: SxProps<Theme>;
  readonly renderContainer: (children: ReactNode, row: ParentScheduleRow) => ReactNode;
  readonly renderStatusBadge: (row: ParentScheduleRow, labels: ParentDashboardLabels) => ReactNode;
  readonly renderProfileLinks: (
    row: ParentScheduleRow,
    labels: ParentDashboardLabels,
    studentProfileHref: string | undefined,
    teacherProfileHref: string | undefined,
    teacherLabel: string
  ) => ReactNode;
  readonly renderJoinAction?: (props: Readonly<ScheduleCardJoinActionRenderProps>) => ReactNode;
}

export interface ParentScheduleCardSharedProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
  readonly options: ParentScheduleCardSharedOptions;
}

function computeCanJoin(row: ParentScheduleRow): boolean {
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen });
}

function renderFrozenFallback(labels: ParentDashboardLabels): ReactNode {
  return (
    <Tooltip title={labels.schedule.contactAdmin}>
      <AcUnitOutlined sx={theme => ({ fontSize: 22, color: theme.palette.info.main, opacity: 0.7 })} />
    </Tooltip>
  );
}

function renderScheduleCardJoinAction({
  row,
  labels,
  canJoin,
  frozenFallback,
}: ScheduleCardJoinActionRenderProps): ReactNode {
  let result: ReactNode = null;
  if (row.isFrozen) {
    result = frozenFallback;
  } else if (canJoin) {
    result = (
      <MeetingUrlCell
        meetingUrl={row.meetingJoinUrl}
        meetingUrlStatus={resolveMeetingUrlStatus(row)}
        joinLabel={labels.schedule.joinVideo}
        compact
      />
    );
  }
  return result;
}

export function ParentScheduleCardShared({ row, labels, options }: Readonly<ParentScheduleCardSharedProps>): ReactNode {
  const studentProfileHref = row.studentId ? studentHref(row.studentId) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: row.teacherId });
  const teacherLabel = labels.schedule.teacherLabel(row.teacherName);
  const canJoin = computeCanJoin(row);

  const content = (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={theme => ({
              p: 1,
              borderRadius: 2,
              backgroundColor: theme.palette.secondaryContainer,
              display: "flex",
            })}
          >
            <ScheduleOutlined sx={theme => ({ color: theme.palette.onSecondaryContainer })} />
          </Box>
          <Box>
            <Typography variant="bodyMd" sx={{ fontWeight: 700, color: theme => theme.palette.primary.main }}>
              {row.classTime}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.schedule.duration(row.durationMinutes)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {row.isFrozen ? (
            <Tooltip title={labels.schedule.contactAdmin}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AcUnitOutlined sx={theme => ({ fontSize: 18, color: theme.palette.info.main })} />
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.info.main, fontWeight: 700 })}>
                  {labels.schedule.frozen}
                </Typography>
              </Box>
            </Tooltip>
          ) : null}
          {options.renderStatusBadge(row, labels)}
        </Stack>
      </Box>

      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2,
          borderTop: `1px dashed ${theme.palette.outlineVariant}`,
        })}
      >
        <Stack spacing={0.25} sx={options.profileSectionSx}>
          {options.renderProfileLinks(row, labels, studentProfileHref, teacherProfileHref, teacherLabel)}
        </Stack>
        {(options.renderJoinAction ?? renderScheduleCardJoinAction)({
          row,
          labels,
          canJoin,
          frozenFallback: renderFrozenFallback(labels),
        })}
      </Box>
    </>
  );

  return options.renderContainer(content, row);
}
