"use client";

import { VideocamOffOutlined, VideocamOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
import { getStatusLabel, resolveTeacherStatusBadge } from "../utils/sessionStatusUtils";
import { SessionActivateButton } from "./SessionActivateButton";

interface TeacherScheduleCardListProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
}

function renderCardAction(
  row: TeacherScheduleRow,
  labels: TeacherDashboardLabels,
  canActivate: boolean,
  onActivate?: (id: string) => void
) {
  if (row.status === "completed") {
    return (
      <Button fullWidth disabled variant="outlined" sx={{ typography: "labelUppercase" }}>
        {labels.schedule.sessionEnded}
      </Button>
    );
  }

  if (canActivate && (row.status === "pending" || row.status === "connecting")) {
    return (
      <SessionActivateButton
        disabled={!row.activateEnabled}
        isConnecting={row.status === "connecting"}
        activateLabel={labels.actions.activate}
        connectingLabel={labels.actions.connecting}
        onActivate={() => onActivate?.(row.id)}
      />
    );
  }

  const badge = resolveTeacherStatusBadge(row.status);
  return (
    <StatusBadge
      category={badge.category}
      status={badge.status}
      label={getStatusLabel(row.status, labels.status)}
      size="small"
    />
  );
}

export function TeacherScheduleCardList({
  rows,
  labels,
  canActivate,
  onJoinVideo,
  onActivate,
}: Readonly<TeacherScheduleCardListProps>) {
  return (
    <Stack spacing={2}>
      {rows.map(row => {
        const isCompleted = row.status === "completed";
        const badge = resolveTeacherStatusBadge(row.status);

        return (
          <Paper
            key={row.id}
            variant="outlined"
            sx={theme => ({
              p: 2,
              opacity: isCompleted ? 0.7 : 1,
              borderColor: theme.palette.border.light,
              bgcolor: theme.palette.surfaceContainerLowest,
            })}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
              <Box>
                <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                  {row.classId}
                </Typography>
                <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>
                  {row.timeRange}
                </Typography>
              </Box>
              {!canActivate || row.status === "pending" || row.status === "connecting" ? null : (
                <StatusBadge
                  category={badge.category}
                  status={badge.status}
                  label={getStatusLabel(row.status, labels.status)}
                  size="small"
                />
              )}
            </Box>

            <Box
              sx={theme => ({
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1.5,
                mb: 1.5,
                borderTop: `1px dashed ${theme.palette.border.light}`,
                borderBottom: `1px dashed ${theme.palette.border.light}`,
              })}
            >
              <Avatar sx={{ width: 32, height: 32, typography: "labelMd" }}>{row.studentInitials}</Avatar>
              <Typography sx={{ typography: "bodyLg" }}>{row.studentName}</Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Box sx={{ flex: 1 }}>{renderCardAction(row, labels, canActivate, onActivate)}</Box>
              {!isCompleted && (
                <IconButton
                  disabled={!row.videoEnabled}
                  onClick={() => {
                    onJoinVideo(row.id);
                  }}
                  aria-label={labels.actions.joinVideo}
                  sx={theme => ({
                    border: `1px solid ${theme.palette.border.light}`,
                    borderRadius: 1,
                  })}
                >
                  {row.videoEnabled ? <VideocamOutlined /> : <VideocamOffOutlined />}
                </IconButton>
              )}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}
