"use client";

import { ScheduleOutlined, VideocamOutlined } from "@mui/icons-material";
import { Avatar, Box, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui";
import type { ParentDashboardLabels } from "../types/parentDashboardLabels";
import type { ParentScheduleRow } from "../types/parentDashboardTypes";

interface ParentScheduleCardListProps {
  readonly rows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardLabels;
  readonly onJoinVideo: (id: string) => void;
}

function formatDuration(template: string, minutes: number): string {
  return template.replace("{minutes}", String(minutes));
}

function formatTeacherLabel(template: string, name: string): string {
  return template.replace("{name}", name);
}

function ScheduleCard({
  row,
  labels,
  onJoinVideo,
}: {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
  readonly onJoinVideo: (id: string) => void;
}) {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 3,
        backgroundColor: theme.palette.surfaceContainerLowest,
        border: `1px solid ${theme.palette.outlineVariant}`,
        boxShadow: theme.palette.shadow.card,
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
          <StatusBadge
            category={row.bookingStatus === "rescheduled" ? "trackingStatus" : "session"}
            status={row.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed"}
            label={labels.bookingStatus[row.bookingStatus]}
          />
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
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar src={row.studentAvatarUrl} alt={row.studentName} sx={{ width: 40, height: 40 }}>
              {row.studentInitials}
            </Avatar>
            <Box>
              <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                {row.studentName}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {formatTeacherLabel(labels.schedule.teacherLabel, row.teacherName)}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={() => {
              onJoinVideo(row.id);
            }}
            disabled={!row.videoEnabled}
            aria-label={labels.schedule.joinVideo}
            sx={theme => ({
              width: 40,
              height: 40,
              backgroundColor: theme.palette.header,
              color: theme.palette.onPrimary,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.surfaceContainer,
                color: theme.palette.onSurfaceVariant,
              },
            })}
          >
            <VideocamOutlined />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

export function ParentScheduleCardList({ rows, labels, onJoinVideo }: Readonly<ParentScheduleCardListProps>) {
  return (
    <Stack spacing={1.5}>
      {rows.map(row => (
        <ScheduleCard key={row.id} row={row} labels={labels} onJoinVideo={onJoinVideo} />
      ))}
    </Stack>
  );
}
