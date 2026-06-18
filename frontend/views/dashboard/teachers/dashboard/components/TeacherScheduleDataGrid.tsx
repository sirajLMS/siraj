"use client";

import { MoreVertOutlined, VideocamOffOutlined, VideocamOutlined } from "@mui/icons-material";
import { IconButton, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/stores/mockTeacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
import { TeacherScheduleStatusContent } from "./TeacherScheduleStatusContent";
import { TeacherScheduleStudentCell } from "./TeacherScheduleStudentCell";

interface TeacherScheduleDataGridProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly emptyMessage: string;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
}

function formatRowNumber(value: number): string {
  return String(value).padStart(2, "0");
}

function renderStatusCell(
  row: TeacherScheduleRow,
  labels: TeacherDashboardLabels,
  canActivate: boolean,
  onActivate?: (id: string) => void
) {
  return <TeacherScheduleStatusContent row={row} labels={labels} canActivate={canActivate} onActivate={onActivate} />;
}

export function TeacherScheduleDataGrid({
  rows,
  labels,
  canActivate,
  emptyMessage,
  onJoinVideo,
  onActivate,
}: Readonly<TeacherScheduleDataGridProps>) {
  const columns = useMemo<GridColDef<TeacherScheduleRow>[]>(() => {
    return [
      {
        field: "rowNumber",
        headerName: labels.schedule.rowNumber,
        width: 70,
        renderCell: ({ row }) => formatRowNumber(row.rowNumber),
      },
      {
        field: "classId",
        headerName: labels.schedule.classId,
        flex: 1,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Typography sx={{ typography: "bodyMd", fontWeight: 700, color: theme => theme.palette.header }}>
            {row.classId}
          </Typography>
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
        field: "timeRange",
        headerName: labels.schedule.time,
        flex: 1,
        minWidth: 160,
      },
      {
        field: "status",
        headerName: labels.schedule.status,
        flex: 1,
        minWidth: 140,
        sortable: false,
        renderCell: ({ row }) => renderStatusCell(row, labels, canActivate, onActivate),
      },
      {
        field: "contact",
        headerName: labels.schedule.contact,
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) => (
          <Tooltip title={labels.actions.joinVideo}>
            <span>
              <IconButton
                size="small"
                disabled={!row.videoEnabled}
                onClick={() => {
                  onJoinVideo(row.id);
                }}
                aria-label={labels.actions.joinVideo}
              >
                {row.videoEnabled ? <VideocamOutlined /> : <VideocamOffOutlined />}
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
      {
        field: "actions",
        headerName: labels.schedule.actions,
        width: 80,
        align: "right",
        headerAlign: "right",
        sortable: false,
        renderCell: () => (
          <IconButton size="small" aria-label={labels.schedule.actions}>
            <MoreVertOutlined />
          </IconButton>
        ),
      },
    ];
  }, [canActivate, labels, onActivate, onJoinVideo]);

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
      disableRowSelectionOnClick
      autoHeight
    />
  );
}
