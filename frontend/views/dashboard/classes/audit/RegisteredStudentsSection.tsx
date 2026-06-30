"use client";

import { FileDownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ExportButton, SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import type { GroupClassStudent } from "@/frontend/graphql/generated/gql/graphql-types";
import { GroupClassAttendanceStatus } from "@/frontend/graphql/generated/gql/graphql-types";

interface RegisteredStudentsSectionProps {
  readonly students: readonly (GroupClassStudent | null)[] | null | undefined;
  readonly registeredCount: number;
  readonly labels: {
    readonly title: string;
    readonly exportList: string;
    readonly studentName: string;
    readonly idNumber: string;
    readonly attendanceStatus: string;
    readonly actions: string;
    readonly pending: string;
    readonly present: string;
    readonly absent: string;
    readonly noEntries: string;
  };
  readonly onExport: () => void;
  readonly onViewStudent: (id: string) => void;
}

const StyledStudentIdText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledViewActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

type AttendanceStatus = "pending" | "present" | "absent";

const ATTENDANCE_STATUS_MAP: Record<GroupClassAttendanceStatus, AttendanceStatus> = {
  [GroupClassAttendanceStatus.Pending]: "pending",
  [GroupClassAttendanceStatus.Present]: "present",
  [GroupClassAttendanceStatus.Absent]: "absent",
  [GroupClassAttendanceStatus.Late]: "pending",
};

function getAttendanceChipProps(
  status: GroupClassAttendanceStatus | null | undefined,
  labels: RegisteredStudentsSectionProps["labels"]
): { label: string } {
  if (status === GroupClassAttendanceStatus.Present) {
    return { label: labels.present };
  }
  if (status === GroupClassAttendanceStatus.Absent) {
    return { label: labels.absent };
  }
  return { label: labels.pending };
}

export function RegisteredStudentsSection({
  students,
  registeredCount,
  labels,
  onExport,
  onViewStudent,
}: RegisteredStudentsSectionProps) {
  const title = labels.title.replace("{count}", String(registeredCount));

  const validStudents = useMemo(() => (students ?? []).filter((s): s is GroupClassStudent => s != null), [students]);

  const columns = useMemo<GridColDef<GroupClassStudent>[]>(
    () => [
      {
        field: "name",
        headerName: labels.studentName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row, api }) => {
          const rowIndex = api.getAllRowIds().indexOf(row.id ?? "");
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
              <Avatar
                sx={theme => ({
                  width: 32,
                  height: 32,
                  typography: "labelUppercase",
                  fontSize: "12px",
                  backgroundColor:
                    rowIndex % 2 === 0 ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
                  color: rowIndex % 2 === 0 ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
                })}
                src={row.avatarUrl ?? undefined}
              >
                {row.initials ?? ""}
              </Avatar>
              <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
                {row.name ?? ""}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "studentId",
        headerName: labels.idNumber,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <StyledStudentIdText variant="bodyMd">{row.studentId ?? ""}</StyledStudentIdText>,
      },
      {
        field: "attendanceStatus",
        headerName: labels.attendanceStatus,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => {
          const attendanceDisplay = row.attendanceStatus ? ATTENDANCE_STATUS_MAP[row.attendanceStatus] : "pending";
          const chip = getAttendanceChipProps(row.attendanceStatus, labels);
          return <StatusBadge category="sessionTracking" status={attendanceDisplay} label={chip.label} />;
        },
      },
      {
        field: "actions",
        headerName: labels.actions,
        width: 100,
        sortable: false,
        align: "right",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <StyledViewActionButton
            size="small"
            onClick={() => {
              if (row.id) {
                onViewStudent(row.id);
              }
            }}
            aria-label={`View ${row.name ?? ""}`}
          >
            <VisibilityOutlined fontSize="small" />
          </StyledViewActionButton>
        ),
      },
    ],
    [labels, onViewStudent]
  );

  return (
    <SectionPanel
      title={title}
      actions={
        <ExportButton id="schedule-alerts-export" startIcon={<FileDownloadOutlined />} onClick={onExport}>
          {labels.exportList}
        </ExportButton>
      }
    >
      <AppDataGrid<GroupClassStudent>
        rows={validStudents}
        columns={columns}
        getRowId={row => row.id ?? ""}
        autoHeight
        ariaLabel="registered-students-table"
        emptyMessage={labels.noEntries}
        rowHeight={80}
      />
    </SectionPanel>
  );
}
