"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/stores/mockTeacherDashboardTypes";
import { logger } from "@/frontend/utils/logger";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
import { getStatusLabel, resolveTeacherStatusBadge } from "../utils/sessionStatusUtils";
import { SessionActivateButton } from "./SessionActivateButton";
import { TeacherActiveSessionControls } from "./TeacherActiveSessionControls";
import { TeacherScheduleStudentCell } from "./TeacherScheduleStudentCell";

interface TeacherActiveScheduleDataGridProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly onActivate?: (id: string) => void;
}

function formatDuration(minutes: number | undefined, template: string): string {
  if (!minutes) {
    return "—";
  }
  return template.replace("{minutes}", String(minutes));
}

function renderStatusCell(row: TeacherScheduleRow, labels: TeacherDashboardLabels, onActivate?: (id: string) => void) {
  if (row.status === "pending" || row.status === "connecting") {
    return (
      <SessionActivateButton
        disabled={!row.activateEnabled}
        isConnecting={row.status === "connecting"}
        activateLabel={labels.actions.activateSession}
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

export function TeacherActiveScheduleDataGrid({
  rows,
  labels,
  onActivate,
}: Readonly<TeacherActiveScheduleDataGridProps>) {
  const columns = useMemo<GridColDef<TeacherScheduleRow>[]>(() => {
    return [
      {
        field: "timeRange",
        headerName: labels.schedule.time,
        flex: 1,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Box>
            <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{row.timeRange}</Typography>
            {row.isCurrent && (
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                {labels.schedule.current}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: "studentName",
        headerName: labels.schedule.student,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => <TeacherScheduleStudentCell row={row} />,
      },
      {
        field: "classId",
        headerName: labels.schedule.classId,
        flex: 1,
        minWidth: 120,
      },
      {
        field: "durationMinutes",
        headerName: labels.schedule.duration,
        flex: 0.8,
        minWidth: 100,
        renderCell: ({ row }) => formatDuration(row.durationMinutes, labels.schedule.durationValue),
      },
      {
        field: "status",
        headerName: labels.schedule.status,
        flex: 1,
        minWidth: 130,
        sortable: false,
        renderCell: ({ row }) => renderStatusCell(row, labels, onActivate),
      },
      {
        field: "actions",
        headerName: labels.schedule.actions,
        flex: 1.2,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) => {
          if (row.status !== "activated") {
            return null;
          }
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              <TeacherActiveSessionControls
                labels={labels.activeControls}
                onStart={() => {
                  logger.info("Teacher active start session", { id: row.id });
                }}
                onMarkAbsent={() => {
                  logger.info("Teacher active mark absent", { id: row.id });
                }}
                onRequestLeave={() => {
                  logger.info("Teacher active request leave", { id: row.id });
                }}
              />
            </Box>
          );
        },
      },
    ];
  }, [labels, onActivate]);

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage={labels.schedule.noEntries}
      disableRowSelectionOnClick
      autoHeight
    />
  );
}
