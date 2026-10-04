"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { ActionIconLink as StyledHistoryIconLink } from "@/frontend/common/components/ui";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import {
  StyledActionsCellBox,
  StyledGridDetailsLink,
  StyledMonospaceLabel,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid.styles";
import { ScheduleTimezoneOffsetCell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewHeaders } from "@/frontend/common/views/dashboard/admin/home/types/scheduleColumns.types";
import { formatScheduleYourTime } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";

export function buildTimeColumns(
  showTimezones: boolean,
  headers: ScheduleOverviewHeaders,
  locale: string
): GridColDef<DailyScheduleRow>[] {
  const yourTimeColumn: GridColDef<DailyScheduleRow> = {
    field: "yourTime",
    headerName: headers.yourTime,
    width: 190,
    flex: 1,
    minWidth: 160,
    renderCell: ({ row }) => (
      <StyledMonospaceLabel variant="labelMd">
        {formatScheduleYourTime(row.yourTime, row.studentTime ?? row.teacherTime, locale)}
      </StyledMonospaceLabel>
    ),
  };

  if (!showTimezones) {
    return [yourTimeColumn];
  }

  return [
    yourTimeColumn,
    {
      field: "teacherTime",
      headerName: headers.teacherTime,
      width: 110,
      flex: 0.6,
      minWidth: 96,
      renderCell: ({ row }) => (
        <ScheduleTimezoneOffsetCell
          timeValue={row.teacherTime}
          timezone={row.teacherTimezone}
          at={row.scheduledStartAt}
        />
      ),
    },
    {
      field: "studentTime",
      headerName: headers.studentTime,
      width: 110,
      flex: 0.6,
      minWidth: 96,
      renderCell: ({ row }) => (
        <ScheduleTimezoneOffsetCell
          timeValue={row.studentTime}
          timezone={row.studentTimezone}
          at={row.scheduledStartAt}
        />
      ),
    },
  ];
}

export function buildActionsColumn(
  headers: ScheduleOverviewHeaders,
  detailsLabel: string,
  historyLabel: string
): GridColDef<DailyScheduleRow> {
  return {
    field: "actions",
    headerName: headers.actions,
    width: 140,
    sortable: false,
    align: "center",
    headerAlign: "center",
    flex: 0.6,
    minWidth: 120,
    renderCell: ({ row }) => {
      const studentId = row.student?.id;
      const classId = row.id ?? "";

      return (
        <StyledActionsCellBox>
          {studentId ? (
            <Tooltip title={historyLabel}>
              <StyledHistoryIconLink href={studentProfileTabHref(studentId, "history")} aria-label={historyLabel}>
                <HistoryOutlined fontSize="small" />
              </StyledHistoryIconLink>
            </Tooltip>
          ) : null}
          {classId ? (
            <Tooltip title={detailsLabel}>
              <StyledGridDetailsLink href={`/classes/${classId}`}>{detailsLabel}</StyledGridDetailsLink>
            </Tooltip>
          ) : null}
        </StyledActionsCellBox>
      );
    },
  };
}
