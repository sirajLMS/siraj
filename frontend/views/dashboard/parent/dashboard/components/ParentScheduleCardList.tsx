"use client";

import { AcUnitOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Card, CardContent, Stack, Tooltip, Typography } from "@mui/material";
import { PaginationControls, PersonProfileLink, StatusBadge } from "@/frontend/common/components/ui";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ParentDashboardLabels } from "@/frontend/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { SchedulePagination } from "@/frontend/views/dashboard/parent/dashboard/useParentDashboardViewModel";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

interface ParentScheduleCardListProps {
  readonly rows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardLabels;
  readonly pagination?: SchedulePagination;
}

function formatDuration(template: string, minutes: number): string {
  return template.replace("{minutes}", String(minutes));
}

function formatTeacherLabel(template: string, name: string): string {
  return template.replace("{name}", name);
}

function ScheduleCard({ row, labels }: { readonly row: ParentScheduleRow; readonly labels: ParentDashboardLabels }) {
  const studentProfileHref = row.studentId ? studentHref(row.studentId) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: row.teacherId });
  const teacherLabel = formatTeacherLabel(labels.schedule.teacherLabel, row.teacherName);

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 3,
        backgroundColor: theme.palette.surfaceContainerLowest,
        border: `1px solid ${row.isFrozen ? theme.palette.info.main : theme.palette.outlineVariant}`,
        boxShadow: theme.palette.shadow.card,
        opacity: row.isFrozen ? 0.85 : 1,
      })}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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
                {formatDuration(labels.schedule.duration, row.durationMinutes)}
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
            <StatusBadge
              category={row.bookingStatus === "rescheduled" ? "trackingStatus" : "session"}
              status={row.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed"}
              label={labels.bookingStatus[row.bookingStatus]}
            />
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
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <PersonProfileLink
              href={studentProfileHref}
              name={row.studentName}
              avatarUrl={row.studentAvatarUrl}
              fallbackInitial={row.studentInitials || "S"}
              avatarSize={40}
              typographyVariant="bodyMd"
              fontWeight={700}
            />
            <PersonProfileLink
              href={teacherProfileHref}
              name={teacherLabel}
              avatarSize={32}
              typographyVariant="labelMd"
              fontWeight={400}
              emphasizeLink={Boolean(teacherProfileHref)}
            />
          </Stack>
          {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen }) ? (
            <MeetingJoinAction
              variant="icon"
              joinUrl={row.meetingJoinUrl}
              meeting={row.effectiveMeeting}
              disabled={!row.videoEnabled}
              label={labels.schedule.joinVideo}
              emptyRole="parent"
            />
          ) : row.isFrozen ? (
            <Tooltip title={labels.schedule.contactAdmin}>
              <AcUnitOutlined sx={theme => ({ fontSize: 22, color: theme.palette.info.main, opacity: 0.7 })} />
            </Tooltip>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}

export function ParentScheduleCardList({ rows, labels, pagination }: Readonly<ParentScheduleCardListProps>) {
  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize)) : 0;

  return (
    <Stack spacing={1.5}>
      {rows.map(row => (
        <ScheduleCard key={row.id} row={row} labels={labels} />
      ))}
      {pagination && pagination.totalCount > 0 && (
        <PaginationControls
          page={pagination.page}
          pageCount={pageCount}
          rowCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          embedded
          onPageChange={pagination.onPageChange}
        />
      )}
    </Stack>
  );
}
