"use client";

import { FileDownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ExportButton, SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import type { AttendanceStatus, RegisteredStudent } from "@/frontend/stores/mockClassAuditStore";

interface RegisteredStudentsSectionProps {
  readonly students: readonly RegisteredStudent[];
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

// Muted onSurfaceVariant text used for the student ID number cell
const StyledStudentIdText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

// Primary-colored icon button used as the row view action
const StyledViewActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

function getAttendanceChipProps(
  status: AttendanceStatus,
  labels: RegisteredStudentsSectionProps["labels"]
): { label: string } {
  if (status === "present") {
    return { label: labels.present };
  }
  if (status === "absent") {
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

  const columns = useMemo<GridColDef<RegisteredStudent>[]>(
    () => [
      {
        field: "name",
        headerName: labels.studentName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row, api }) => {
          const rowIndex = api.getAllRowIds().indexOf(row.id);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
              <Avatar
                sx={theme => ({
                  width: 32,
                  height: 32,
                  typography: "labelUppercase",
                  fontSize: "12px",
                  bgcolor: rowIndex % 2 === 0 ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
                  color: rowIndex % 2 === 0 ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
                })}
                src={row.avatarUrl}
              >
                {row.initials}
              </Avatar>
              <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
                {row.name}
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
        renderCell: ({ row }) => <StyledStudentIdText variant="bodyMd">{row.studentId}</StyledStudentIdText>,
      },
      {
        field: "attendanceStatus",
        headerName: labels.attendanceStatus,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => {
          const chip = getAttendanceChipProps(row.attendanceStatus, labels);
          return <StatusBadge category="sessionTracking" status={row.attendanceStatus} label={chip.label} />;
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
              onViewStudent(row.id);
            }}
            aria-label={`View ${row.name}`}
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
      <AppDataGrid<RegisteredStudent>
        rows={students}
        columns={columns}
        getRowId={row => row.id}
        autoHeight
        ariaLabel="registered-students-table"
        emptyMessage={labels.noEntries}
        rowHeight={80}
      />
    </SectionPanel>
  );
}
